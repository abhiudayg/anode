package ps

import (
	"bufio"
	"fmt"
	"strconv"
	"strings"
)

// ParseMemoryStat parses the contents of a cgroups v2 memory.stat file.
func ParseMemoryStat(statContent string) *MemoryBreakdown {
	if strings.TrimSpace(statContent) == "" {
		return nil
	}

	mb := &MemoryBreakdown{}
	scanner := bufio.NewScanner(strings.NewReader(statContent))
	hasAny := false

	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 2 {
			continue
		}
		key := fields[0]
		val, err := strconv.ParseUint(fields[1], 10, 64)
		if err != nil {
			continue
		}

		switch key {
		case "anon":
			mb.AnonBytes = val
			hasAny = true
		case "file":
			mb.FileBytes = val
			hasAny = true
		case "kernel":
			mb.KernelBytes = val
			hasAny = true
		case "slab":
			mb.SlabBytes = val
		case "sock":
			mb.SockBytes = val
		case "shmem":
			mb.ShmemBytes = val
		}
	}

	if !hasAny {
		return nil
	}

	mb.AnonHuman = FormatBytes(mb.AnonBytes)
	mb.FileHuman = FormatBytes(mb.FileBytes)
	if mb.KernelBytes > 0 {
		mb.KernelHuman = FormatBytes(mb.KernelBytes)
	}

	return mb
}

// ParseProcSmapsBreakdown parses the contents of /proc/<pid>/smaps_rollup or /proc/<pid>/status.
func ParseProcSmapsBreakdown(content string) (uint64, *MemoryBreakdown) {
	if strings.TrimSpace(content) == "" {
		return 0, nil
	}

	mb := &MemoryBreakdown{}
	var pss uint64
	var vmRSS uint64
	scanner := bufio.NewScanner(strings.NewReader(content))
	hasAny := false

	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) < 2 {
			continue
		}
		key := strings.TrimSuffix(fields[0], ":")
		kb, err := strconv.ParseUint(fields[1], 10, 64)
		if err != nil {
			continue
		}
		bytesVal := kb * 1024

		switch key {
		case "Pss":
			pss = bytesVal
		case "VmRSS":
			vmRSS = bytesVal
		case "Pss_Anon", "RssAnon", "Anonymous":
			if mb.AnonBytes == 0 {
				mb.AnonBytes = bytesVal
				hasAny = true
			}
		case "Pss_File", "RssFile":
			if mb.FileBytes == 0 {
				mb.FileBytes = bytesVal
				hasAny = true
			}
		case "Pss_Shmem", "RssShmem":
			if mb.ShmemBytes == 0 {
				mb.ShmemBytes = bytesVal
			}
		}
	}

	if pss == 0 && vmRSS > 0 {
		pss = vmRSS
	}

	if !hasAny {
		return pss, nil
	}

	mb.AnonHuman = FormatBytes(mb.AnonBytes)
	mb.FileHuman = FormatBytes(mb.FileBytes)

	return pss, mb
}

// FormatServiceMemoryHuman constructs the human-readable memory representation,
// displaying both the total/limit and the anon/file/kernel breakdown.
func FormatServiceMemoryHuman(status *ServiceStatus) string {
	if status.MemoryBytes == 0 && status.MemoryBreakdown != nil {
		status.MemoryBytes = status.MemoryBreakdown.AnonBytes + status.MemoryBreakdown.FileBytes + status.MemoryBreakdown.KernelBytes
	}
	if status.MemoryBytes == 0 {
		return "-"
	}

	var base string
	if status.CgroupFallback {
		base = fmt.Sprintf("%s (PSS)", FormatBytes(status.MemoryBytes))
	} else if status.MemoryMaxBytes > 0 {
		pct := (status.MemoryBytes * 100) / status.MemoryMaxBytes
		base = fmt.Sprintf("%s / %s (%d%%)", FormatBytes(status.MemoryBytes), FormatBytes(status.MemoryMaxBytes), pct)
	} else {
		base = FormatBytes(status.MemoryBytes)
	}

	if status.MemoryBreakdown != nil {
		bd := status.MemoryBreakdown
		var parts []string
		if bd.AnonBytes > 0 {
			parts = append(parts, fmt.Sprintf("anon:%s", FormatBytes(bd.AnonBytes)))
		}
		if bd.FileBytes > 0 {
			parts = append(parts, fmt.Sprintf("file:%s", FormatBytes(bd.FileBytes)))
		}
		if bd.KernelBytes > 0 {
			parts = append(parts, fmt.Sprintf("k:%s", FormatBytes(bd.KernelBytes)))
		}
		if len(parts) > 0 {
			return fmt.Sprintf("%s [%s]", base, strings.Join(parts, " "))
		}
	}

	return base
}
