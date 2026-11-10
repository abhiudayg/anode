package config

import (
	"fmt"
	"os"
)

type DatabaseConfig struct {
	User     string
	Password string
	Host     string
	Port     string
	Name     string
	SSLMode  string
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, d.SSLMode)
}

type Config struct {
	Port     string
	Database DatabaseConfig
}

func LoadConfig(prefix string) *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return &Config{
		Port: port,
		Database: DatabaseConfig{
			User:     os.Getenv(prefix + "_DB_USER"),
			Password: os.Getenv(prefix + "_DB_PASSWORD"),
			Host:     os.Getenv(prefix + "_DB_HOST"),
			Port:     os.Getenv(prefix + "_DB_PORT"),
			Name:     os.Getenv(prefix + "_DB_NAME"),
			SSLMode:  os.Getenv(prefix + "_SSLMODE"),
		},
	}
}
