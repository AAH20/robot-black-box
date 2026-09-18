import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {canonical,authenticate,digest} from '../../packages/robot-black-box-contract/src/index.mjs';
import {verifyBundle} from '../../packages/robot-black-box-verifier/src/index.mjs';
import {captureQuality} from '../../packages/robot-black-box-verifier/src/capture-quality.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
const root=resolve(process.argv[2]??'.rbb/capture-quality-executed'),trust=JSON.parse(readFileSync(join(root,'custody/trust.json'))),heads=JSON.parse(readFileSync(join(root,'custody/witness/latest-heads.json'))),execution=JSON.parse(readFileSync(join(root,'execution.json'))),cases=[];
for(const c of execution.cases){const path=join(root,'cases',c.name),receipt=JSON.parse(readFileSync(join(path,'capture-quality.json')));authenticate(receipt,trust.producers,'CAPTURE-QUALITY');const verified=verifyBundle(path,trust,{latestHeads:heads}),quality=captureQuality(verified,trust,receipt.profile,{at:receipt.at});if(canonical(quality)!==canonical(receipt.quality)||digest(canonical(receipt))!==c.receipt_digest)throw Error('CAPTURE_RECOVERY_CHANGED');cases.push({name:c.name,integrity:verified.integrity,status:quality.status,recomputed_receipt_match:true});}
const result={schema:'rbb.capture.recovery.v1',pid:process.pid,verified_at:new Date().toISOString(),cases,scope:'new-process offline recomputation as of original evaluation time; no current profile renewal or hardware qualification'};atomicWrite(join(root,'recovery.json'),canonical(result));console.log(JSON.stringify(result));
