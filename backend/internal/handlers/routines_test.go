package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"

	"timer-app/backend/internal/auth"
	"timer-app/backend/internal/db"
)

const testJWTSecret = "test-secret"

func authedRequest(t *testing.T, method, target, userID, body string) *http.Request {
	t.Helper()
	claims := jwt.MapClaims{"sub": userID, "exp": time.Now().Add(time.Hour).Unix()}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(testJWTSecret))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+token)
	return req
}

func withChiParam(r *http.Request, key, value string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

// fakeSupabase spins up an httptest server that mimics the PostgREST responses
// a real Supabase instance would give, so handlers can be tested without a live DB.
func fakeSupabase(t *testing.T, handler http.HandlerFunc) *db.Client {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return db.NewClient(srv.URL, "service-key")
}

func TestListByUserOwnSeesPrivate(t *testing.T) {
	var gotQuery string
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		gotQuery = r.URL.RawQuery
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[]`))
	})
	h := NewRoutinesHandler(dbc)

	req := withChiParam(authedRequest(t, "GET", "/api/users/user-1/routines", "user-1", ""), "userId", "user-1")
	w := httptest.NewRecorder()
	auth.Middleware(testJWTSecret)(http.HandlerFunc(h.ListByUser)).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if strings.Contains(gotQuery, "is_public=eq.true") {
		t.Errorf("query = %q, should NOT filter by is_public when caller owns the routines", gotQuery)
	}
}

func TestListByUserOtherOnlyPublic(t *testing.T) {
	var gotQuery string
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		gotQuery = r.URL.RawQuery
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[]`))
	})
	h := NewRoutinesHandler(dbc)

	req := withChiParam(authedRequest(t, "GET", "/api/users/user-2/routines", "user-1", ""), "userId", "user-2")
	w := httptest.NewRecorder()
	auth.Middleware(testJWTSecret)(http.HandlerFunc(h.ListByUser)).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if !strings.Contains(gotQuery, "is_public=eq.true") {
		t.Errorf("query = %q, should filter by is_public when caller is not the owner", gotQuery)
	}
}

func TestCloneForbiddenForPrivateRoutineOfAnotherUser(t *testing.T) {
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[{"id":"r1","user_id":"owner","is_public":false,"type":"hiit","title":"Original"}]`))
	})
	h := NewRoutinesHandler(dbc)

	req := withChiParam(authedRequest(t, "POST", "/api/routines/r1/clone", "someone-else", ""), "id", "r1")
	w := httptest.NewRecorder()
	auth.Middleware(testJWTSecret)(http.HandlerFunc(h.Clone)).ServeHTTP(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403", w.Code)
	}
}

func TestCloneAllowedForPublicRoutine(t *testing.T) {
	calls := 0
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		calls++
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			w.Write([]byte(`[{"id":"r1","user_id":"owner","is_public":true,"type":"hiit","title":"Original"}]`))
			return
		}
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`[{"id":"r2","user_id":"someone-else","title":"Original (copia)"}]`))
	})
	h := NewRoutinesHandler(dbc)

	req := withChiParam(authedRequest(t, "POST", "/api/routines/r1/clone", "someone-else", ""), "id", "r1")
	w := httptest.NewRecorder()
	auth.Middleware(testJWTSecret)(http.HandlerFunc(h.Clone)).ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201 (body: %s)", w.Code, w.Body.String())
	}
	if calls != 2 {
		t.Errorf("calls = %d, want 2 (fetch original + insert clone)", calls)
	}
}

func TestCreateRoutineRequiresTypeAndTitle(t *testing.T) {
	dbc := fakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("supabase should not be called when validation fails")
	})
	h := NewRoutinesHandler(dbc)

	req := authedRequest(t, "POST", "/api/routines", "user-1", `{}`)
	w := httptest.NewRecorder()
	auth.Middleware(testJWTSecret)(http.HandlerFunc(h.Create)).ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", w.Code)
	}
}
