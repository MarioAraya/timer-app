package models

import "time"

// ProgressEntry registra una sesión completada (parcial o total).
type ProgressEntry struct {
	ID              string     `json:"id,omitempty"`
	UserID          string     `json:"user_id,omitempty"`
	RoutineID       string     `json:"routine_id"`
	RoutineType     string     `json:"routine_type"`
	RoutineTitle    string     `json:"routine_title"`
	RoundsCompleted int        `json:"rounds_completed"`
	TotalRounds     int        `json:"total_rounds"`
	ActiveSeconds   int        `json:"active_seconds"`
	TotalSeconds    int        `json:"total_seconds"`
	Completed       bool       `json:"completed"`
	SessionDate     *time.Time `json:"session_date,omitempty"`
}

// ProgressRequest es el DTO de entrada para registrar una sesión.
type ProgressRequest struct {
	RoutineID       string `json:"routine_id"`
	RoutineType     string `json:"routine_type"`
	RoutineTitle    string `json:"routine_title"`
	RoundsCompleted int    `json:"rounds_completed"`
	TotalRounds     int    `json:"total_rounds"`
	ActiveSeconds   int    `json:"active_seconds"`
	TotalSeconds    int    `json:"total_seconds"`
	Completed       bool   `json:"completed"`
}

// UserStats resume las estadísticas acumuladas de un usuario.
type UserStats struct {
	TotalSessions      int            `json:"total_sessions"`
	CompletedSessions  int            `json:"completed_sessions"`
	TotalActiveSeconds int            `json:"total_active_seconds"`
	CurrentStreak      int            `json:"current_streak"`
	LongestStreak      int            `json:"longest_streak"`
	LastSessionDate    *time.Time     `json:"last_session_date,omitempty"`
	SessionsByType     map[string]int `json:"sessions_by_type"`
}
