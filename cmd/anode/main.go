package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/abhiudayg/anode/internal/analyzer"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: anode <command> [args...]")
		fmt.Println("\nAvailable commands:")
		fmt.Println("  inspect [dir]    Analyze Go repository and emit Intermediate Application Graph (IAG)")
		os.Exit(1)
	}

	cmd := os.Args[1]
	switch cmd {
	case "inspect":
		targetDir := "."
		if len(os.Args) > 2 {
			targetDir = os.Args[2]
		}

		loader := analyzer.NewLoader(targetDir)
		graph, err := loader.LoadAndAnalyze("./...")
		if err != nil {
			log.Fatalf("Analysis failed: %v", err)
		}

		data, err := json.MarshalIndent(graph, "", "  ")
		if err != nil {
			log.Fatalf("Failed to serialize IAG: %v", err)
		}

		fmt.Println(string(data))

	default:
		fmt.Printf("Unknown command: %q\n", cmd)
		os.Exit(1)
	}
}
