# Robot Black Box architecture

This document describes the public reference architecture, trust boundaries, evidence lifecycle, analytical projection and deployment evolution. It distinguishes implemented local behavior from interfaces intended for production integration.

## 1. System context

```mermaid
flowchart TB
  subgraph Environment[Operational environment]
    HUMAN[Human operator or reviewer]
    AGENT[Agent or VLA model]
    RAG[Context and RAG system]
    TWIN[Digital twin or simulator]
    DEVICE[Robot vehicle or edge controller]
    BUSINESS[Business and financial systems]
  end

  subgraph RBB[Robot Black Box public core]
    ADAPTER[Passive adapter boundary]
    RECORDER[Transactional recorder]
    WITNESS[Checkpoint witness role]
    BUNDLE[Signed portable bundle]
    VERIFIER[Offline verifier]
    POLICY[Deterministic policy evaluator]
    REVIEW[Portable review and local studio]
    PROJECTION[Iceberg projection contract]
  end

  subgraph External[External integrations]
    GRC[GRC Claw]
    LAKE[Iceberg lakehouse]
    CUSTODY[Independent custody service]
    IAM[Enterprise identity and PAM]
  end

  HUMAN --> ADAPTER
  AGENT --> ADAPTER
  RAG --> ADAPTER
  TWIN --> ADAPTER
  DEVICE --> ADAPTER
  BUSINESS --> ADAPTER
  ADAPTER --> RECORDER
  RECORDER --> WITNESS
  RECORDER --> BUNDLE
  WITNESS --> BUNDLE
  BUNDLE --> VERIFIER
  VERIFIER --> POLICY
  VERIFIER --> REVIEW
  VERIFIER --> PROJECTION
  VERIFIER -. evidence mapping .-> GRC
  PROJECTION -. qualified writer .-> LAKE
  WITNESS -. production replacement .-> CUSTODY
  RECORDER -. production identity .-> IAM
```

Solid lines represent local reference paths. Dashed lines are integration boundaries whose production services are not supplied by this repository.

## 2. Architectural planes

```mermaid
flowchart LR
  subgraph Authority[Authority plane]
    MANDATE[Mandate]
    GRANT[Signed grant]
    PROFILE[Capture profile]
    REVOCATION[Trust revision and revocation]
  end

  subgraph Cognition[Cognition plane]
    CONTEXT[Context receipt]
    PROPOSAL[Agent proposal]
    UNCERTAINTY[Abstention or uncertainty]
  end

  subgraph Effect[Effect plane]
    ADAPTER[Consequence adapter]
    ACTION[Attempted action]
    OBSERVATION[Independent observation]
  end

  subgraph Evidence[Evidence plane]
    EVENT[Canonical event]
    ARTIFACT[Artifact digest]
    CHECKPOINT[Witnessed checkpoint]
    PACKAGE[Portable package]
  end

  subgraph Assurance[Assurance plane]
    VERIFY[Verification]
    CONTROL[Control result]
    INCIDENT[Incident or exception]
    REMEDY[Containment and remedy]
  end

  MANDATE --> GRANT --> PROPOSAL
  PROFILE --> EVENT
  REVOCATION --> CONTROL
  CONTEXT --> PROPOSAL
  PROPOSAL --> ADAPTER --> ACTION --> OBSERVATION
  GRANT --> ADAPTER
  CONTEXT --> EVENT
  PROPOSAL --> EVENT
  ACTION --> EVENT
  OBSERVATION --> EVENT
  EVENT --> ARTIFACT --> CHECKPOINT --> PACKAGE
  PACKAGE --> VERIFY --> CONTROL
  CONTROL --> INCIDENT --> REMEDY
```

No plane can silently substitute for another. A model proposal is not a grant, an execution acknowledgement is not an outcome, and a signed record is not proof of source truth.

## 3. Capture and commit sequence

```mermaid
sequenceDiagram
  autonumber
  participant S as Source
  participant A as Adapter
  participant R as Recorder
  participant DB as SQLite spool
  participant W as Witness role
  participant E as Exporter

  S->>A: Observation or declared event
  A->>R: Structured input and provenance
  R->>R: Validate bounded schema
  R->>R: Canonicalize body and calculate digest
  R->>R: Sign event in domain RBB-EVENT-v1
  R->>DB: Begin transaction
  R->>DB: Append next sequence and previous digest
  DB-->>R: Commit acknowledgement
  R-->>A: Durable local acknowledgement
  R->>W: Signed checkpoint
  W->>W: Reject fork or rollback
  W-->>R: Signed receipt
  R->>E: Events artifacts and receipts
  E->>E: Build and sign manifest
  E-->>S: Portable bundle path
```

