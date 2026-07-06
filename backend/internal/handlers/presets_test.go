package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPresetsGetFound(t *testing.T) {
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[{"id":"p1","title":"HIIT clásico"}]`))
	})
	h := NewPresetsHandler(dbc)

	req := withChiParam(httptest.NewRequest("GET", "/api/presets/p1", nil), "id", "p1")
	w := httptest.NewRecorder()
	h.Get(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
}

func TestPresetsGetNotFound(t *testing.T) {
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[]`))
	})
	h := NewPresetsHandler(dbc)

	req := withChiParam(httptest.NewRequest("GET", "/api/presets/missing", nil), "id", "missing")
	w := httptest.NewRecorder()
	h.Get(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", w.Code)
	}
}

func TestPresetsList(t *testing.T) {
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[{"id":"p1"},{"id":"p2"}]`))
	})
	h := NewPresetsHandler(dbc)

	req := httptest.NewRequest("GET", "/api/presets", nil)
	w := httptest.NewRecorder()
	h.List(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
}
