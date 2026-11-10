package fraudv1

type FraudServiceClient struct {
	addr string
}

func NewFraudServiceClient(addr string) *FraudServiceClient {
	return &FraudServiceClient{addr: addr}
}

func (c *FraudServiceClient) EvaluateRisk(txID string) (float64, error) {
	return 0.05, nil
}

type FraudServer interface {
	EvaluateRisk(string) (float64, error)
}

func RegisterFraudServer(s interface{}, srv FraudServer) {}