The recorder does not acknowledge a write before SQLite commits. Tests exercise process exit before commit, restart recovery, idempotent retry and conflicting duplicate rejection.

## 4. Evidence package

```mermaid
flowchart TB
  MANIFEST[manifest.json]
  EVENTS[events.ndjson]
  CHECKPOINTS[checkpoints.json]
  OBJECTS[objects by content digest]
  VERIFY[verification.json]
  EVALUATE[evaluation.json]

  MANIFEST -->|events_digest| EVENTS
  MANIFEST -->|checkpoints_digest| CHECKPOINTS
  MANIFEST -->|head_digest| EVENTS
  EVENTS -->|artifact_refs| OBJECTS
  EVENTS -->|chain and causal refs| EVENTS
  EVENTS --> VERIFY
  CHECKPOINTS --> VERIFY
  OBJECTS --> VERIFY
  VERIFY --> EVALUATE
```

The manifest authenticates package-level commitments. Each event authenticates its own canonical body and previous event digest. Artifacts are content-addressed. Verification and evaluation are derived reports and can be recomputed.

## 5. Verification pipeline

```mermaid
flowchart TD
  INTAKE[Bounded file intake] --> CANON[Canonical JSON and exact-key checks]
  CANON --> SCHEMA[Schema and supported-mode checks]
  SCHEMA --> IDENTITY[Enrollment and revocation checks]
  IDENTITY --> SIGNATURE[Domain-separated signature verification]
  SIGNATURE --> CHAIN[Sequence digest and causal-chain checks]
  CHAIN --> ARTIFACT[Artifact existence size and digest checks]
  ARTIFACT --> CHECKPOINT[Checkpoint and witness-head checks]
  CHECKPOINT --> CLOSURE[Closure gap and required-stream analysis]
  CLOSURE --> RESULT{Integrity result}
  RESULT -->|valid| FACTS[Release trusted facts]
  RESULT -->|invalid or unknown| EMPTY[Release no trusted facts]
  FACTS --> CAPTURE[Capture-quality evaluation]
  FACTS --> AUTHZ[Authorization evaluation]
  FACTS --> REVIEW[Independent review]
  FACTS --> ICEBERG[Analytical projection]
```

### Independent conclusions

| Conclusion | Evidence used | Does not establish |
|---|---|---|
| Integrity | Canonical bytes, signatures, chain and artifact digests | Truth, authorization or safety |
| Completeness | Closure, expected streams, gaps and available artifacts | That uncaptured reality was irrelevant |
| Anchoring | Witness receipt and supplied latest head | Global latestness or independent custody |
| Authorization | Signed grant, scope, policy and time | Successful or safe execution |
| Capture quality | Profile, channel/time diagnostics and declared limits | Sensor calibration or physical truth |
| Outcome | Recorded execution/observation fields | Causal attribution or business value |
| Custody | Receipt, identity pin, retained state and restore checks | Legal sufficiency or multi-party independence |

## 6. Trust and custody topology

```mermaid
flowchart LR
  subgraph LocalReference[Implemented same-host reference]
    PKEY[Producer key file]
    AKEY[Authority key file]
    WKEY[Witness key file]
    PDB[Producer SQLite]
    WDB[Witness SQLite]
    RSTATE[Reviewer state]
    BACKUP[Signed local backup]
  end

  subgraph ProductionTarget[Production integration boundary]
    HSM[HSM or managed KMS]
    TSA[Trusted timestamp service]
    WCUSTODY[Independent WORM custody]
    IDP[OIDC workload and device identity]
    REGION[Separate-region recovery]
  end

  PKEY --> PDB
  AKEY --> PDB
  WKEY --> WDB
  PDB --> WDB
  WDB --> RSTATE
  RSTATE --> BACKUP

  PKEY -. replace .-> HSM
  AKEY -. replace .-> HSM
  WKEY -. separate administration .-> WCUSTODY
  WDB -. trusted time .-> TSA
  RSTATE -. federated enrollment .-> IDP
  BACKUP -. independent restore .-> REGION
```

The reference implementation separates roles and processes but runs them on one host. That demonstrates protocol behavior, not organizational independence.

## 7. Policy and consequence separation

