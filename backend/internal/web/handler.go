package web

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

type Handler struct {
	distPath   string
	fileServer http.Handler
}

func NewHandler(distPath string) (*Handler, error) {
	cleanPath := resolveDistPath(distPath)
	info, err := os.Stat(cleanPath)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}

	if err == nil && !info.IsDir() {
		return nil, fmt.Errorf("frontend dist path must be a directory: %s", cleanPath)
	}

	return &Handler{
		distPath:   cleanPath,
		fileServer: http.FileServer(http.Dir(cleanPath)),
	}, nil
}

func resolveDistPath(distPath string) string {
	candidates := []string{
		filepath.Clean(distPath),
		filepath.Clean(filepath.Join("..", distPath)),
	}

	for _, candidate := range candidates {
		info, err := os.Stat(candidate)
		if err == nil && info.IsDir() {
			return candidate
		}
	}

	return candidates[0]
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/proxy") || strings.HasPrefix(r.URL.Path, "/health") {
		http.NotFound(w, r)
		return
	}

	indexPath := filepath.Join(h.distPath, "index.html")
	if !fileExists(indexPath) {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusServiceUnavailable)
		_, _ = w.Write([]byte("frontend build not found; run `npm run build` in ./frontend or start the Vite dev server"))
		return
	}

	cleanURLPath := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
	requestedPath := filepath.Join(h.distPath, filepath.FromSlash(cleanURLPath))
	if cleanURLPath != "" && fileExists(requestedPath) {
		h.fileServer.ServeHTTP(w, r)
		return
	}

	if cleanURLPath != "" && strings.Contains(filepath.Base(requestedPath), ".") {
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, indexPath)
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	return err == nil && !info.IsDir()
}
