package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"timer-app/backend/internal/db"
	"timer-app/backend/internal/models"
)

type PresetsHandler struct {
	db *db.Client
}

func NewPresetsHandler(db *db.Client) *PresetsHandler {
	return &PresetsHandler{db: db}
}

// GET /api/presets
func (h *PresetsHandler) List(w http.ResponseWriter, r *http.Request) {
	var presets []models.Routine
	if err := h.db.Get("/routines?is_built_in=eq.true&order=created_at.asc", &presets); err != nil {
		writeError(w, http.StatusInternalServerError, "error al obtener presets")
		return
	}
	writeJSON(w, http.StatusOK, presets)
}

// GET /api/presets/{id}
func (h *PresetsHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var presets []models.Routine
	if err := h.db.Get("/routines?id=eq."+id+"&is_built_in=eq.true", &presets); err != nil {
		writeError(w, http.StatusInternalServerError, "error al obtener preset")
		return
	}
	if len(presets) == 0 {
		writeError(w, http.StatusNotFound, "preset no encontrado")
		return
	}
	writeJSON(w, http.StatusOK, presets[0])
}
