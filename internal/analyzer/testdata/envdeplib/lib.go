package envdeplib

import "os"

func Secret() string {
	return os.Getenv("LIB_SECRET_KEY")
}