```mermaid
sequenceDiagram
  participant Agent
  participant Recorder
  participant Policy
  participant Authority
  participant Adapter
  participant Environment

  Agent->>Recorder: PROPOSAL with intended effect
  Recorder->>Policy: Verified proposal and current context
  Policy->>Authority: Validate grant scope expiry and preconditions
  Authority-->>Policy: pass fail or unknown
  Policy-->>Recorder: Signed or attributable control result
  alt allowed
    Policy->>Adapter: Narrow authorized command
    Adapter->>Environment: Attempt effect
    Environment-->>Recorder: Independent observation and outcome
  else denied or unknown
    Policy-->>Agent: Refuse abstain or escalate
    Recorder->>Recorder: Preserve denial and missing evidence
  end
```

The current public demonstrations evaluate recorded synthetic actions. They do not provide a live hardware interlock.

## 8. Iceberg analytical plane

```mermaid
flowchart TB
  REPORT[Valid verification report with complete trusted facts]
  PROJECT[projectVerifiedReport]
  ROWS[Canonical analytical rows]
  PMANIFEST[Projection contract row count and rows digest]
  RECONCILE[reconcileProjection]
  WRITER[External Flink Spark or custom writer]
  CATALOG[Iceberg REST catalog]
  TABLE[Iceberg v2 evidence_projection.events]
  QUERY[Trino BI notebook or model job]
  METRIC[Versioned metric or feature]
  DECISION[Recorded proposal]

  REPORT --> PROJECT --> ROWS --> PMANIFEST
  PMANIFEST --> RECONCILE
  REPORT --> RECONCILE
  RECONCILE -->|pass| WRITER --> CATALOG --> TABLE --> QUERY --> METRIC --> DECISION
  RECONCILE -->|fail| QUARANTINE[Quarantine and control failure]

  TABLE -. snapshot identity .-> OBS[New Robot Black Box observation]
  OBS -. source event and digest .-> REPORT
```

### Projection invariant

For each analytical row:

```text
(tenant_id, run_id, source_event_id, source_event_digest, source_bundle_digest)
```

must resolve to the verified source. A changed row without a changed rows digest fails reconciliation. An invalid or incomplete trusted-fact set is refused.

### Production responsibilities outside this repository

- object-store and catalog credentials;
- streaming exactly-once qualification;
- row/column access policy and tenant isolation;
- compaction, manifest rewrite, snapshot expiration and orphan cleanup;
- legal holds, deletion propagation and disaster recovery;
- query budgets, semantic metrics and model-feature governance.

## 9. GRC Claw relationship

```mermaid
flowchart LR
  V[Verified RBB report] --> B[robot-black-box-grc-bridge]
  B --> ER[Evidence record]
  B --> AR[Assurance result]
  ER --> GC[GRC Claw compatibility interfaces]
  AR --> GC
  GC --> CR[Control result]
  CR --> AUDIT[Governance review]

  AUDIT -. no mutation .-> V
```

The bridge is optional and local. It demonstrates mapping, not live synchronization with an upstream deployment. Robot Black Box core builds and verifies without the compatibility modules.

## 10. Package dependency architecture

```mermaid
flowchart TB
  CONTRACT[contract]
  ADAPTERS[adapters]
  RECORDER[recorder]
  VERIFIER[verifier]
  POLICY[policy]
  CLI[cli]
  GOVERNANCE[governance]
  STUDIO[studio]
  ICEBERG[iceberg]
  BRIDGE[grc-bridge]
  GRC1[evidence compatibility]
  GRC2[physical-ai-assurance compatibility]

  CONTRACT --> RECORDER
  CONTRACT --> VERIFIER
  CONTRACT --> POLICY
  CONTRACT --> GOVERNANCE
  CONTRACT --> ICEBERG
  ADAPTERS --> CLI
  RECORDER --> CLI
  VERIFIER --> CLI
  POLICY --> CLI
  VERIFIER --> STUDIO
  POLICY --> STUDIO
  GOVERNANCE --> STUDIO
  VERIFIER --> ICEBERG
  VERIFIER --> BRIDGE
  GOVERNANCE --> BRIDGE
  GRC1 --> BRIDGE
  GRC2 --> BRIDGE
```

Private systems may implement public interfaces. Public packages never import private services.

## 11. Data classification and retention boundary

```mermaid
flowchart LR
  INPUT{Input class}
  PUBLIC[Public synthetic fixture]
  REFERENCE[Sensitive reference or digest]
  PROHIBITED[Secret biometric customer or production material]
  REPO[Public repository]
  RUNTIME[Ignored local runtime]
  EXTERNAL[External governed store]

  INPUT --> PUBLIC --> REPO
  INPUT --> REFERENCE --> RUNTIME
  REFERENCE --> EXTERNAL
  INPUT --> PROHIBITED --> EXTERNAL
  PROHIBITED -. never commit .-> REPO
  RUNTIME -. never commit .-> REPO
```

