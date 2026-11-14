package logs

import (
	"context"
	"strings"
)

// Run routes log streaming to remote VPS or local supervisor based on Options.
func Run(ctx context.Context, opts Options) error {
	if opts.Target != "" && (strings.Contains(opts.Target, "@") || strings.Contains(opts.Target, ":") || opts.Target != ".") {
		return StreamRemote(ctx, opts)
	}
	return StreamLocal(ctx, opts)
}
