package main

import (
	"bufio"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"sync"
	"time"
)

func main() {
	n := flag.Int("n", 10, "concurrent clients")
	dur := flag.Duration("d", 60*time.Second, "run duration")
	url := flag.String("url", "http://127.0.0.1/version", "target url")
	host := flag.String("host", "34.133.119.17", "Host header")
	out := flag.String("out", "/tmp/loadgen", "output directory")
	flag.Parse()
	if err := os.MkdirAll(*out, 0o755); err != nil {
		panic(err)
	}
	client := &http.Client{
		Timeout: 2 * time.Second,
		Transport: &http.Transport{
			MaxIdleConnsPerHost: *n,
			DialContext:         (&net.Dialer{Timeout: 2 * time.Second}).DialContext,
		},
	}
	deadline := time.Now().Add(*dur)
	var wg sync.WaitGroup
	for w := 0; w < *n; w++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			f, err := os.Create(fmt.Sprintf("%s/w%03d.log", *out, id))
			if err != nil {
				panic(err)
			}
			defer f.Close()
			bw := bufio.NewWriter(f)
			defer bw.Flush()
			for time.Now().Before(deadline) {
				req, _ := http.NewRequest("GET", *url, nil)
				req.Host = *host
				t := time.Now().UnixMilli()
				resp, err := client.Do(req)
				if err != nil {
					fmt.Fprintf(bw, "%d ERR %v\n", t, err)
					continue
				}
				body, _ := io.ReadAll(resp.Body)
				resp.Body.Close()
				fmt.Fprintf(bw, "%d %d %s\n", t, resp.StatusCode, string(body))
			}
		}(w)
	}
	wg.Wait()
	fmt.Println("done")
}
