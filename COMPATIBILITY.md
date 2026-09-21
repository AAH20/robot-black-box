# Compatibility and release policy

Robot Black Box is a developer preview. This policy makes change explicit while
the first portable protocol is developed.

## Version surfaces

| Surface | Current identifier | Compatibility unit |
| --- | --- | --- |
| Protocol behavior | `0.1.0` | Canonicalization, signing, trust and conclusions |
| Event wire profile | `1.0.0-local.1` | Strict event schema and payloads |
| Conformance claim | `rbb.conformance-profile.v1` | Capability declaration format |
| Iceberg projection | Package table-contract version | Columns, bindings and reconciliation |
| npm monorepo | `0.1.0-preview.1` | Source and command release |

These versions are related but not interchangeable. A package release does not
silently change an accepted event schema.

## Change classes

- **Patch:** implementation correction preserving accepted bytes and results.
- **Minor:** additive API or optional field behind a new declared capability.
- **Major:** canonical bytes, required fields, signature input, trust semantics
  or an existing conclusion can change.

Before portable v1, an incompatible correction is permitted only when it has a
new identifier, retains the old verifier for published fixtures, includes
positive and adversarial vectors, documents migration and rollback, and does
not rewrite signed historical evidence.

## Reader and writer expectations

- Writers MUST emit one declared schema profile.
- Readers MUST reject unknown required profiles rather than guess.
- Readers MAY preserve an unknown object as opaque bytes.
- Projections MAY add columns but MUST retain source event and bundle digests.
- Migration MUST create a derived object and lineage record; it MUST NOT mutate
  authenticated source bytes.

## Commercial support target

A commercial distribution should support the current portable major version
and one prior major version, publish end-of-support dates, and retain a
read-only verifier for historical packages beyond ingestion support. This is a
target, not an SLA supplied by the public repository.

## Deprecation

A notice identifies the affected surface, replacement, security impact, first
affected release and removal release. Security changes may shorten the normal
window, but historical evidence remains reviewable with isolated pinned tooling
and documented trust inputs.
