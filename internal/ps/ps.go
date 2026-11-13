package ps

import (
	"context"
)

// Run executes process status inspection either locally or remotely based on options.
func Run(ctx context.Context, opts Options) (*ProcessReport, error) {
	if opts.Target != "" {
		return InspectRemote(ctx, opts.Target, opts)
	}
	return InspectLocal(ctx, opts)
}
