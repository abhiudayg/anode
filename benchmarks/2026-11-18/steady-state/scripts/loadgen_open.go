// Open-loop load generator: fires requests at a fixed rate regardless of how fast responses come back.
// Each request is timed; the summary gives achieved rate, status counts, and latency percentiles.
package main

import (
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

func main() {
	url := flag.String("url", "", "target URL")
	host := flag.String("host", "", "Host header (Caddy routes by it)")
	rate := flag.Int("rate", 100, "requests per second")
	dur := flag.Duration("d", 60*time.Second, "measured duration")
	warm := flag.Duration("warm", 10*time.Second, "warm-up before measuring")
	conns := flag.Int("conns", 256, "max concurrent in-flight requests")
	flag.Parse()

	client := &http.Client{
		Timeout: 5 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        *conns,
			MaxIdleConnsPerHost: *conns,
			MaxConnsPerHost:     *conns,
			DialContext:         (&net.Dialer{Timeout: 2 * time.Second}).DialContext,
		},
	}
	sem := make(chan struct{}, *conns)
	var (
		mu       sync.Mutex
		lat      []time.Duration
		statuses = map[string]int{}
		dropped  atomic.Int64
		wg       sync.WaitGroup
	)
	fire := func(record bool) {
		defer wg.Done()
		defer func() { <-sem }()
		start := time.Now()
		req, _ := http.NewRequest("GET", *url, nil)
		if *host != "" {
			req.Host = *host
		}
		resp, err := client.Do(req)
		d := time.Since(start)
		key := "err"
		if err == nil {
			_, _ = io.Copy(io.Discard, resp.Body)
			resp.Body.Close()
			key = fmt.Sprint(resp.StatusCode)
		}
		if !record {
			return
		}
		mu.Lock()
		statuses[key]++
		lat = append(lat, d)
		mu.Unlock()
	}

	run := func(total time.Duration, record bool) {
		interval := time.Second / time.Duration(*rate)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		deadline := time.Now().Add(total)
		for now := range ticker.C {
			if now.After(deadline) {
				break
			}
			select {
			case sem <- struct{}{}:
				wg.Add(1)
				go fire(record)
			default:
				if record {
					dropped.Add(1)
				}
			}
		}
	}

	run(*warm, false)
	begin := time.Now()
	run(*dur, true)
	wg.Wait()
	elapsed := time.Since(begin)

	sort.Slice(lat, func(i, j int) bool { return lat[i] < lat[j] })
	pct := func(p float64) float64 {
		if len(lat) == 0 {
			return 0
		}
		i := int(float64(len(lat))*p+0.5) - 1
		if i < 0 {
			i = 0
		}
		if i >= len(lat) {
			i = len(lat) - 1
		}
		return float64(lat[i].Microseconds()) / 1000
	}
	ok := statuses["200"]
	fmt.Fprintf(os.Stdout, "target_rate\t%d\nsent\t%d\nachieved_rate\t%.1f\ndropped_at_client\t%d\n",
		*rate, len(lat), float64(len(lat))/elapsed.Seconds(), dropped.Load())
	for k, v := range statuses {
		fmt.Fprintf(os.Stdout, "status_%s\t%d\n", k, v)
	}
	fmt.Fprintf(os.Stdout, "ok_200\t%d\np50_ms\t%.2f\np90_ms\t%.2f\np99_ms\t%.2f\np999_ms\t%.2f\nmax_ms\t%.2f\n",
		ok, pct(0.50), pct(0.90), pct(0.99), pct(0.999), pct(1.0))
}
