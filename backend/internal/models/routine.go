package models

import "time"

// TimerConfig se almacena como JSONB en Supabase; usa camelCase
// para coincidir con las claves guardadas en el seed.
type TimerConfig struct {
	Rounds                  int `json:"rounds"`
	WorkSeconds             int `json:"workSeconds"`
	RestSeconds             int `json:"restSeconds"`
	PrepSeconds             int `json:"prepSeconds"`
	InhaleSeconds           int `json:"inhaleSeconds,omitempty"`
	Hold1Seconds            int `json:"hold1Seconds,omitempty"`
	ExhaleSeconds           int `json:"exhaleSeconds,omitempty"`
	Hold2Seconds            int `json:"hold2Seconds,omitempty"`
	ShortBreakSeconds       int `json:"shortBreakSeconds,omitempty"`
	LongBreakSeconds        int `json:"longBreakSeconds,omitempty"`
	SessionsBeforeLongBreak int `json:"sessionsBeforeLongBreak,omitempty"`
}

// CustomTexts se almacena como JSONB en Supabase; usa camelCase.
type CustomTexts struct {
	WorkLabel         string `json:"workLabel,omitempty"`
	RestLabel         string `json:"restLabel,omitempty"`
	PrepLabel         string `json:"prepLabel,omitempty"`
	CompletionMessage string `json:"completionMessage,omitempty"`
	WorkPhaseName     string `json:"workPhaseName,omitempty"`
	RestPhaseName     string `json:"restPhaseName,omitempty"`
}

// Routine representa una rutina de timer. Las columnas de Supabase son snake_case.
type Routine struct {
	ID           string      `json:"id,omitempty"`
	UserID       string      `json:"user_id,omitempty"`
	Type         string      `json:"type"`
	Title        string      `json:"title"`
	Description  string      `json:"description"`
	Config       TimerConfig `json:"config"`
	Texts        CustomTexts `json:"texts"`
	IsPublic     bool        `json:"is_public"`
	IsBuiltIn    bool        `json:"is_built_in"`
	LikeCount    int         `json:"like_count"`
	ClonedFromID *string     `json:"cloned_from_id,omitempty"`
	Tags         []string    `json:"tags"`
	IconEmoji    string      `json:"icon_emoji"`
	CreatedAt    *time.Time  `json:"created_at,omitempty"`
	UpdatedAt    *time.Time  `json:"updated_at,omitempty"`
}

// RoutineRequest es el DTO para crear/actualizar (el user_id viene del token).
type RoutineRequest struct {
	Type        string      `json:"type"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Config      TimerConfig `json:"config"`
	Texts       CustomTexts `json:"texts"`
	IsPublic    bool        `json:"is_public"`
	Tags        []string    `json:"tags"`
	IconEmoji   string      `json:"icon_emoji"`
}
