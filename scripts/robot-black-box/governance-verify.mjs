import {readFileSync} from 'node:fs';
import {verifyBundle} from '../../packages/robot-black-box-verifier/src/index.mjs';
import {evaluateGovernance} from '../../packages/robot-black-box-governance/src/index.mjs';
const [bundle,trustFile,headsFile]=process.argv.slice(2);const trust=JSON.parse(readFileSync(trustFile,'utf8'));const heads=JSON.parse(readFileSync(headsFile,'utf8'));const verification=verifyBundle(bundle,trust,{latestHeads:heads});const governance=evaluateGovernance(verification,trust);console.log(JSON.stringify({integrity:verification.integrity,governance:governance??{status:'unknown',results:[{code:'GOVERNANCE_EVIDENCE_UNUSABLE'}]}},null,2));process.exitCode=verification.integrity==='invalid'?2:governance?.status==='pass'?0:governance?.status==='fail'?2:3;
