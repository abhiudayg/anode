package gateway

import "os"

type Config struct {
	Port            string
	AuthServiceURL  string
	AccountsURL     string
	TradingURL      string
	PaymentRailsURL string
	CardsURL        string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return &Config{
		Port:            port,
		AuthServiceURL:  os.Getenv("AUTH_SERVICE_URL"),
		AccountsURL:     os.Getenv("ACCOUNTS_SERVICE_URL"),
		TradingURL:      os.Getenv("TRADING_SERVICE_URL"),
		PaymentRailsURL: os.Getenv("PAYMENT_RAILS_SERVICE_URL"),
		CardsURL:        os.Getenv("CARDS_SERVICE_URL"),
	}
}
