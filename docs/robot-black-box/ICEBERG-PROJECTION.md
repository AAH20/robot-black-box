# Apache Iceberg analytical projection

Robot Black Box evidence and lakehouse analytics have different trust roles.
The signed bundle is the authority for reconstructing what the governed system
recorded. An Iceberg table is a query-optimized, replayable projection of facts
that already passed integrity verification.

`@grc-claw/robot-black-box-iceberg` converts a valid verification report into a
deterministic `evidence_projection.events` row set and manifest. Every row keeps
the source event ID, event digest and bundle digest. `reconcileProjection`
recomputes that projection and detects row changes, loss or duplication.

The package refuses reports whose integrity is not `valid` or whose trusted fact
set does not match the declared event count. Completeness, authorization, source
truth and physical safety remain separate conclusions; a successful projection
does not upgrade them.

## Production integration contract

1. Verify the signed bundle with an independently supplied trust profile.
2. Project rows deterministically and retain the projection manifest.
3. Write rows idempotently using `(tenant_id, run_id, source_event_id)`.
4. Commit to an Iceberg v2 table through a qualified catalog and writer.
5. Record the resulting catalog/table/snapshot identity as a new RBB observation.
6. Reconcile row count and digest before certifying a metric or model input.

Writers must quarantine conflicts rather than overwrite unseen commits. Schema
evolution, snapshot expiration, orphan removal and compaction need explicit
compatibility, legal-hold and evidence-retention checks. No maintenance task may
delete data required to reproduce an investigation, certified metric or model.

The public package does not ship a managed catalog, object-store credentials,
streaming control plane, tenant policy service or production maintenance
automation. Those operational capabilities sit outside the open repository.
