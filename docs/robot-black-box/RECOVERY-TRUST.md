# Signed enrollment and revocation during recovery

Pinned backup bytes and custodian identity do not establish that the custodian is currently enrolled. The new `recovery-trust.mjs` reviewer entry point reuses existing `TRUST-LIFECYCLE` authority-signed revisions to gate the existing backup recovery. It adds no new crypto or historical revocation override.

The reviewer supplies a separately pinned authority SPKI PEM fingerprint, public authority enrollment and a minimum acceptable trust revision. A bounded chain of at most 128 records must verify under that identity, with consecutive revisions, canonical previous-record hashes, valid schema, nondecreasing issuance times and a nonexpired latest record. The authority must be enrolled for the requested tenant/purpose and must not be revoked. Custodian enrollment comes exclusively from that final signed revision; caller-supplied historical custodian keys are ignored by the recovery wrapper. The caller must still supply separate custodian identity, intended backup receipt and package pins.

The operational wrapper checks the current process wall clock and ignores an `at` value supplied in its trust configuration. The pure chain-check helper accepts an explicit time for historical diagnostics/tests, which must not be interpreted as current enrollment. No trusted timestamp service or protection against host clock compromise is supplied.

The minimum revision is reviewer-held state, outside the package. It rejects a correctly signed older snapshot below that floor. A reviewer who lowers or loses that floor can still accept a valid, unexpired older revision; a separate test makes this limitation explicit. There is no online discovery that the supplied revision is globally newest. Local validity of an authority-signed snapshot is distinct from online freshness, which remains unknown. The older low-level `recoverBackup` API remains available for explicitly supplied public key maps and does not independently establish signed current enrollment; use `recoverWithTrust` when this policy is required.

Run a fresh local rehearsal:

```sh
node scripts/robot-black-box/recovery-trust-execute.mjs .rbb/recovery-trust-new
node --test scripts/test-robot-black-box-recovery-trust.mjs
```

The destination must not exist. Public artifacts in `examples/robot-black-box-portable/executed/` are `recovery-trust-chain.json`, `recovery-trust-public-pins.json`, `recovery-trust-review.json` and `recovery-trust-execution.json`. Private worker configurations remain local or are removed by the rehearsal. No private keys are in public artifacts, and original signed examples/media/the public portable package are preserved.

Executed results: authority revision 1 enrolled the original custodian; revision 2 revoked it and enrolled a distinct successor key. Eight fresh workers accepted/sealed the original backup and a fresh successor acceptance/backup, denied the revoked old backup, denied revision rollback, denied a signed revision 3 after actual expiration, then recovered under fresh revision 4 with the successor identity. The source assembly copies and custody databases were removed before the recovery checks. A separate copied-out standalone bootstrap reviewed all six original signed synthetic cases from the successor's restored package. The old backup was never re-signed or treated as successor custody.

This is authority-approved successor enrollment plus old-key revocation, not an old/new countersigned key-continuity proof or a historical-key exception. Revoked-key backup recovery stays denied. A compromised custodian cannot be made trustworthy merely by recovering its signed backup; incident-specific historical exceptions would need a separate policy and are not implemented.

All 93 local tests passed: prior 81 plus 12 focused tests for revoked enrollment, tampered/stale/future/missing/rollback chains, wrong/absent authority pins, revoked authority, missing revision floor, explicit historical-floor behavior and executed successor evidence. CI includes the test but has not executed remotely. The actual expiry branch uses a short demonstration lifetime, not a production trust-refresh policy.

All authority/custodian keys, pins, minimum revision and enrollment distribution in this demonstration are same-host generated or supplied. It demonstrates rejection/admission mechanics only, not independently distributed identity, organizational independence, off-host disaster recovery, online freshness, legal admissibility, hardware survivability or live sensor truth. Remaining gates include independent enrollment/revocation publication, durably retained reviewer revision floors, approved incident recovery policy, HSM-backed keys, trusted time and off-host drills.

## Durable reviewer floor milestone

Reviewer-owned SQLite state now retains accepted signed revisions/digests across restarts, rejects lower caller minima and same/higher-revision forks, and commits trust before backup recovery. Actual pre/post-commit exits and retained-floor recovery verified six signed cases; all 100 local tests passed. Explicit profile anchors remain externally supplied demonstration trust. Privileged state rollback, lost-state re-enrollment and discovery of unprovided newer revisions still require external monotonic state/trust distribution. See [REVIEWER-STATE.md](REVIEWER-STATE.md).
