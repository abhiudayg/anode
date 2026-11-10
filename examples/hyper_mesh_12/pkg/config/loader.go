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
	DBName   string
	SSLMode  string
}

func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.DBName, d.SSLMode)
}

type ServerConfig struct {
	Port string
}

type AppConfig struct {
	Server   ServerConfig
	Database DatabaseConfig
	Secrets  map[string]string
}

// LoadFromNestedLayers loads configurations through 3 pointer hops and dynamic loops
func LoadFromNestedLayers(servicePrefix string) *AppConfig {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbUser := os.Getenv(servicePrefix + "_DB_USER")
	dbPass := os.Getenv(servicePrefix + "_DB_PASSWORD")
	dbHost := os.Getenv(servicePrefix + "_DB_HOST")
	dbPort := os.Getenv(servicePrefix + "_DB_PORT")
	dbName := os.Getenv(servicePrefix + "_DB_NAME")

	ssl := os.Getenv(servicePrefix + "_SSLMODE")
	if ssl == "" {
		ssl = "disable"
	}

	return &AppConfig{
		Server: ServerConfig{Port: port},
		Database: DatabaseConfig{
			User:     dbUser,
			Password: dbPass,
			Host:     dbHost,
			Port:     dbPort,
			DBName:   dbName,
			SSLMode:  ssl,
		},
		Secrets: make(map[string]string),
	}
}
