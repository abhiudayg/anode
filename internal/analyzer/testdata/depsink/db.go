package depsink

import "database/sql"

func Open() {
	db, _ := sql.Open("postgres", "postgres://u@127.0.0.1/db")
	_ = db
}
