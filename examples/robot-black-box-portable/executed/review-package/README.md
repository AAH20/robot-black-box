Portable public synthetic investigation package. Requires Node 22 or later; no npm install, console, network or original workspace.

Run from this directory: node scripts/robot-black-box/portable-review.mjs . > /tmp/rbb-review.json
Write review.json OUTSIDE the package (for example /tmp/rbb-review.json), because added files invalidate the inventory.

Verify the transport-manifest SHA-256 against a separately obtained trusted pin BEFORE executing supplied code, or run an independently trusted copy of the verifier. The unsigned inventory detects changes against that pin; it does not authenticate its publisher. Included public trust is a historical publisher snapshot, not independent enrollment or current online trust. The optional third argument is a reviewer-supplied trust JSON snapshot; it cannot attest online freshness. Historical capture diagnostics use original receipt times and do not renew expired profiles.

Original signed bundle bytes are preserved. Integrity, completeness, authorization and capture quality are separate. All six sources are synthetic; live source truth, external custody, crash survival and hardware qualification remain unknown. Directory intake only: no archive extraction. Limits: 512 files, 16 MiB/file, 32 MiB total; traversal, symlinks, hardlinks and special files rejected. No private keys or private context stores are exported.
