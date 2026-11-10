package devengine

import (
	"database/sql"
	"fmt"
	"path/filepath"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

type MigrationRunner struct {
	rootDir string
}

func NewMigrationRunner(rootDir string) *MigrationRunner {
	return &MigrationRunner{rootDir: rootDir}
}

// RunGooseMigrations applies migrations from relative folder to the target database
func (m *MigrationRunner) RunGooseMigrations(dsn string, relativePath string) (int, error) {
	absPath := filepath.Join(m.rootDir, relativePath)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return 0, fmt.Errorf("failed to open database for migrations: %w", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return 0, fmt.Errorf("database unreachable for migrations: %w", err)
	}

	if err := goose.SetDialect("postgres"); err != nil {
		return 0, fmt.Errorf("failed to set goose dialect: %w", err)
	}

	currentVersion, _ := goose.GetDBVersion(db)

	if err := goose.Up(db, absPath); err != nil {
		return 0, fmt.Errorf("migration failed in %s: %w", relativePath, err)
	}

	newVersion, _ := goose.GetDBVersion(db)
	appliedCount := int(newVersion - currentVersion)

	return appliedCount, nil
}
