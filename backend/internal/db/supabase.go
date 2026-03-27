package db

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client es un cliente liviano para la API REST de Supabase (PostgREST).
type Client struct {
	http       *http.Client
	baseURL    string
	serviceKey string
}

func NewClient(supabaseURL, serviceKey string) *Client {
	return &Client{
		http:       &http.Client{Timeout: 10 * time.Second},
		baseURL:    strings.TrimRight(supabaseURL, "/") + "/rest/v1",
		serviceKey: serviceKey,
	}
}

// Get hace GET a /rest/v1/{path} y decodifica la respuesta JSON en dest.
func (c *Client) Get(path string, dest any) error {
	req, err := c.newReq(http.MethodGet, path, nil)
	if err != nil {
		return err
	}
	return c.do(req, dest)
}

// Post hace POST y devuelve la primera fila insertada en dest (Prefer: return=representation).
func (c *Client) Post(path string, body, dest any) error {
	req, err := c.newReq(http.MethodPost, path, body)
	if err != nil {
		return err
	}
	req.Header.Set("Prefer", "return=representation")
	return c.doSingle(req, dest)
}

// Patch hace PATCH y devuelve la primera fila actualizada en dest.
func (c *Client) Patch(path string, body, dest any) error {
	req, err := c.newReq(http.MethodPatch, path, body)
	if err != nil {
		return err
	}
	req.Header.Set("Prefer", "return=representation")
	return c.doSingle(req, dest)
}

// Delete hace DELETE. No devuelve cuerpo.
func (c *Client) Delete(path string) error {
	req, err := c.newReq(http.MethodDelete, path, nil)
	if err != nil {
		return err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return checkStatus(resp)
}

// RPC llama a una función PostgreSQL vía /rpc/{name}.
func (c *Client) RPC(name string, params, dest any) error {
	req, err := c.newReq(http.MethodPost, "/rpc/"+name, params)
	if err != nil {
		return err
	}
	return c.do(req, dest)
}

// ── helpers ──────────────────────────────────────────────────────────────────

func (c *Client) newReq(method, path string, body any) (*http.Request, error) {
	var bodyReader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(data)
	}

	url := c.baseURL + path
	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", c.serviceKey)
	req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	return req, nil
}

// do ejecuta la petición y decodifica la respuesta JSON en dest.
func (c *Client) do(req *http.Request, dest any) error {
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if err := checkStatus(resp); err != nil {
		return err
	}
	if dest == nil {
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(dest)
}

// doSingle ejecuta la petición y decodifica el primer elemento del array de respuesta.
func (c *Client) doSingle(req *http.Request, dest any) error {
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if err := checkStatus(resp); err != nil {
		return err
	}
	if dest == nil {
		return nil
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// PostgREST siempre devuelve un array cuando Prefer: return=representation
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		// Algunos endpoints devuelven el objeto directamente
		return json.Unmarshal(data, dest)
	}
	if len(arr) == 0 {
		return fmt.Errorf("supabase: sin filas en la respuesta")
	}
	return json.Unmarshal(arr[0], dest)
}

func checkStatus(resp *http.Response) error {
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return nil
}
