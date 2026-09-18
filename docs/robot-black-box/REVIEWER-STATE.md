# Durable reviewer revision floor

A signed trust chain alone cannot prevent an operator from forgetting the previously accepted minimum revision at restart. `reviewer-state.mjs` adds a reviewer-owned SQLite WAL/FULL store outside the incoming backup, reusing existing signed-chain validation and backup recovery. It adds no new signatures or enrollment authority.

Explicit profile enrollment pins authority identity, tenant, purpose and an initial revision baseline. Unknown profiles do not auto-enroll during recovery; changing anchors under an existing profile ID is refused. Signed observations must meet the greater of that baseline and the previously accepted revision. The tool ignores the caller's lower minimum and supplied historical timestamp. It also checks that the supplied chain contains the exact digest already retained at the current floor, rejecting both same-revision replacement and a higher revision built on a conflicting branch.

Trust observations commit before any backup recovery begins. A later missing/corrupt backup or scope error cannot lower the retained floor. Exact repeated observations are idempotent. Transactional updates and a five-second busy timeout serialize writers; high-contention load and host power failure were not benchmarked. This is durable local state and logical monotonicity, not hardware-enforced anti-rollback storage.

Run a fresh rehearsal:

```sh
node scripts/robot-black-box/reviewer-state-execute.mjs .rbb/reviewer-state-new
node --test scripts/test-robot-black-box-reviewer-state.mjs
```

The destination must not exist. The tool's trusted configuration selects reviewer state path, profile and supplied chain; incoming packages cannot supply those anchors. Public outputs under `examples/robot-black-box-portable/executed/` are `reviewer-state-execution.json`, `reviewer-state-public-profile.json`, `reviewer-state-trust-chain.json` and `reviewer-state-review.json`. Actual reviewer state remains private under the rehearsal directory. Public artifacts contain no private keys.

The executed drill used nine fresh reviewer processes: enrollment; exit 96 before commit; rollback readback; exit 95 after commit; idempotent retry; lower-revision denial; signed fork denial; package recovery under the retained floor; and final status. Separate acceptance/backup workers created a signed public-package snapshot; its source custody store and assembly were removed before recovery. A separate trusted bootstrap verified all six signed cases from the restored package, and the reviewer retained revision 2 across those restarts. Existing source fixtures, package inventory and media were preserved.

All 100 local tests passed: prior 93 plus seven focused tests for restart persistence, same/higher-revision forks, immutable anchors/unknown profiles, real pre/post-commit interruption and failed-recovery floor retention. CI includes these tests but has not run remotely.

Limits: the reviewer must independently obtain the authority pin, profile baseline and trusted tool. The demonstration supplies them on one host. A privileged attacker can replace this unsigned SQLite store with an older copy; no HSM/remote witness prevents that. Deletion does not silently recreate an enrolled profile, but explicit re-enrollment can lose the advanced floor. Backing up/reinstating reviewer state requires an independently retained baseline or external monotonic witness. This tool cannot discover unprovided newer revisions, attest global latest enrollment, protect a compromised clock, establish independent custody or prove hardware/source authenticity. Low-level stateless recovery remains a separate primitive and does not gain persistence automatically; use `ReviewerState.recover` when retained-floor policy is required.

Remaining gates: independently managed profile distribution; externally witnessed or hardware-backed monotonic reviewer state; safe authority-key rotation and profile migration; off-host recovery drills; incident recovery policy; trusted time and production performance objectives.

## Separately retained reviewer checkpoint

A distinct signer now checkpoints exact reviewer anchors, accepted revision/digest and chained checkpoint sequence. Checkpoint-gated recovery requires external signer/profile/latest-sequence-and-digest pins and rejects an actual older valid database replacement, altered/older checkpoints and missing state. A clean retained matching state copy passed verification and restored six signed cases. All 111 local tests passed. Same-host retention is not independent or hardware-backed rollback protection; replacing every retained pin/copy remains outside this profile. No automatic state repair erases history. See [REVIEWER-CHECKPOINT.md](REVIEWER-CHECKPOINT.md).
