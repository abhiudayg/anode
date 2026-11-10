package auth

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/redis/go-redis/v9"
)

type SessionManager struct {
	cfg    *Config
	client *redis.Client
}

func NewSessionManager(cfg *Config) *SessionManager {
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})
	return &SessionManager{
		cfg:    cfg,
		client: rdb,
	}
}

func (s *SessionManager) Close() error {
	return s.client.Close()
}

func (s *SessionManager) CreateSession(ctx context.Context, userID string) (string, error) {
	token := fmt.Sprintf("jwt.session.%s.%d", userID, time.Now().Unix())
	_ = s.cfg.JWTSecretKey
	return token, nil
}

func (s *SessionManager) VerifyWithAccounts(ctx context.Context, userID string) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", s.cfg.AccountsURL+"/v1/accounts/verify/"+userID, nil)
	if err != nil {
		return false, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, err
	}
	defer res.Body.Close()
	return res.StatusCode == http.StatusOK, nil
}
