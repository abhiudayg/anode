# HealthMesh-25: Enterprise Hospital & Telehealth Ecosystem

`health_mesh_25` is a 25-microservice distributed architecture modeling an enterprise hospital system, electronic health records (EHR), and telehealth platform.

It is designed to benchmark Anode's compiler across healthcare protocols (FHIR stubs, gRPC, HIPAA access auditing, HL7 insurance claims):
- 25 Go microservices
- Backing stores: `postgres`, `mongodb`, `mariadb`, `cockroachdb`, `timescaledb`, `scylladb`, `clickhouse`, `qdrant`, `kafka`, `rabbitmq`, `minio`, `temporal`, `valkey`, `memcached`, and `redis`
- Egress rules: ChangeHealthcare, Availity, OpenAI, Twilio, NPPES CMS Registry
- Typed gRPC: `RegisterEHRServiceServer`

---

## 25 Microservices Breakdown

| # | Service | Backing Store | Sinks / Drivers |
| :--- | :--- | :--- | :--- |
| **1** | `ingress_gateway` | Loopback Ingress | Reverse proxy to clinical services |
| **2** | `auth_sso` | `redis` | Staff JWT session token, HIPAA key |
| **3** | `patient_registry` | `postgres` (Goose) | Master Patient Index (MPI) |
| **4** | `ehr_core` | `mongodb` | FHIR dynamic document store, gRPC Server |
| **5** | `appointments` | `mariadb` (Goose) + `redis` | Clinic slot booking with distributed locks |
| **6** | `telehealth_webrtc` | `redis` | WebRTC signaling, gRPC to `ehr_core` |
| **7** | `prescriptions` | `cockroachdb` (Goose) | Multi-region resilient e-prescriptions |
| **8** | `pharmacy_inventory` | `scylladb` | High-throughput pharmacy medication stock |
| **9** | `lab_results` | `timescaledb` (Goose) | Pathology & diagnostic blood lab metrics |
| **10** | `radiology_pacs` | `minio` | DICOM medical image PACS vault |
| **11** | `billing_claims` | `postgres` (Goose) | External ChangeHealthcare API (`api.changehealthcare.com`) |
| **12** | `insurance_eligibility`| `memcached` | External Availity API (`api.availity.com`) |
| **13** | `clinical_ai` | `qdrant` | Neural symptom diagnostic matcher |
| **14** | `vitals_iot` | `kafka` + `clickhouse` | Bedside telemetry ingestion & OLAP stream |
| **15** | `icu_alerts` | `rabbitmq` | External Twilio API (`api.twilio.com`) |
| **16** | `audit_trail` | `clickhouse` (Goose) | HIPAA access audit trail |
| **17** | `doctor_credentialing`| `mongodb` | External NPPES NPI Registry (`npiregistry.cms.hhs.gov`) |
| **18** | `ambulance_dispatch` | `valkey` | Real-time emergency vehicle location |
| **19** | `surgery_orchestrator`| `temporal` | Operating room perioperative workflow |
| **20** | `genomics_service` | `minio` | FASTQ / BAM genome sequencing data |
| **21** | `patient_portal_msg` | `postgres` | Secure patient-provider messaging |
| **22** | `blood_bank` | `mariadb` | Blood unit inventory and compatibility |
| **23** | `medical_transcription`| `minio` | External OpenAI Whisper API (`api.openai.com`) |
| **24** | `clinical_trials` | `qdrant` | Vector-similarity clinical trial matching |
| **25** | `health_analytics` | `clickhouse` | Population health & epidemiology reports |

---

## Verification

```bash
anode inspect ./examples/health_mesh_25
```
