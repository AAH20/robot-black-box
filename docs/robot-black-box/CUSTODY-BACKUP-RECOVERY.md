# Custody-store loss and backup recovery

This closes a local gap left by custody restoration: evidence can now be recovered after removal of the original custody SQLite store, using a separately kept signed backup. This is an isolated same-host directory rehearsal, not off-host replication or demonstrated recovery from host/media loss.

`custody-backup.mjs` reuses the existing LocalCustody acceptance/restore checks, canonical Ed25519 contract and trusted bootstrap's bounded reads. It validates the selected accepted package, uses SQLite `VACUUM INTO` for a consistent database snapshot, reads back and validates the selected acceptance and all package files, then publishes a signed `CUSTODY-BACKUP` receipt. The receipt binds backup ID, issuer, tenant/purpose/scope, acceptance ID/receipt digest, package manifest digest, database SHA-256/byte count, signed intent digest and a declared local timestamp. The backup never includes custodian signing keys or worker configuration files. The backup database stays private; public outputs contain receipts, public trust and execution reports only.

A signed intent supports retry after the executed exit 97 between snapshot creation and receipt publication. An unsealed backup cannot be recovered. An exact sealed retry returns its original receipt; a changed backup intent/ID is refused. Arbitrary kill points and power failure during snapshot creation have not been demonstrated; a damaged/unsealed snapshot can require recreation from the still-available source store.

Recovery requires both an explicitly pinned custodian public identity and an expected backup-receipt SHA-256 supplied separately from the incoming backup. Receipt bytes, signature/scope and bounded database bytes are checked before opening the database. The receipt pin identifies the intended snapshot and rejects a substituted older/different seal when the reviewer retains the correct expected pin; there is no automatic online discovery of the latest backup. Recovery writes a new private database, validates the acceptance and original package files, restores the package and then runs the standalone trusted package bootstrap separately. Recovery takes only public keys and pins; it has no signing key.

Run with a fresh execution directory:

```sh
node scripts/robot-black-box/backup-execute.mjs .rbb/backup-recovery-new
node --test scripts/test-robot-black-box-backup.mjs
```

The directory must not already exist. Public outputs under `examples/robot-black-box-portable/executed/` are `backup-receipt.json`, `backup-public-trust.json`, `backup-restored-review.json` and `backup-recovery-execution.json`. Private SQLite snapshots remain under the execution directory. Intake accepts only the backup's intent, database and receipt files, rejects links/extra/missing/changed files, and caps each file at 16 MiB; this bounded profile does not support arbitrary large production custody stores. Package limits remain unchanged.

Executed results: nine fresh worker processes accepted the fixture, exited before sealing, retried, checked sealed idempotence, rejected damaged database/receipt/missing file/wrong receipt pin, and recovered. Before recovery the assembly copy, original custody database (including WAL/SHM), original backup directory and private worker configs were removed. An isolated backup copy remained on the same host. A separate copied-out trusted bootstrap reviewed the restored 47 files: six signed cases retained valid integrity; capture diagnostics still report four failures and two unknowns. The original public fixture and older evidence/media were preserved.

All 81 local tests passed: previous 70 plus 11 focused backup tests covering idempotency, store-loss recovery without signing key, corrupted/missing/linked/extra inputs, wrong/absent pins, wrong tenant and actual interruption/retry. CI includes the tests but has not run remotely. The execution report records measured subprocess durations; they are observations from one local rehearsal, not production recovery-time or data-loss objectives. No post-backup ingestion-loss interval/RPO has been tested.

All custodian keys, trust maps and expected pins in the demonstration were generated or supplied on the same host. Real reviewers must independently obtain the custodian identity, public enrollment/revocation policy, intended backup receipt pin, package pin and trusted tools. Backup sealing does not establish organizational independence, online freshness, trusted time, legal admissibility, live sensor truth, secure erasure or crash/fire/water survivability. Signing-key compromise and loss of both local original and backup remain outside this rehearsal.

Remaining gates: off-host immutable replication and verified recovery after actual media/host loss; independent trust/pin distribution; HSM-backed keys and trusted timestamps; custody key rotation/revocation during recovery; retention policy for snapshots; quantified recovery-time/data-loss objectives and monitored periodic recovery drills. No cloud accounts, new services or deployment were introduced.

## Signed enrollment during recovery

The recovery-trust entry point now verifies existing authority-signed lifecycle revisions under an external authority pin and reviewer-held revision floor before using custodian enrollment. Executed recovery denied revoked, expired and rollback trust, then restored a fresh successor-key acceptance under revision 4; no historical revocation override or old-backup re-signing was added. All 93 local tests passed. Global latest-revision discovery, independent trust distribution and durable reviewer floor management remain open; low-level key-map recovery does not establish signed current enrollment. See [RECOVERY-TRUST.md](RECOVERY-TRUST.md).
