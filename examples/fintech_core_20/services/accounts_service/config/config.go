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

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	return &Config{
		Port: port,
		Database: DatabaseConfig{
			User:     os.Getenv("ACCOUNTS_DB_USER"),
			Password: os.Getenv("ACCOUNTS_DB_PASSWORD"),
			Host:     os.Getenv("ACCOUNTS_DB_HOST"),
			Port:     os.Getenv("ACCOUNTS_DB_PORT"),
			Name:     os.Getenv("ACCOUNTS_DB_NAME"),
			SSLMode:  os.Getenv("ACCOUNTS_SSLMODE"),
		},
	}
}
