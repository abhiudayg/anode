package main

import (
	"flag"
	"fmt"
	"io"
	"net/http"
	"sync"
	"sync/atomic"
	"time"
)

func main() {
	url := flag.String("url", "", "")
	clients := flag.Int("c", 50, "")
	dur := flag.Duration("d", 20*time.Second, "")
	flag.Parse()
	client := &http.Client{Transport: &http.Transport{MaxIdleConnsPerHost: *clients, DisableKeepAlives: false}, Timeout: 5 * time.Second}
	var total, errs, non200 atomic.Int64
	var mu sync.Mutex
	var firstErr, lastErr time.Time
	start := time.Now()
	stop := start.Add(*dur)
	var wg sync.WaitGroup
	for i := 0; i < *clients; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for time.Now().Before(stop) {
				total.Add(1)
				resp, err := client.Get(*url)
				if err != nil {
					errs.Add(1)
					now := time.Now()
					mu.Lock()
					if firstErr.IsZero() {
						firstErr = now
					}
					lastErr = now
					mu.Unlock()
					continue
				}
				io.Copy(io.Discard, resp.Body)
				resp.Body.Close()
				if resp.StatusCode != 200 {
					non200.Add(1)
					now := time.Now()
					mu.Lock()
					if firstErr.IsZero() {
						firstErr = now
					}
					lastErr = now
					mu.Unlock()
				}
			}
		}()
	}
	wg.Wait()
	fmt.Printf("total=%d transport_errors=%d non200=%d\n", total.Load(), errs.Load(), non200.Load())
	if !firstErr.IsZero() {
		fmt.Printf("error_window=%v (from +%v to +%v)\n", lastErr.Sub(firstErr), firstErr.Sub(start).Round(time.Millisecond), lastErr.Sub(start).Round(time.Millisecond))
	} else {
		fmt.Println("error_window=none")
	}
}
