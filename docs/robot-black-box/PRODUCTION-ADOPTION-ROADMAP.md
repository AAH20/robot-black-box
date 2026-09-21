# Production and commercial adoption roadmap

This roadmap converts the public reference implementation into a production
evidence platform without turning open verification into a proprietary claim.
Windows begin after a funded team starts and are not delivery commitments.

## Product thesis

The initial commercial wedge is incident evidence for consequential software
agents. It requires less capital and safety qualification than physical
deployment while exercising the proposal, authority, execution, outcome and
custody boundaries later needed by robotics.

Adoption progresses from passive capture to independent verification,
continuous assurance, governed advice and narrowly scoped enforcement.

## Phase gates

| Phase | Target window | Exit evidence | Commercial consequence |
| --- | --- | --- | --- |
| P0 reproducible core | 0–90 days | Specification, conformance profile, container demo, signed releases, cross-platform CI | Design-partner onboarding |
| P1 agent evidence | 3–6 months | OpenTelemetry and LangGraph adapters, Kubernetes deployment, first verified package under 30 minutes | Paid software-agent pilots |
| P2 enterprise trust | 6–12 months | OIDC/SAML/SCIM, workload identity, HSM/KMS, immutable retention, SIEM integrations | Annual enterprise contracts |
| P3 physical AI capture | 9–18 months | Passive ROS 2 and Isaac adapters, retained twin case, supervised lab qualification | Industrial robotics pilots |
| P4 independent custody | 12–24 months | Separate administrative domains, trusted time, multi-region recovery, external assessment | Regulated deployments |
| P5 ecosystem | 18–36 months | Adapter certification, compatibility registry, independent benchmarks | Partner distribution |

## Production scorecard

These are targets to measure under published workload definitions, not current
claims.

| Dimension | Initial target | Required evidence |
| --- | --- | --- |
| Activation | First verified package under 30 minutes | Clean-environment timed study |
| Durability | No acknowledged loss in the crash corpus | Fault-injection and recovery logs |
| Added latency | Explicit p50/p95/p99 by payload and mode | Reproducible benchmark |
| Verification | Sustained throughput and bounded memory | Signed output and hardware declaration |
| Tamper detection | Every published mutation rejected | Public adversarial corpus |
| Isolation | No cross-tenant access in authorization tests | Automated and external testing |
| Availability | 99.9% initial managed-service objective | Customer-visible SLO accounting |
| Recovery | Declared RPO/RTO validated destructively | Off-host restoration report |
| Investigation | Flagship incident reconstructed under 15 minutes | Blinded reviewer study |
| Upgrade safety | Historical verification survives upgrade and rollback | Compatibility matrix |

## Integration order

1. OpenTelemetry GenAI spans and events.
2. LangGraph runs, checkpoints, tool proposals and approvals.
3. Kafka or Redpanda durable transport.
4. Apache Iceberg REST Catalog with Trino and Spark validation.
5. ROS 2 topics, bags, security enclaves and lifecycle nodes.
6. NVIDIA Isaac ROS and GR00T provenance at the ROS boundary.
7. Passive MAVLink telemetry for authorized civilian tests.
8. SIEM, case-management and GRC exports.

Adapters remain passive by default. `observe`, `advise` and `enforce` are
separate modes with distinct privileges and evidence requirements.

## Commercial packaging hypotheses

Pricing must be validated through paid design partners.

| Offer | Scope | Indicative annual value |
| --- | --- | ---: |
| Design partner | One use case and evidence acceptance criteria | USD 75k–250k |
| Enterprise platform | Software agents or small physical-AI fleet | USD 100k–350k |
| Regulated customer cloud | Dedicated custody, identity and retention | USD 300k–1m |
| Sovereign or large fleet | Air-gapped operation and extended support | USD 750k–2m+ |

Price combines a platform minimum with environments, active agents or devices,
committed evidence-volume bands, retention, premium connectors and support.
Pure per-event pricing is avoided because it discourages complete capture.
Services and product recurring revenue remain separate in reporting.

## Unit-economics instrumentation

Track contracted ARR, implementation revenue, ingestion/storage/verification
cost per retained GiB, infrastructure cost per active agent or device, support
hours per connector, gross margin before and after services, time to first
evidence, expansion ARR, churn and the share of investigations completed
without engineering intervention.

A connector graduates into the supported catalog only after installation,
upgrade, rollback, isolation and evidence-loss behavior are automated.

## Trust and compliance work

Map evidence to NIST AI RMF, ISO/IEC 42001, ISO/IEC 23894, ISO/IEC 27001,
SOC 2 and applicable EU AI Act duties. Each mapping records the requirement
identifier, evidence rule, owner, refresh interval, accepted states and
limitations. It supports assessment and is not an automated legal conclusion.

Before regulated production claims, complete an external threat-model review,
penetration test, secure-development policy, SBOM and signed-release pipeline,
dependency response process, privacy impact workflow and customer-visible
incident process.

## Flagship demonstrations

### Enterprise agent change

A LangGraph agent proposes a privileged infrastructure change. The package
binds objective, retrieved context, model and prompt versions, tool proposal,
approval, IAM decision, result and rollback. Cases include an expired grant and
missing context.

### Humanoid handover

A VLA policy performs a benign object handover in a digital twin and supervised
lab. The package separates observations, model identity, configuration,
safety-envelope state, proposal, authorization, command and independent
outcome. The public claim remains passive evidence capture.

### Privacy-bounded access decision

A synthetic biometric provider returns a pseudonymous result. Robot Black Box
records purpose, threshold policy, authorization, override and controller
outcome without a raw image or biometric template.

## Public and private boundary

The specification, schemas, verifier, conformance suite, benign reference
adapters and synthetic fixtures stay public. Managed custody, enterprise
identity, deployment automation, production connectors, private failure corpora,
customer policy packs, operations, billing, support and SLAs belong to the
commercial layer. See [the open-core boundary](../../OPEN-CORE-BOUNDARY.md).
