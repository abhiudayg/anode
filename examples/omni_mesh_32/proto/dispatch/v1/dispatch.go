package dispatchv1

type DispatchServiceClient struct {
	addr string
}

func NewDispatchServiceClient(addr string) *DispatchServiceClient {
	return &DispatchServiceClient{addr: addr}
}

func (c *DispatchServiceClient) DispatchTrip(tripID string) error {
	return nil
}

type DispatchServer interface {
	DispatchTrip(string) error
}

func RegisterDispatchServer(s interface{}, srv DispatchServer) {}
