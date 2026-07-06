package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"timer-app/backend/internal/auth"
)

func TestSocialStatusLiked(t *testing.T) {
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[{"id":"like-1"}]`))
	})
	h := NewSocialHandler(dbc)

	req := withChiParam(authedRequest(t, "GET", "/api/routines/r1/like", "user-1", ""), "id", "r1")
	w := httptest.NewRecorder()
	auth.Middleware(testJWTSecret)(http.HandlerFunc(h.Status)).ServeHTTP(w, req)

	var body map[string]bool
	json.Unmarshal(w.Body.Bytes(), &body)
	if !body["liked"] {
		t.Errorf("liked = %v, want true", body["liked"])
	}
}

func TestSocialStatusNotLiked(t *testing.T) {
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[]`))
	})
	h := NewSocialHandler(dbc)

	req := withChiParam(authedRequest(t, "GET", "/api/routines/r1/like", "user-1", ""), "id", "r1")
	w := httptest.NewRecorder()
	auth.Middleware(testJWTSecret)(http.HandlerFunc(h.Status)).ServeHTTP(w, req)

	var body map[string]bool
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["liked"] {
		t.Errorf("liked = %v, want false", body["liked"])
	}
}

func TestSocialUnlike(t *testing.T) {
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete && r.Method != http.MethodPost {
			t.Errorf("unexpected method %s", r.Method)
		}
		w.WriteHeader(http.StatusOK)
	})
	h := NewSocialHandler(dbc)

	req := withChiParam(authedRequest(t, "DELETE", "/api/routines/r1/like", "user-1", ""), "id", "r1")
	w := httptest.NewRecorder()
	auth.Middleware(testJWTSecret)(http.HandlerFunc(h.Unlike)).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	var body map[string]bool
	json.Unmarshal(w.Body.Bytes(), &body)
	if body["liked"] {
		t.Errorf("liked = %v, want false after unlike", body["liked"])
	}
}
