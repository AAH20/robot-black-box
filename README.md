# Robot Black Box

Verifiable incident evidence for physical AI and agent workflows, powered by [GRC Claw](https://github.com/AAH20/GRC_Claw).

A standalone monorepo for passive signed recording, missing-sample diagnostics and offline incident review. It runs from this repository root. Installing the full GRC Claw repository or connecting to a hosted service is not required. The optional GRC bridge and the source relationship are described in [GRC-CLAW-INTEGRATION.md](GRC-CLAW-INTEGRATION.md).

Start with the missing-samples demo: replay 100 retained samples actually observed from MuJoCo's passive sphere-drop engine into a fresh signed recording. Compare its 300 position/velocity/contact observations with explicitly dropped, duplicate, reordered and delayed-receipt derivatives. This command replays retained observations; it does not execute new physics or control a robot.

```sh
npm ci --ignore-scripts --offline --no-audit --no-fund
npm run build
npm test
npm run demo
npm run verify:portable
npm run review
```

Use Node 22.23.0 or newer with node:sqlite and TypeScript stripping support. No registry packages, parent checkout, global compiler or private source files are needed. npm installs eleven local workspace links. The root build checks the nine Robot Black Box package modules and builds two bundled GRC compatibility modules for the optional bridge tests. Core users can run npm run build:core and verify/record without building those compatibility modules.

Expected results: baseline signed integrity valid, capture assurance unknown; dropped/duplicate samples and a real local receipt wait fail capture diagnostics. Reordered source offsets trigger the existing integrity ordering rejection and withhold trusted capture facts. Physical calibration, source truth and sim-to-real assurance remain unknown. The demo creates a fresh ignored .rbb directory containing local keys and recording databases. Never publish that directory.

| Workspace boundary | Role |
|---|---|
| robot-black-box-contract | Canonical envelope/schema/signature contract |
| robot-black-box-recorder | SQLite recorder, separate local witness, key/trust lifecycle |
| robot-black-box-verifier | Offline integrity/completeness and declared capture diagnostics |
| robot-black-box-policy | Execution-time approval evaluation |
| robot-black-box-adapters | Authored synthetic handover adapter; observed passive capture scripts are under scripts/ |
| robot-black-box-governance | Signed declaration/context/retention evaluation and synthetic fixtures |
| robot-black-box-cli | Local recording and offline verification commands |
| robot-black-box-grc-bridge | Optional local evidence/assurance mapping and durable report helper |
| robot-black-box-commercial | MIT loopback evidence-access/reviewer console prototype |
| evidence / physical-ai-assurance | Selected existing MIT GRC Claw compatibility sources for optional bridge tests |

The monorepo retains existing @grc-claw package names as source provenance. All workspace manifests and the root are private:true to prevent accidental npm publication; that flag does not change their MIT license. Public core and the local console remain MIT. Separately scoped assessment, integration and customer-hosted support are service offerings, not an invented proprietary license restriction. The console is not a production SaaS, billing system or certified deployment.

The eight-layer review separates integrity, execution-time authorization, capture quality, recovery enrollment, custody, backup, reviewer floor and checkpoint. Original six-case portable verification retains its fixed 46-entry package plus manifest. Its supplied digest is a demonstration pin, not independent enrollment; real investigators must obtain identities/verifier/digest through trusted channels. Expired profiles are not automatically renewed.

All delivered trust/custody drills use separate roles/processes on the same host. Independent custody, trusted time/HSMs, host-loss recovery, live GR00T inference, biometric matching and aviation equipment/installation certification are not established. The optional bridge maps verified local reports into supplied in-memory evidence and metadata assurance interfaces; it does not establish live upstream integration or any safety approval.

Actual validation: Node 22.23.0 on macOS arm64, offline clean root install/build, 97 shipped passing tests, fresh signed fault demo, six-case portable verification and report generation. Core verification also succeeds with the optional GRC compatibility outputs absent. The broader source prototype previously passed 118 Robot Black Box tests; 21 governance/retention/operational tests and their excluded path-bearing artifacts are outside this sanitized release. The upstream GRC root's separately reported 39 passing / 4 failing framework tests are not this monorepo's CI. Proposed Linux CI has not run remotely; Windows is unverified.

See [architecture](ARCHITECTURE.md), [GRC link](GRC-CLAW-INTEGRATION.md), [scope](RELEASE-SCOPE.md), [security](SECURITY.md), [contributing](CONTRIBUTING.md), [notices](THIRD-PARTY-NOTICES.md) and [MIT license](LICENSE). Historical research in docs/robot-black-box refers to broader optional integrations; use these root commands as the tested release interface. No commercial pricing or customer evidence is bundled.
