package auth

import "os"

type Config struct {
	Port           string
	RedisAddr      string
	AccountsURL    string
	JWTSecretKey   string
	TokenExpirySec int
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	return &Config{
		Port:           port,
		RedisAddr:      os.Getenv("AUTH_REDIS_ADDR"),
		AccountsURL:    os.Getenv("ACCOUNTS_SERVICE_URL"),
		JWTSecretKey:   os.Getenv("JWT_SIGNING_SECRET_KEY"),
		TokenExpirySec: 86400,
	}
}
