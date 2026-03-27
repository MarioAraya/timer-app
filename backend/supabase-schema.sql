-- ============================================================
-- Timer App — Schema de Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- TABLA: routines
-- Almacena presets built-in y rutinas personalizadas de usuarios
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routines (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('hiit', 'tabata', 'pomodoro', 'breathing')),
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    config      JSONB NOT NULL DEFAULT '{}',
    texts       JSONB NOT NULL DEFAULT '{}',
    is_public   BOOLEAN DEFAULT FALSE,
    is_built_in BOOLEAN DEFAULT FALSE,
    like_count  INTEGER DEFAULT 0,
    cloned_from_id UUID REFERENCES routines(id) ON DELETE SET NULL,
    tags        TEXT[] DEFAULT '{}',
    icon_emoji  TEXT DEFAULT '⏱️',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_public ON routines(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_routines_is_built_in ON routines(is_built_in) WHERE is_built_in = TRUE;
CREATE INDEX IF NOT EXISTS idx_routines_type ON routines(type);
CREATE INDEX IF NOT EXISTS idx_routines_like_count ON routines(like_count DESC);

-- ─────────────────────────────────────────────────────────────
-- TABLA: likes
-- Registro de likes únicos por usuario/rutina
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id  UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(routine_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_routine_id ON likes(routine_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- ─────────────────────────────────────────────────────────────
-- TABLA: progress
-- Historial de sesiones completadas por usuario
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_id       TEXT NOT NULL,   -- puede ser UUID de routine o preset built-in
    routine_type     TEXT NOT NULL,
    routine_title    TEXT DEFAULT '',
    rounds_completed INTEGER DEFAULT 0,
    total_rounds     INTEGER DEFAULT 0,
    active_seconds   INTEGER DEFAULT 0,
    total_seconds    INTEGER DEFAULT 0,
    completed        BOOLEAN DEFAULT FALSE,
    session_date     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_session_date ON progress(user_id, session_date DESC);

-- ─────────────────────────────────────────────────────────────
-- FUNCIONES RPC para likes atómicos
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_like(routine_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE routines SET like_count = like_count + 1 WHERE id = routine_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_like(routine_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE routines SET like_count = GREATEST(like_count - 1, 0) WHERE id = routine_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Rutinas: cualquiera ve built-ins y públicas, solo dueño ve las privadas
CREATE POLICY "Ver presets built-in" ON routines
    FOR SELECT USING (is_built_in = TRUE);

CREATE POLICY "Ver rutinas públicas" ON routines
    FOR SELECT USING (is_public = TRUE AND is_built_in = FALSE);

CREATE POLICY "Ver mis rutinas" ON routines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Crear mis rutinas" ON routines
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_built_in = FALSE);

CREATE POLICY "Editar mis rutinas" ON routines
    FOR UPDATE USING (auth.uid() = user_id AND is_built_in = FALSE);

CREATE POLICY "Eliminar mis rutinas" ON routines
    FOR DELETE USING (auth.uid() = user_id AND is_built_in = FALSE);

-- Likes: usuarios autenticados pueden ver y gestionar sus likes
CREATE POLICY "Ver likes" ON likes
    FOR SELECT USING (TRUE);

CREATE POLICY "Dar like" ON likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Quitar mi like" ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- Progreso: solo el dueño
CREATE POLICY "Ver mi progreso" ON progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Guardar mi progreso" ON progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- SEED: Presets built-in
-- ─────────────────────────────────────────────────────────────
INSERT INTO routines (id, user_id, type, title, description, config, texts, is_built_in, is_public, icon_emoji, tags)
VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    NULL,
    'hiit',
    'HIIT Clásico',
    '12 rondas de alta intensidad: 40s de trabajo máximo y 20s de recuperación.',
    '{"rounds":12,"workSeconds":40,"restSeconds":20,"prepSeconds":10}',
    '{"workLabel":"¡Quémalo!","restLabel":"Respira","prepLabel":"¡Prepárate!","completionMessage":"¡Lo lograste! 🔥 12 rondas completadas","workPhaseName":"Trabajo","restPhaseName":"Descanso"}',
    TRUE, TRUE, '🔥', '{"hiit","intenso","cardio"}'
),
(
    'a1000000-0000-0000-0000-000000000002',
    NULL,
    'tabata',
    'Tabata Estándar',
    'El protocolo Tabata original: 8 rondas de 20s al máximo y 10s de descanso.',
    '{"rounds":8,"workSeconds":20,"restSeconds":10,"prepSeconds":10}',
    '{"workLabel":"¡Todo!","restLabel":"10s","prepLabel":"¡Vamos!","completionMessage":"¡Tabata completado! ⚡ Eres increíble","workPhaseName":"Sprint","restPhaseName":"Recupera"}',
    TRUE, TRUE, '⚡', '{"tabata","intenso","protocolo-oficial"}'
),
(
    'a1000000-0000-0000-0000-000000000003',
    NULL,
    'pomodoro',
    'Pomodoro Clásico',
    'Técnica Pomodoro: 25 minutos de foco total y 5 minutos de descanso.',
    '{"rounds":4,"workSeconds":1500,"restSeconds":300,"prepSeconds":0,"shortBreakSeconds":300,"longBreakSeconds":900,"sessionsBeforeLongBreak":4}',
    '{"workLabel":"Modo foco","restLabel":"Tómate un break","completionMessage":"¡4 Pomodoros completados! Mereces un descanso largo 🍅","workPhaseName":"Foco","restPhaseName":"Break"}',
    TRUE, TRUE, '🍅', '{"pomodoro","productividad","foco"}'
),
(
    'a1000000-0000-0000-0000-000000000004',
    NULL,
    'breathing',
    'Respiración en Caja',
    'Técnica 4-4-4-4: inhala, sostén, exhala y sostén 4 segundos cada fase.',
    '{"rounds":8,"workSeconds":16,"restSeconds":0,"prepSeconds":5,"inhaleSeconds":4,"hold1Seconds":4,"exhaleSeconds":4,"hold2Seconds":4}',
    '{"workLabel":"Inhala... sostén... exhala...","restLabel":"Descansa","completionMessage":"Mente y cuerpo en calma 🫁","workPhaseName":"Respiración","restPhaseName":"Pausa"}',
    TRUE, TRUE, '🫁', '{"respiración","calma","box-breathing"}'
),
(
    'a1000000-0000-0000-0000-000000000005',
    NULL,
    'breathing',
    'Respiración 4-7-8',
    'Técnica relajante: inhala 4s, sostén 7s, exhala 8s. Ideal para dormir.',
    '{"rounds":6,"workSeconds":19,"restSeconds":0,"prepSeconds":5,"inhaleSeconds":4,"hold1Seconds":7,"exhaleSeconds":8,"hold2Seconds":0}',
    '{"workLabel":"Respira profundo","restLabel":"Pausa","completionMessage":"Listo para descansar 🌙","workPhaseName":"Respiración","restPhaseName":"Pausa"}',
    TRUE, TRUE, '🌙', '{"respiración","relajación","sueño"}'
)
ON CONFLICT (id) DO NOTHING;