The recorder schema in this preview accepts `public_synthetic` fixtures. Production privacy classes require a separately reviewed schema, storage and lifecycle implementation.

## 12. Failure containment model

```mermaid
flowchart TD
  FAILURE[Detected anomaly]
  CLASSIFY{Failure class}
  INTEGRITY[Integrity or trust failure]
  COMPLETENESS[Capture gap or unavailable artifact]
  AUTHORITY[Expired revoked or excessive authority]
  ANALYTICS[Projection metric or lineage mismatch]
  CUSTODY[Rollback fork or recovery mismatch]

  FAILURE --> CLASSIFY
  CLASSIFY --> INTEGRITY --> WITHHOLD[Withhold trusted facts]
  CLASSIFY --> COMPLETENESS --> PARTIAL[Mark partial and preserve gap]
  CLASSIFY --> AUTHORITY --> DENY[Deny or escalate effect]
  CLASSIFY --> ANALYTICS --> QUARANTINE[Quarantine analytical output]
  CLASSIFY --> CUSTODY --> FREEZE[Freeze evidence-dependent conclusion]

  WITHHOLD --> PRESERVE[Preserve original bytes and diagnostics]
  PARTIAL --> PRESERVE
  DENY --> PRESERVE
  QUARANTINE --> PRESERVE
  FREEZE --> PRESERVE
  PRESERVE --> REQUALIFY[Repair replay and independently requalify]
```

## 13. Deployment evolution

```mermaid
flowchart LR
  P0[P0 local schema and replay]
  P1[P1 offline portable review]
  P2[P2 shadow observation]
  P3[P3 independent custody pilot]
  P4[P4 bounded production]
  P5[P5 federated fleet and lakehouse]
  P6[P6 sector qualification]

  P0 -->|canonical and deterministic| P1
  P1 -->|fresh-process reconstruction| P2
  P2 -->|measured capture and false alarms| P3
  P3 -->|external identity time and restore| P4
  P4 -->|SLOs isolation and incident drills| P5
  P5 -->|cross-region custody and lineage| P6
```

| Phase | Required evidence before promotion |
|---|---|
| P0 | Canonical vectors, schema rejection and deterministic replay |
| P1 | Manifest pin, portable verification and no dependency on originating private keys |
| P2 | Passive live inputs, measured gaps, source clock uncertainty and zero actuator authority |
| P3 | Separate administrative custody, enrolled identities, trusted time and host-loss restore |
| P4 | Tenant isolation, revocation SLO, bounded effects, rollback and operational support |
| P5 | Multi-region reconciliation, governed Iceberg maintenance, lineage and cost controls |
| P6 | Applicable safety, privacy, security, legal and sector-specific qualification |

No phase inherits a safety or compliance conclusion merely because the previous phase passed.

## 14. Implemented and external boundaries

| Capability | Public implementation | Production boundary |
|---|---|---|
| Recording | SQLite transactional reference recorder | Edge durability, high-rate capture and hardware integration |
| Identity | Local generated Ed25519 roles | Enterprise PKI, workload/device identity, PAM and revocation service |
| Witness | Separate same-host process/database | Independent administrator, WORM custody and trusted timestamp |
| Verification | Offline canonical/signature/chain/artifact checks | Accredited procedures and independent operating organization |
| Policy | Deterministic synthetic authorization profile | Customer policy lifecycle and applicable legal interpretation |
| Review | Portable CLI and loopback studio | Enterprise case management, disclosure, appeal and legal hold |
| Analytics | Deterministic Iceberg row contract | Catalog, object store, streaming, BI, feature and maintenance platform |
| Physical AI | Synthetic handover and passive simulator capture | Live controller interlock, hardware validation and safety case |
| GRC | Local compatibility mapping | Hosted integration, control ownership and audit operating model |

## 15. Repository invariants

1. Invalid integrity releases no trusted facts.
2. Unknown evidence is never coerced into pass.
3. Signatures do not imply truth, authorization, completeness or safety.
4. Derived reports remain reproducible from signed source material.
5. Analytical projections retain source event and digest linkage.
6. Public packages never require private product code.
7. Runtime keys, credentials and stores never belong in the public repository.
8. Synthetic results are labeled as synthetic and do not establish live-system performance.

See [README.md](README.md) for setup, package descriptions and current validation, [OPEN-CORE-BOUNDARY.md](OPEN-CORE-BOUNDARY.md) for product separation, and [SECURITY.md](SECURITY.md) for security guidance.
