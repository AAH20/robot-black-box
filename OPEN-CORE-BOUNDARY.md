# Open-core boundary

Robot Black Box publishes the interfaces and reference implementation required
for independent recording, verification, replay and interoperability. The
commercial product operates those interfaces for real organizations at scale.

## Public in this repository

- canonical event, signature, manifest, policy and result contracts;
- single-node reference recorder, local witness and offline verifier;
- CLI, conformance fixtures and synthetic failure demonstrations;
- deterministic policy core and GRC Claw compatibility bridge;
- adapter interfaces and benign reference integrations;
- local reviewer studio with synthetic tenant and retention exercises;
- Iceberg analytical-projection contract, reconciliation logic and table schema;
- documentation, threat model, limitations and reproducible tests.

The public project must remain useful without a hosted service. A reviewer must
be able to verify evidence and reproduce published demonstrations offline.

## Outside this repository

The public repository does not contain a hosted control plane, customer data,
production trust anchors, commercial policy packs or deployment secrets. The
following are separately developed and licensed services or software:

- managed multi-region ingestion, fleet operations and availability SLOs;
- enterprise OIDC/SAML/SCIM, PAM, workload identity and device enrollment;
- HSM/KMS, trusted timestamp, WORM and independent custody operations;
- managed Iceberg catalogs, streaming jobs, maintenance automation and DR;
- production connectors, customer-specific controls and qualification packs;
- investigation case management, disclosure, legal hold and regulated retention;
- private failure corpora, incident-derived benchmarks and fleet intelligence;
- customer-cloud, sovereign, air-gapped and regulated deployment automation;
- metering, billing, support, warranties, indemnities and contractual SLAs.

Public schemas and extension points are the compatibility boundary. Private
systems may implement them; public packages never import private code.

## Data and contribution rule

Never commit runtime `.rbb` stores, keys, credentials, customer contexts,
production policies, model weights, customer telemetry, real incident evidence,
commercial pricing or private benchmark distributions. Contributions are
accepted under the repository license; do not submit material you cannot license.

The `private: true` npm flag prevents accidental registry publication. It does
not make files in this public Git repository confidential.
