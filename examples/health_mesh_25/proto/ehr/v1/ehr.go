package ehrv1

type EHRServiceClient struct {
	addr string
}

func NewEHRServiceClient(addr string) *EHRServiceClient {
	return &EHRServiceClient{addr: addr}
}

func (c *EHRServiceClient) GetPatientRecord(patientID string) (string, error) {
	return `{"fhir":"Patient/1"}`, nil
}

type EHRServer interface {
	GetPatientRecord(string) (string, error)
}

func RegisterEHRServiceServer(s interface{}, srv EHRServer) {}
