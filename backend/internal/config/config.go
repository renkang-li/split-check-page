package config

import (
	"os"
	"strings"
)

type Config struct {
	AllowOrigins         []string
	AllowPrivateNetworks bool
	FrontendDist         string
	HTMLBodyLimitBytes   int64
	Port                 string
	RequestTimeoutSec    int
}

func Load() Config {
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8155"
	}

	frontendDist := strings.TrimSpace(os.Getenv("FRONTEND_DIST"))
	if frontendDist == "" {
		frontendDist = "frontend/dist"
	}

	allowOrigins := parseCSV(os.Getenv("ALLOWED_ORIGINS"))
	if len(allowOrigins) == 0 {
		allowOrigins = []string{"*"}
	}

	return Config{
		AllowOrigins:         allowOrigins,
		AllowPrivateNetworks: strings.EqualFold(strings.TrimSpace(os.Getenv("ALLOW_PRIVATE_NETWORKS")), "true"),
		FrontendDist:         frontendDist,
		HTMLBodyLimitBytes:   12 << 20,
		Port:                 port,
		RequestTimeoutSec:    15,
	}
}

func parseCSV(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}

	rawItems := strings.Split(value, ",")
	items := make([]string, 0, len(rawItems))
	for _, item := range rawItems {
		trimmed := strings.TrimSpace(item)
		if trimmed != "" {
			items = append(items, trimmed)
		}
	}

	return items
}
