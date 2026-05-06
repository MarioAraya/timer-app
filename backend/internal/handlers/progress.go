package handlers

import (
	"net/http"
	"sort"
	"time"

	"timer-app/backend/internal/auth"
	"timer-app/backend/internal/db"
	"timer-app/backend/internal/models"
)

type ProgressHandler struct {
	db *db.Client
}

func NewProgressHandler(db *db.Client) *ProgressHandler {
	return &ProgressHandler{db: db}
}

// POST /api/progress — requiere auth
func (h *ProgressHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)

	var req models.ProgressRequest
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "cuerpo de petición inválido")
		return
	}

	now := time.Now().UTC()
	body := map[string]any{
		"user_id":          userID,
		"routine_id":       req.RoutineID,
		"routine_type":     req.RoutineType,
		"routine_title":    req.RoutineTitle,
		"rounds_completed": req.RoundsCompleted,
		"total_rounds":     req.TotalRounds,
		"active_seconds":   req.ActiveSeconds,
		"total_seconds":    req.TotalSeconds,
		"completed":        req.Completed,
		"session_date":     now,
	}

	var created models.ProgressEntry
	if err := h.db.Post("/progress", body, &created); err != nil {
		writeError(w, http.StatusInternalServerError, "error al registrar sesión")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// GET /api/progress — requiere auth
func (h *ProgressHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)

	var entries []models.ProgressEntry
	if err := h.db.Get("/progress?user_id=eq."+userID+"&order=session_date.desc", &entries); err != nil {
		writeError(w, http.StatusInternalServerError, "error al obtener historial")
		return
	}
	writeJSON(w, http.StatusOK, entries)
}

// GET /api/progress/stats — requiere auth
func (h *ProgressHandler) Stats(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)

	var entries []models.ProgressEntry
	if err := h.db.Get("/progress?user_id=eq."+userID+"&order=session_date.asc", &entries); err != nil {
		writeError(w, http.StatusInternalServerError, "error al calcular estadísticas")
		return
	}

	stats := computeStats(entries)
	writeJSON(w, http.StatusOK, stats)
}

// computeStats calcula las estadísticas del usuario a partir de sus entradas de progreso.
func computeStats(entries []models.ProgressEntry) models.UserStats {
	stats := models.UserStats{
		SessionsByType: make(map[string]int),
	}

	if len(entries) == 0 {
		return stats
	}

	// Recopilar fechas únicas de sesiones completadas para el streak
	dateSet := map[string]bool{}

	for _, e := range entries {
		stats.TotalSessions++
		stats.TotalActiveSeconds += e.ActiveSeconds
		stats.SessionsByType[e.RoutineType]++

		if e.Completed {
			stats.CompletedSessions++
		}
		if e.SessionDate != nil {
			dateSet[e.SessionDate.Format("2006-01-02")] = true
			if stats.LastSessionDate == nil || e.SessionDate.After(*stats.LastSessionDate) {
				t := *e.SessionDate
				stats.LastSessionDate = &t
			}
		}
	}

	// Calcular streaks
	stats.CurrentStreak, stats.LongestStreak = calculateStreaks(dateSet)
	return stats
}

func calculateStreaks(dateSet map[string]bool) (current, longest int) {
	if len(dateSet) == 0 {
		return 0, 0
	}

	dates := make([]string, 0, len(dateSet))
	for d := range dateSet {
		dates = append(dates, d)
	}
	sort.Strings(dates)

	streak := 1
	for i := 1; i < len(dates); i++ {
		prev, _ := time.Parse("2006-01-02", dates[i-1])
		curr, _ := time.Parse("2006-01-02", dates[i])
		if curr.Sub(prev) == 24*time.Hour {
			streak++
		} else {
			if streak > longest {
				longest = streak
			}
			streak = 1
		}
	}
	if streak > longest {
		longest = streak
	}

	// ¿El streak actual llega hasta hoy o ayer?
	today := time.Now().UTC().Format("2006-01-02")
	yesterday := time.Now().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	last := dates[len(dates)-1]

	if last == today || last == yesterday {
		// Contar hacia atrás desde el último día
		current = 1
		for i := len(dates) - 2; i >= 0; i-- {
			prev, _ := time.Parse("2006-01-02", dates[i])
			next, _ := time.Parse("2006-01-02", dates[i+1])
			if next.Sub(prev) == 24*time.Hour {
				current++
			} else {
				break
			}
		}
	}

	return current, longest
}
