package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"

	"timer-app/backend/internal/auth"
	"timer-app/backend/internal/db"
	"timer-app/backend/internal/handlers"
)

func main() {
	// Cargar .env si existe (ignorar error en producción)
	_ = godotenv.Load()

	supabaseURL := mustEnv("SUPABASE_URL")
	supabaseKey := mustEnv("SUPABASE_SERVICE_KEY")
	jwtSecret := mustEnv("SUPABASE_JWT_SECRET")
	port := envOr("PORT", "8080")

	supabase := db.NewClient(supabaseURL, supabaseKey)

	presetsH := handlers.NewPresetsHandler(supabase)
	routinesH := handlers.NewRoutinesHandler(supabase)
	socialH := handlers.NewSocialHandler(supabase)
	progressH := handlers.NewProgressHandler(supabase)

	requireAuth := auth.Middleware(jwtSecret)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	r.Route("/api", func(r chi.Router) {
		// Presets públicos (sin auth)
		r.Get("/presets", presetsH.List)
		r.Get("/presets/{id}", presetsH.Get)

		// Rutinas públicas (sin auth)
		r.Get("/routines/public", routinesH.ListPublic)
		r.Get("/users/{userId}/routines", routinesH.ListByUser)

		// Mis rutinas (requiere auth)
		r.Group(func(r chi.Router) {
			r.Use(requireAuth)
			r.Get("/routines", routinesH.ListMine)
			r.Post("/routines", routinesH.Create)
			r.Put("/routines/{id}", routinesH.Update)
			r.Delete("/routines/{id}", routinesH.Delete)
			r.Post("/routines/{id}/clone", routinesH.Clone)

			// Social
			r.Post("/routines/{id}/like", socialH.Like)
			r.Delete("/routines/{id}/like", socialH.Unlike)
			r.Get("/routines/{id}/like", socialH.Status)

			// Progreso
			r.Post("/progress", progressH.Create)
			r.Get("/progress", progressH.List)
			r.Get("/progress/stats", progressH.Stats)
		})
	})

	log.Printf("servidor escuchando en :%s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("error al iniciar servidor: %v", err)
	}
}

// corsMiddleware agrega las cabeceras CORS necesarias para el frontend.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if isAllowedOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func isAllowedOrigin(origin string) bool {
	allowed := strings.Split(envOr("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:4173"), ",")
	for _, o := range allowed {
		if strings.TrimSpace(o) == origin {
			return true
		}
	}
	return false
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("variable de entorno requerida no definida: %s", key)
	}
	return v
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
