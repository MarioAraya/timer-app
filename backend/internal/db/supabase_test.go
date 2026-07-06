package db

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

type fakeRow struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

func TestClientGet(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/rest/v1/things" {
			t.Errorf("path = %q, want /rest/v1/things", r.URL.Path)
		}
		if r.Header.Get("apikey") != "secret" {
			t.Errorf("apikey header = %q, want secret", r.Header.Get("apikey"))
		}
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode([]fakeRow{{ID: "1", Name: "foo"}})
	}))
	defer srv.Close()

	c := NewClient(srv.URL, "secret")
	var rows []fakeRow
	if err := c.Get("/things", &rows); err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if len(rows) != 1 || rows[0].Name != "foo" {
		t.Fatalf("rows = %+v, want [{1 foo}]", rows)
	}
}

func TestClientGetErrorStatus(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("boom"))
	}))
	defer srv.Close()

	c := NewClient(srv.URL, "secret")
	var rows []fakeRow
	if err := c.Get("/things", &rows); err == nil {
		t.Fatal("Get() error = nil, want error on 500 response")
	}
}

func TestClientPostReturnsFirstRow(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("method = %s, want POST", r.Method)
		}
		if r.Header.Get("Prefer") != "return=representation" {
			t.Errorf("Prefer header = %q", r.Header.Get("Prefer"))
		}
		var body fakeRow
		json.NewDecoder(r.Body).Decode(&body)
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode([]fakeRow{{ID: "42", Name: body.Name}})
	}))
	defer srv.Close()

	c := NewClient(srv.URL, "secret")
	var created fakeRow
	if err := c.Post("/things", fakeRow{Name: "bar"}, &created); err != nil {
		t.Fatalf("Post() error = %v", err)
	}
	if created.ID != "42" || created.Name != "bar" {
		t.Fatalf("created = %+v, want {42 bar}", created)
	}
}

func TestClientPostEmptyArrayIsError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode([]fakeRow{})
	}))
	defer srv.Close()

	c := NewClient(srv.URL, "secret")
	var created fakeRow
	if err := c.Post("/things", fakeRow{Name: "bar"}, &created); err == nil {
		t.Fatal("Post() error = nil, want error on empty result array")
	}
}

func TestClientDelete(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			t.Errorf("method = %s, want DELETE", r.Method)
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer srv.Close()

	c := NewClient(srv.URL, "secret")
	if err := c.Delete("/things?id=eq.1"); err != nil {
		t.Fatalf("Delete() error = %v", err)
	}
}

func TestClientRPC(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/rest/v1/rpc/increment_like" {
			t.Errorf("path = %q, want /rest/v1/rpc/increment_like", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	c := NewClient(srv.URL, "secret")
	if err := c.RPC("increment_like", map[string]string{"routine_id": "1"}, nil); err != nil {
		t.Fatalf("RPC() error = %v", err)
	}
}
