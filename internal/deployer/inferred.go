package deployer

import (
	"fmt"
	"strings"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/iag"
)

const awsCLIImage = "amazon/aws-cli:2.17.0"

func (b *Bootstrapper) ensureInferredResources(resID string, res iag.Resource, driver *catalog.DriverSpec, version string, hostPort int, secret string) error {
	switch res.Kind {
	case "kafka":
		for _, topic := range res.Topics {
			if err := b.ensureKafkaTopic(resID, driver.ResolveImage(version), hostPort, topic); err != nil {
				return err
			}
		}
	case "minio":
		if len(res.Buckets) == 0 {
			return nil
		}
		return b.ensureBuckets(resID, hostPort, secret, res.Buckets)
	}
	return nil
}

func (b *Bootstrapper) ensureKafkaTopic(resID, image string, hostPort int, topic string) error {
	cmd := fmt.Sprintf("docker run --rm --network host --entrypoint /usr/bin/rpk %s topic create '%s' -p 1 -X brokers=127.0.0.1:%d", image, topic, hostPort)
	if _, err := b.ssh.Run(cmd); err != nil {
		if strings.Contains(err.Error(), "ALREADY_EXISTS") || strings.Contains(err.Error(), "already exists") {
			return nil
		}
		return fmt.Errorf("create topic %s on %s: %w", topic, resID, err)
	}
	return nil
}

func (b *Bootstrapper) ensureBuckets(resID string, hostPort int, secret string, buckets []string) error {
	envFile := fmt.Sprintf("/run/anode-s3-%s.env", resID)
	creds := fmt.Sprintf("AWS_ACCESS_KEY_ID=anode\nAWS_SECRET_ACCESS_KEY=%s\nAWS_DEFAULT_REGION=us-east-1\n", secret)
	if err := b.ssh.StreamBytes([]byte(creds), envFile, 0o600); err != nil {
		return fmt.Errorf("write S3 credentials for %s: %w", resID, err)
	}
	defer b.ssh.Run(fmt.Sprintf("rm -f '%s'", envFile))
	endpoint := fmt.Sprintf("http://127.0.0.1:%d", hostPort)
	for _, bucket := range buckets {
		script := fmt.Sprintf("aws --endpoint-url %s s3api head-bucket --bucket %s >/dev/null 2>&1 || aws --endpoint-url %s s3 mb s3://%s", endpoint, bucket, endpoint, bucket)
		cmd := fmt.Sprintf("docker run --rm --network host --env-file '%s' --entrypoint /bin/sh %s -c '%s'", envFile, awsCLIImage, script)
		if _, err := b.ssh.Run(cmd); err != nil {
			return fmt.Errorf("create bucket %s on %s: %w", bucket, resID, err)
		}
	}
	return nil
}
