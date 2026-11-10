package config

import "os"

type Config struct {
	Port         string
	TimescaleURL string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}
	return &Config{
		Port:         port,
		TimescaleURL: os.Getenv("LEDGER_TIMESCALE_URL"),
	}
}
