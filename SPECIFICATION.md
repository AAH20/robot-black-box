# Robot Black Box protocol specification

Status: public developer preview  
Protocol version: `0.1.0`  
Executed event profile: `1.0.0-local.1`

This document defines the public interoperability boundary implemented by the
reference monorepo. It is deliberately narrower than a production recorder
standard. **MUST**, **MUST NOT**, **SHOULD** and **MAY** describe requirements
for implementations claiming compatibility with this preview.

## 1. Security objective

A conforming implementation preserves authenticated evidence for testing
claims about sequence, authorship, configuration, authorization, capture
quality and observed outcome. It MUST keep those conclusions separate.

A valid signature MUST NOT be reported as proof that a source statement was
true, capture was complete, an action was authorized or safe, a task succeeded,
or custody was independent.

## 2. Evidence objects

| Object | Purpose | Authority |
| --- | --- | --- |
| Event | Bounded observation, proposal, approval, execution or lifecycle fact | Event producer |
| Artifact | Content-addressed supporting material | Artifact bytes and event reference |
| Checkpoint | Signed statement about a stream head | Recorder identity |
| Witness receipt | Acceptance or rejection under a witness policy | Witness identity |
| Manifest | Portable package inventory and binding | Exporter identity |

An analytical row or dashboard is a projection. It MUST bind to the source
event and package digest and MUST NOT replace the signed evidence package.

## 3. Canonical representation

Signed objects use UTF-8 canonical JSON produced by
`packages/robot-black-box-contract/src/index.mjs`.

- Object keys are ordered lexicographically.
- Duplicate keys, lone Unicode surrogates, non-finite numbers and unsafe
  integers are rejected.
- Whitespace outside JSON strings is absent.
- SHA-256 digests are lowercase hexadecimal.
- Ed25519 signatures are canonical base64.
- A verifier MUST reconstruct the canonical body before accepting its digest.

This preview implements a bounded canonicalizer. A portable-v1 profile requires
published cross-language vectors and an explicit relationship to a standard
JSON canonicalization scheme.

## 4. Domain-separated authentication

The signature input is the ASCII domain, a zero byte and the decoded SHA-256
digest:

```text
RBB-<DOMAIN>-v1 || 0x00 || hex_decode(sha256(canonical_body))
```

Verifiers MUST reject an unknown domain, algorithm, key, encoding or digest
mismatch. Enrollment, validity and revocation are evaluated independently from
mathematical signature validity.

## 5. Event invariants

An event conforming to `1.0.0-local.1` MUST:

1. pass the strict schema and semantic validator;
2. identify tenant, system, run, stream, producer and boot context;
3. carry a positive safe-integer sequence;
4. bind the previous accepted event digest or the all-zero genesis digest;
5. distinguish observed, received and monotonic time;
6. declare clock status and maximum known uncertainty;
7. identify adapter, source, source digest and claim class;
8. bind configuration, policy, purpose and retention policy;
9. reference artifacts by digest rather than mutable location; and
10. authenticate the canonical body with an enrolled key.

The executed profile accepts public synthetic replay and retained passive
simulation claims. Implementations MUST NOT relabel them as live, physical,
calibrated or independently witnessed.

## 6. Commit and acknowledgement

The reference recorder writes an event and its stream-head update in one SQLite
transaction and acknowledges durability after commit. A compatible
transactional recorder MUST demonstrate that exit before commit produces no
acknowledged event, recovery returns the last committed head, exact retries are
idempotent and conflicting duplicates are rejected.

Multi-region acknowledgement, quorum durability and protected signing are
outside the executed profile.

## 7. Verification result model

Verification MUST report independent schema, integrity, signature, trust,
sequence, causality, anchoring, capture-completeness, clock, authorization and
outcome conclusions. Missing evidence MUST produce `unknown`, `partial` or
`fail` according to declared policy. It MUST NOT silently become `pass`.

## 8. Compatibility claims

An implementation claiming compatibility MUST publish a profile following
`conformance/profile.schema.json`. Every `demonstrated` or `limited` capability
MUST cite reproducible evidence. Every `limited` or `not_demonstrated`
capability MUST state its limitation.

Passing the profile validator proves only that claim structure and cited paths
are internally consistent. It does not independently reproduce evidence or
certify an implementation.

## 9. Privacy and safety boundary

Adapters SHOULD minimize payload contents and use digest-bound references for
sensitive artifacts. Raw biometric templates, surveillance captures,
credentials, production keys and customer evidence MUST NOT enter this public
repository.

The public adapter is passive. A production enforcement component MUST keep
proposal, authority, command, attempted consequence and independently observed
outcome as distinct events. The recorder MUST NOT be represented as a physical
safety interlock.

## 10. Evolution

Changes follow [COMPATIBILITY.md](COMPATIBILITY.md). Before portable v1, an
incompatible correction requires a new schema or protocol identifier, migration
notes, adversarial fixtures and preserved verification of historical packages.
