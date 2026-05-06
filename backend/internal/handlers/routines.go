package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"timer-app/backend/internal/auth"
	"timer-app/backend/internal/db"
	"timer-app/backend/internal/models"
)

type RoutinesHandler struct {
	db *db.Client
}

func NewRoutinesHandler(db *db.Client) *RoutinesHandler {
	return &RoutinesHandler{db: db}
}

// GET /api/routines/public
func (h *RoutinesHandler) ListPublic(w http.ResponseWriter, r *http.Request) {
	var routines []models.Routine
	if err := h.db.Get("/routines?is_public=eq.true&is_built_in=eq.false&order=like_count.desc,created_at.desc", &routines); err != nil {
		writeError(w, http.StatusInternalServerError, "error al obtener rutinas públicas")
		return
	}
	writeJSON(w, http.StatusOK, routines)
}

// GET /api/users/{userId}/routines
func (h *RoutinesHandler) ListByUser(w http.ResponseWriter, r *http.Request) {
	targetID := chi.URLParam(r, "userId")
	callerID := auth.GetUserID(r)

	// Si es el propio usuario autenticado: devuelve todas sus rutinas.
	// Si es otro usuario: solo las públicas.
	filter := fmt.Sprintf("/routines?user_id=eq.%s&is_built_in=eq.false", targetID)
	if callerID != targetID {
		filter += "&is_public=eq.true"
	}
	filter += "&order=created_at.desc"

	var routines []models.Routine
	if err := h.db.Get(filter, &routines); err != nil {
		writeError(w, http.StatusInternalServerError, "error al obtener rutinas del usuario")
		return
	}
	writeJSON(w, http.StatusOK, routines)
}

// GET /api/routines — requiere auth
func (h *RoutinesHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	var routines []models.Routine
	if err := h.db.Get("/routines?user_id=eq."+userID+"&is_built_in=eq.false&order=created_at.desc", &routines); err != nil {
		writeError(w, http.StatusInternalServerError, "error al obtener rutinas")
		return
	}
	writeJSON(w, http.StatusOK, routines)
}

// POST /api/routines — requiere auth
func (h *RoutinesHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)

	var req models.RoutineRequest
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "cuerpo de petición inválido")
		return
	}
	if req.Type == "" || req.Title == "" {
		writeError(w, http.StatusBadRequest, "type y title son obligatorios")
		return
	}

	now := time.Now().UTC()
	body := map[string]any{
		"user_id":     userID,
		"type":        req.Type,
		"title":       req.Title,
		"description": req.Description,
		"config":      req.Config,
		"texts":       req.Texts,
		"is_public":   req.IsPublic,
		"is_built_in": false,
		"tags":        req.Tags,
		"icon_emoji":  req.IconEmoji,
		"created_at":  now,
		"updated_at":  now,
	}

	var created models.Routine
	if err := h.db.Post("/routines", body, &created); err != nil {
		writeError(w, http.StatusInternalServerError, "error al crear rutina")
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

// PUT /api/routines/{id} — requiere auth
func (h *RoutinesHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	id := chi.URLParam(r, "id")

	var req models.RoutineRequest
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "cuerpo de petición inválido")
		return
	}

	body := map[string]any{
		"type":        req.Type,
		"title":       req.Title,
		"description": req.Description,
		"config":      req.Config,
		"texts":       req.Texts,
		"is_public":   req.IsPublic,
		"tags":        req.Tags,
		"icon_emoji":  req.IconEmoji,
		"updated_at":  time.Now().UTC(),
	}

	// Filtrar por id Y user_id para que solo el dueño pueda editar
	path := fmt.Sprintf("/routines?id=eq.%s&user_id=eq.%s", id, userID)
	var updated models.Routine
	if err := h.db.Patch(path, body, &updated); err != nil {
		writeError(w, http.StatusInternalServerError, "error al actualizar rutina")
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

// DELETE /api/routines/{id} — requiere auth
func (h *RoutinesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	id := chi.URLParam(r, "id")

	path := fmt.Sprintf("/routines?id=eq.%s&user_id=eq.%s", id, userID)
	if err := h.db.Delete(path); err != nil {
		writeError(w, http.StatusInternalServerError, "error al eliminar rutina")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/routines/{id}/clone — requiere auth
func (h *RoutinesHandler) Clone(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	id := chi.URLParam(r, "id")

	// Buscar la rutina original (pública o del propio usuario)
	var originals []models.Routine
	path := fmt.Sprintf("/routines?id=eq.%s", id)
	if err := h.db.Get(path, &originals); err != nil || len(originals) == 0 {
		writeError(w, http.StatusNotFound, "rutina no encontrada")
		return
	}
	orig := originals[0]

	// Solo se puede clonar una rutina pública o propia
	if !orig.IsPublic && orig.UserID != userID {
		writeError(w, http.StatusForbidden, "no tienes permiso para clonar esta rutina")
		return
	}

	now := time.Now().UTC()
	clonedFrom := orig.ID
	body := map[string]any{
		"user_id":        userID,
		"type":           orig.Type,
		"title":          orig.Title + " (copia)",
		"description":    orig.Description,
		"config":         orig.Config,
		"texts":          orig.Texts,
		"is_public":      false,
		"is_built_in":    false,
		"tags":           orig.Tags,
		"icon_emoji":     orig.IconEmoji,
		"cloned_from_id": clonedFrom,
		"created_at":     now,
		"updated_at":     now,
	}

	var cloned models.Routine
	if err := h.db.Post("/routines", body, &cloned); err != nil {
		writeError(w, http.StatusInternalServerError, "error al clonar rutina")
		return
	}
	writeJSON(w, http.StatusCreated, cloned)
}
