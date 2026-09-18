#!/usr/bin/env node
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {platform,arch,cpus} from 'node:os';
import {canonical,digest,signed} from '../../robot-black-box-contract/src/index.mjs';
import {localKey,Recorder,LocalWitness,atomicWrite} from '../../robot-black-box-recorder/src/index.mjs';
import {captureQuality} from '../../robot-black-box-verifier/src/capture-quality.mjs';
import {verifyBundle} from '../../robot-black-box-verifier/src/index.mjs';
import {evaluate,DEFAULT_POLICY} from '../../robot-black-box-policy/src/index.mjs';
import {syntheticHandover,cases,GOLD} from '../../robot-black-box-adapters/src/index.mjs';
export function context(root) {
 const base=resolve(root);mkdirSync(base,{recursive:true,mode:0o700});
 const producer=localKey(join(base,'producer-keys'),'producer-local');const authority=localKey(join(base,'authority-keys'),'authority-local');const witnessKey=localKey(join(base,'witness-private'),'witness-local');
 const trust={schema:'rbb.trust.local.v1',producers:{[producer.keyId]:{public_key:producer.public_key,tenants:['tenant-a','tenant-b'],systems:['handover-synthetic-01'],revoked:false}},authorities:{[authority.keyId]:{public_key:authority.public_key,tenants:['tenant-a','tenant-b'],roles:['lab_operator'],revoked:false}},witnesses:{[witnessKey.keyId]:{public_key:witnessKey.public_key,revoked:false}},limitations:['Same-machine local development custody only.']};
 atomicWrite(join(base,'trust.json'),canonical(trust));atomicWrite(join(base,'policy.json'),canonical(DEFAULT_POLICY));
 const witness=new LocalWitness(join(base,'witness','heads.sqlite'),witnessKey,trust.producers);
 return {base,producer,authority,witness,trust};
}
export function replay(ctx,{case_id='H0',seed=0,out,run_id=`${case_id}-${seed}`,tenant_ref='tenant-a'}) {
 if(existsSync(join(out,'manifest.json')))throw Error('OUTPUT_EXISTS_USE_NEW_RUN');
 const source=syntheticHandover({case_id,seed,authority:ctx.authority,producer_id:ctx.producer.keyId,run_id,tenant_ref});
 const recorder=new Recorder({path:join(ctx.base,'producer-spool','events.sqlite'),key:ctx.producer,run_id,tenant_ref,witness:ctx.witness});
 if(recorder.list().length){recorder.close();throw Error('RUN_ID_EXISTS_USE_NEW_RUN');}
 const append_ms=[];
 try {
  for(const input of source.events){const t=performance.now();recorder.append(input);append_ms.push(performance.now()-t);}
  recorder.checkpoint();recorder.export(out,source.objects);
 }finally{recorder.close();}
 // Intentional attack interventions happen AFTER authentic export.
 if(case_id==='H4'){writeFileSync(join(out,'objects','observation-frame'),'altered-after-export');}
 if(case_id==='H5') {
  const events=readFileSync(join(out,'events.ndjson'),'utf8').trim().split('\n').map(JSON.parse);let prev='0'.repeat(64);
  for(let i=0;i<events.length;i++) {const {authentication,...body}=events[i];body.previous_digest=prev;if(body.event_type==='observation.recorded')body.payload.value='rewritten signed observation';events[i]=signed(body,ctx.producer.keyId,ctx.producer.privateKey,'EVENT');prev=events[i].authentication.event_digest;}
  const wire=events.map(canonical).join('\n')+'\n';atomicWrite(join(out,'events.ndjson'),wire);
  const cp=signed({schema:'rbb.checkpoint.local.v1',run_id,tenant_ref,stream_id:'main',sequence:events.length,head_digest:prev,previous_checkpoint_digest:'0'.repeat(64)},ctx.producer.keyId,ctx.producer.privateKey,'CHECKPOINT');
  const original=JSON.parse(readFileSync(join(out,'checkpoints.json'),'utf8'));
  const checkpoints=[{checkpoint:cp,receipt:original[0].receipt}];atomicWrite(join(out,'checkpoints.json'),canonical(checkpoints));
  const {authentication,...m}=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'));m.events_digest=digest(wire);m.head_digest=prev;m.checkpoints_digest=digest(canonical(checkpoints));atomicWrite(join(out,'manifest.json'),canonical(signed(m,ctx.producer.keyId,ctx.producer.privateKey,'MANIFEST')));
 }
 const latestHeads=ctx.witness.snapshot();atomicWrite(join(ctx.base,'witness','latest-heads.json'),canonical(latestHeads));
 const t=performance.now();const verification=verifyBundle(out,ctx.trust,{latestHeads});const verify_ms=performance.now()-t;
 const evaluation=evaluate(verification,DEFAULT_POLICY,ctx.trust);
 const {facts,...summary}=verification;
 atomicWrite(join(out,'verification.json'),canonical(summary));atomicWrite(join(out,'evaluation.json'),canonical(evaluation));
 return {case_id,seed,run_id,tenant_ref,bundle_digest:verification.bundle_digest,verification:summary,evaluation,measurement:{append_ms,verify_ms,event_count:verification.event_count},gold:source.gold};
}
export function benchmark(ctx,{out,seeds=50}) {
 mkdirSync(out,{recursive:true});const results=[];const start=performance.now();
 for(const seed of Array.from({length:seeds},(_,i)=>i))for(const case_id of cases)results.push(replay(ctx,{case_id,seed,out:join(out,'runs',`${case_id}-${seed}`),run_id:`benchmark-${case_id}-${seed}`}));
 const sorted=results.flatMap(x=>x.measurement.append_ms).sort((a,b)=>a-b);
 const count=(predicate)=>results.filter(predicate).length;
 const arm=(name,predict)=>({name,authorization_correct:count(x=>predict(x)===x.gold.authorization),trials:results.length,unknown_predictions:count(x=>predict(x)==='unknown')});
 const confusion={};for(const r of results){const key=`${r.gold.authorization}->${r.evaluation.authorization}`;confusion[key]=(confusion[key]??0)+1;}
 const summary={schema:'rbb.benchmark.v1',version:'1.0.0-local.1',dataset:'synthetic-handover-v1',value_status:'measured_local_replay',gold_source:'intervention-authored GOLD constants, not evaluator outputs; external peer review pending',seeds_per_case:seeds,trials:results.length,events:results.reduce((a,x)=>a+x.measurement.event_count,0),source_profile:'synthetic_replay',environment:{node:process.version,sqlite:'node:sqlite',os:platform(),arch:arch(),cpu:cpus()[0]?.model,cpu_count:cpus().length},elapsed_ms:performance.now()-start,append_p50_ms:sorted[Math.floor(sorted.length*.5)],append_p95_ms:sorted[Math.floor(sorted.length*.95)],verify_mean_ms:results.reduce((a,x)=>a+x.measurement.verify_ms,0)/results.length,confusion,integrity_correct:count(x=>x.verification.integrity===x.gold.integrity),arms:[arm('ordinary logs: conservative authorization unknown',()=> 'unknown'),arm('structured integrity recording without policy: authorization unknown',()=> 'unknown'),arm('structured recording + deterministic policy',x=>x.evaluation.authorization)],cases:cases.map(id=>({case_id:id,trials:count(x=>x.case_id===id),authorization:results.find(x=>x.case_id===id).evaluation.authorization,integrity:results.find(x=>x.case_id===id).verification.integrity,correct:count(x=>x.case_id===id&&x.evaluation.authorization===x.gold.authorization&&x.verification.integrity===x.gold.integrity)})),limitations:['Controlled synthetic interventions; not hardware, model performance, independent human reconstruction-time study or representative incident distribution.','Conservative log/recording baselines cannot evaluate authority and abstain; no generalized superiority claim.','Same-machine key/witness custody; external safety/custody validation pending.','Performance is this short workload, not the planned 10-minute stress gate.']};
 atomicWrite(join(out,'summary.json'),canonical(summary));atomicWrite(join(out,'trials.json'),canonical(results));return summary;
}
function args(argv){const [command,...rest]=argv;const options={};for(let i=0;i<rest.length;i+=2){if(!rest[i].startsWith('--')||rest[i+1]===undefined)throw Error('Expected --option value');options[rest[i].slice(2)]=rest[i+1];}return {command,options};}
export async function main(argv=process.argv.slice(2)) {
 if(!argv.length||argv[0]==='--help'){console.log('capture-quality --bundle directory --trust trust.json --heads latest-heads.json --profile capture-profile.json --out report.json [--at historical-time]\nrobot-black-box replay --case case.json --out directory [--state .rbb]\nverify --bundle directory --trust trust.json --heads latest-heads.json --out report.json\nevaluate --bundle directory --trust trust.json --heads latest-heads.json --policy policy.json --out report.json\nbenchmark --out directory [--seeds 50] [--state .rbb]');return;}
 const {command,options:o}=args(argv);
 if(command==='replay'||command==='benchmark'){const ctx=context(o.state??'.rbb');try{const result=command==='replay'?replay(ctx,{...JSON.parse(readFileSync(o.case,'utf8')),out:resolve(o.out)}):benchmark(ctx,{out:resolve(o.out),seeds:Number(o.seeds??50)});console.log(JSON.stringify(command==='replay'?{run_id:result.run_id,integrity:result.verification.integrity,authorization:result.evaluation.authorization}:result,null,2));}finally{ctx.witness.close();}return;}
 if(command==='capture-quality'){const trust=JSON.parse(readFileSync(o.trust));const verified=verifyBundle(resolve(o.bundle),trust,{latestHeads:o.heads?JSON.parse(readFileSync(o.heads)):null});const result=captureQuality(verified,trust,JSON.parse(readFileSync(o.profile)),o.at?{at:o.at}:{});atomicWrite(resolve(o.out),canonical(result));console.log(JSON.stringify({status:result.status,codes:result.results.map(r=>r.code),scope:result.scope}));process.exitCode=result.status==='fail'?2:3;return;}
 if(command==='verify'||command==='evaluate'){const trust=JSON.parse(readFileSync(o.trust,'utf8'));const report=verifyBundle(resolve(o.bundle),trust,{latestHeads:o.heads?JSON.parse(readFileSync(o.heads,'utf8')):null});const result=command==='verify'?report:evaluate(report,JSON.parse(readFileSync(o.policy,'utf8')),trust);atomicWrite(resolve(o.out),canonical(result));console.log(JSON.stringify({run_id:result.run_id,integrity:result.integrity,authorization:result.authorization,anchoring:result.anchoring}));process.exitCode=command==='verify'?(report.integrity==='invalid'?2:report.integrity==='unknown'?3:0):(result.authorization==='fail'?2:result.authorization==='unknown'?3:0);return;}
 throw Error('UNKNOWN_COMMAND');
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url)))main().catch(err=>{console.error(err.message);process.exitCode=1;});
