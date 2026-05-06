package handlers

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"

	"timer-app/backend/internal/auth"
	"timer-app/backend/internal/db"
)

type SocialHandler struct {
	db *db.Client
}

func NewSocialHandler(db *db.Client) *SocialHandler {
	return &SocialHandler{db: db}
}

// POST /api/routines/{id}/like — requiere auth
func (h *SocialHandler) Like(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	routineID := chi.URLParam(r, "id")

	// Insertar en likes; el índice UNIQUE(routine_id, user_id) previene duplicados.
	// Usar Prefer: resolution=ignore-duplicates para idempotencia.
	body := map[string]string{
		"user_id":    userID,
		"routine_id": routineID,
	}
	var result any
	if err := h.db.Post("/likes?on_conflict=routine_id,user_id", body, &result); err != nil {
		// Si ya existe el like, no es un error fatal
		// igualmente actualizamos el contador via RPC
	}

	// Incrementar contador atómicamente
	_ = h.db.RPC("increment_like", map[string]string{"routine_id": routineID}, nil)

	writeJSON(w, http.StatusOK, map[string]bool{"liked": true})
}

// DELETE /api/routines/{id}/like — requiere auth
func (h *SocialHandler) Unlike(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	routineID := chi.URLParam(r, "id")

	path := fmt.Sprintf("/likes?user_id=eq.%s&routine_id=eq.%s", userID, routineID)
	if err := h.db.Delete(path); err != nil {
		writeError(w, http.StatusInternalServerError, "error al quitar like")
		return
	}

	// Decrementar contador atómicamente
	_ = h.db.RPC("decrement_like", map[string]string{"routine_id": routineID}, nil)

	writeJSON(w, http.StatusOK, map[string]bool{"liked": false})
}

// GET /api/routines/{id}/like — requiere auth
func (h *SocialHandler) Status(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	routineID := chi.URLParam(r, "id")

	path := fmt.Sprintf("/likes?user_id=eq.%s&routine_id=eq.%s&select=id", userID, routineID)
	var rows []map[string]string
	if err := h.db.Get(path, &rows); err != nil {
		writeError(w, http.StatusInternalServerError, "error al consultar like")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"liked": len(rows) > 0})
}
