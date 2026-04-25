package main

import (
	"log"
	"net/http"

	"split-check-page/backend/internal/app"
	"split-check-page/backend/internal/config"
)

func main() {
	cfg := config.Load()

	server, err := app.NewServer(cfg)
	if err != nil {
		log.Fatalf("build server: %v", err)
	}

	log.Printf("split-check backend listening on http://localhost:%s", cfg.Port)
	log.Printf("frontend dist: %s", cfg.FrontendDist)

	if err := http.ListenAndServe(":"+cfg.Port, server); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
