package config

import (
	"fmt"
	"os"
)

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
}

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

type ServerConfig struct {
	Port string
}

func LoadConfig(prefix string) *Config {
	return &Config{
		Database: DatabaseConfig{
			User:     os.Getenv(prefix + "_DB_USER"),
			Password: os.Getenv(prefix + "_DB_PASSWORD"),
			Host:     os.Getenv(prefix + "_DB_HOST"),
			Port:     os.Getenv(prefix + "_DB_PORT"),
			Name:     os.Getenv(prefix + "_DB_NAME"),
			SSLMode:  os.Getenv(prefix + "_SSLMODE"),
		},
		Server: ServerConfig{
			Port: os.Getenv("PORT"),
		},
	}
}
