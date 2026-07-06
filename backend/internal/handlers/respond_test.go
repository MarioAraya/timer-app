package handlers

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWriteJSON(t *testing.T) {
	w := httptest.NewRecorder()
	writeJSON(w, 201, map[string]string{"foo": "bar"})

	if w.Code != 201 {
		t.Fatalf("status = %d, want 201", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", ct)
	}

	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON body: %v", err)
	}
	if body["foo"] != "bar" {
		t.Fatalf("body = %v, want foo=bar", body)
	}
}

func TestWriteError(t *testing.T) {
	w := httptest.NewRecorder()
	writeError(w, 404, "no encontrado")

	if w.Code != 404 {
		t.Fatalf("status = %d, want 404", w.Code)
	}

	var body map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("invalid JSON body: %v", err)
	}
	if body["error"] != "no encontrado" {
		t.Fatalf("error = %q, want %q", body["error"], "no encontrado")
	}
}

func TestDecode(t *testing.T) {
	req := httptest.NewRequest("POST", "/x", strings.NewReader(`{"title":"hola"}`))
	var dst struct {
		Title string `json:"title"`
	}
	if err := decode(req, &dst); err != nil {
		t.Fatalf("decode() error = %v", err)
	}
	if dst.Title != "hola" {
		t.Fatalf("Title = %q, want hola", dst.Title)
	}
}

func TestDecodeInvalidJSON(t *testing.T) {
	req := httptest.NewRequest("POST", "/x", strings.NewReader(`{not json`))
	var dst map[string]any
	if err := decode(req, &dst); err == nil {
		t.Fatal("decode() error = nil, want error on malformed JSON")
	}
}
