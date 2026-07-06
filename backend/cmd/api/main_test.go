package main

import (
	"os"
	"testing"
)

func TestIsAllowedOriginDefault(t *testing.T) {
	os.Unsetenv("ALLOWED_ORIGINS")

	if !isAllowedOrigin("http://localhost:5173") {
		t.Error("localhost:5173 should be allowed by default")
	}
	if isAllowedOrigin("https://evil.example.com") {
		t.Error("unlisted origin should not be allowed")
	}
}

func TestIsAllowedOriginCustom(t *testing.T) {
	os.Setenv("ALLOWED_ORIGINS", "https://app.example.com, https://other.example.com")
	defer os.Unsetenv("ALLOWED_ORIGINS")

	if !isAllowedOrigin("https://app.example.com") {
		t.Error("https://app.example.com should be allowed")
	}
	if !isAllowedOrigin("https://other.example.com") {
		t.Error("https://other.example.com should be allowed (trimmed space)")
	}
	if isAllowedOrigin("http://localhost:5173") {
		t.Error("localhost should not be allowed once ALLOWED_ORIGINS is set explicitly")
	}
}

func TestEnvOr(t *testing.T) {
	os.Unsetenv("SOME_TEST_VAR")
	if got := envOr("SOME_TEST_VAR", "fallback"); got != "fallback" {
		t.Errorf("envOr() = %q, want fallback", got)
	}

	os.Setenv("SOME_TEST_VAR", "value")
	defer os.Unsetenv("SOME_TEST_VAR")
	if got := envOr("SOME_TEST_VAR", "fallback"); got != "value" {
		t.Errorf("envOr() = %q, want value", got)
	}
}
