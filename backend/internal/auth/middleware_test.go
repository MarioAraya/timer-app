package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret"

func signToken(t *testing.T, sub string, expiresIn time.Duration) string {
	t.Helper()
	claims := jwt.MapClaims{
		"sub": sub,
		"exp": time.Now().Add(expiresIn).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(testSecret))
	if err != nil {
		t.Fatalf("failed to sign test token: %v", err)
	}
	return signed
}

func TestMiddlewareValidToken(t *testing.T) {
	var gotUserID string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUserID = GetUserID(r)
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+signToken(t, "user-123", time.Hour))
	w := httptest.NewRecorder()

	Middleware(testSecret)(next).ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if gotUserID != "user-123" {
		t.Fatalf("userID = %q, want user-123", gotUserID)
	}
}

func TestMiddlewareMissingHeader(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next handler should not be called without auth header")
	})

	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()

	Middleware(testSecret)(next).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", w.Code)
	}
}

func TestMiddlewareExpiredToken(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next handler should not be called with expired token")
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+signToken(t, "user-123", -time.Hour))
	w := httptest.NewRecorder()

	Middleware(testSecret)(next).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", w.Code)
	}
}

func TestMiddlewareWrongSecret(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next handler should not be called with token signed by wrong secret")
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Bearer "+signToken(t, "user-123", time.Hour))
	w := httptest.NewRecorder()

	Middleware("other-secret")(next).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", w.Code)
	}
}

func TestMiddlewareMalformedHeader(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("next handler should not be called without Bearer prefix")
	})

	req := httptest.NewRequest("GET", "/", nil)
	req.Header.Set("Authorization", "Basic abcdef")
	w := httptest.NewRecorder()

	Middleware(testSecret)(next).ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", w.Code)
	}
}

func TestGetUserIDNoAuth(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	if got := GetUserID(req); got != "" {
		t.Fatalf("GetUserID() = %q, want empty string", got)
	}
}
