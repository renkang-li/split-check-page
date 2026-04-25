package app

import (
	"net/http"

	"split-check-page/backend/internal/config"
	"split-check-page/backend/internal/proxy"
	"split-check-page/backend/internal/web"
)

func NewServer(cfg config.Config) (http.Handler, error) {
	staticHandler, err := web.NewHandler(cfg.FrontendDist)
	if err != nil {
		return nil, err
	}

	proxyHandler := proxy.NewHandler(proxy.Config{
		AllowPrivateNetworks: cfg.AllowPrivateNetworks,
		HTMLBodyLimitBytes:   cfg.HTMLBodyLimitBytes,
		RequestTimeoutSec:    cfg.RequestTimeoutSec,
	})

	mux := http.NewServeMux()
	mux.Handle("/health", cors(cfg.AllowOrigins, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})))
	mux.Handle("/proxy", cors(cfg.AllowOrigins, proxyHandler))
	mux.Handle("/", staticHandler)

	return mux, nil
}

func cors(allowOrigins []string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowedOrigin := resolveOrigin(allowOrigins, origin)
		if allowedOrigin != "" {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Add("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET,OPTIONS")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func resolveOrigin(allowOrigins []string, origin string) string {
	if len(allowOrigins) == 0 {
		return ""
	}

	for _, item := range allowOrigins {
		if item == "*" {
			if origin == "" {
				return "*"
			}
			return origin
		}

		if origin != "" && item == origin {
			return origin
		}
	}

	return ""
}
