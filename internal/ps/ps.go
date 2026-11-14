package ps

import (
	"context"
)

// Run executes process status inspection either locally or remotely based on options.
func Run(ctx context.Context, opts Options) (*ProcessReport, error) {
	var rep *ProcessReport
	var err error
	if opts.Target != "" {
		rep, err = InspectRemote(ctx, opts.Target, opts)
	} else {
		rep, err = InspectLocal(ctx, opts)
	}
	if err != nil {
		return nil, err
	}
	if rep != nil {
		rep.Verbose = opts.Verbose
	}
	return rep, nil
}
