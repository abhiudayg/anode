package worker

type Worker interface {
	RegisterActivity(activity any)
	Start() error
}

type worker struct{}

func (worker) RegisterActivity(activity any) {}

func (worker) Start() error { return nil }

func New(queue string) Worker {
	return worker{}
}
