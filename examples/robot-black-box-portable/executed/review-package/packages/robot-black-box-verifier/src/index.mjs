import {readFileSync,lstatSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {canonical,digest,parseWire,authenticate,validateEvent,ZERO,exact} from '../../robot-black-box-contract/src/index.mjs';
export function verifyBundle(directory,trust,{latestHeads=null}={}) {
 const errors=[],warnings=[],facts=[];let manifest=null,events=[],checkpoints=[],anchoring='unknown',integrity='valid',completeness='unknown';
 const fail=(code,event_id=null)=>{errors.push({code,event_id});if(['UNTRUSTED_KEY','KEY_REVOKED','UNSUPPORTED_SCHEMA','UNSUPPORTED_EVENT_TYPE','UNSUPPORTED_MODE'].includes(code)){if(integrity!=='invalid')integrity='unknown';}else integrity='invalid';};
 const read=(file)=>{const path=join(directory,file);if(lstatSync(path).isSymbolicLink())throw Error('SYMLINK_REJECTED');const bytes=readFileSync(path);if(bytes.length>64*1024*1024)throw Error('BUNDLE_LIMIT');return bytes.toString('utf8');};
 try {
  manifest=parseWire(read('manifest.json'));exact(manifest,['schema','run_id','tenant_ref','mode','profile','event_count','events_digest','head_digest','checkpoints_digest','limitations','authentication'],'MANIFEST');
  const body=authenticate(manifest,trust.producers,'MANIFEST');
  if(body.schema!=='rbb.bundle.local.v1'||body.profile!=='single_stream_local_v1'||body.mode!=='synthetic_replay')throw Error('UNSUPPORTED_SCHEMA');
  const enrollment=trust.producers[manifest.authentication.key_id];if(!enrollment.tenants?.includes(manifest.tenant_ref)||!enrollment.systems?.length)throw Error('ENROLLMENT_SCOPE');
  const wire=read('events.ndjson');if(!wire.endsWith('\n'))throw Error('PARTIAL_RECORD');
  events=wire.trimEnd().split('\n').filter(Boolean).map(parseWire);checkpoints=parseWire(read('checkpoints.json'));
  if(digest(wire)!==manifest.events_digest)fail('EVENTS_FILE_DIGEST');
  if(digest(canonical(checkpoints))!==manifest.checkpoints_digest)fail('CHECKPOINTS_FILE_DIGEST');
  if(events.length!==manifest.event_count)fail('EVENT_COUNT');
  const ids=new Set();let previous=ZERO;let lastMonotonic=-1n;const start=events[0];
  for(const [i,e]of events.entries()) {
   try {
    validateEvent(e);authenticate(e,trust.producers,'EVENT');
    const source=trust.producers[e.authentication.key_id];
    if(e.authentication.key_id!==manifest.authentication.key_id||e.producer_id!==e.authentication.key_id||!source.systems.includes(e.system_id)||!source.tenants.includes(e.tenant_ref))throw Error('ENROLLMENT_SCOPE');
    if(e.run_id!==manifest.run_id||e.tenant_ref!==manifest.tenant_ref||e.stream_id!==start.stream_id||e.boot_id!==start.boot_id)throw Error('STREAM_SCOPE');
    if(e.sequence!==i+1||e.previous_digest!==previous)throw Error('CHAIN_SEQUENCE');
    if(ids.has(e.event_id)||e.causal_refs.some(ref=>!ids.has(ref)))throw Error('CAUSAL_REFERENCE');
    if(BigInt(e.monotonic_ns)<lastMonotonic)throw Error('MONOTONIC_ROLLBACK');
    for(const a of e.artifact_refs) {
     const path=join(directory,'objects',a.object_id);
     if(!existsSync(path)){warnings.push({code:'ARTIFACT_UNAVAILABLE',event_id:e.event_id,object_id:a.object_id});continue;}
     if(lstatSync(path).isSymbolicLink())throw Error('SYMLINK_REJECTED');
     const bytes=readFileSync(path);if(bytes.length!==a.bytes||digest(bytes)!==a.digest)throw Error('ARTIFACT_DIGEST');
    }
    facts.push(e);
   }catch(err){fail(err.message,e.event_id);}
   ids.add(e.event_id);previous=e.authentication?.event_digest;lastMonotonic=BigInt(e.monotonic_ns??0);
  }
  if(!events.length||events[0].event_type!=='run.started'||events.slice(1).some(e=>e.event_type==='run.started'))fail('START_MISSING');
  if(previous!==manifest.head_digest)fail('HEAD_DIGEST');
  const close=events.at(-1);const gaps=events.filter(e=>e.event_type==='telemetry.gap');
  completeness=close?.event_type==='run.closed'&&close.payload.status==='complete'&&!gaps.length&&!warnings.length?'complete':'partial';
  if(close?.event_type==='run.closed'&&close.payload.event_count!==events.length)fail('CLOSURE_COUNT');
  if(events[0]?.payload.required_streams?.length!==1||events[0]?.payload.required_streams[0]!==events[0]?.stream_id)fail('REQUIRED_STREAMS_UNSUPPORTED');
  let prior=ZERO;let lastSequence=0;
  for(const item of checkpoints) {
   const cp=authenticate(item.checkpoint,trust.producers,'CHECKPOINT');
   exact(cp,['schema','run_id','tenant_ref','stream_id','sequence','head_digest','previous_checkpoint_digest'],'CHECKPOINT');
   if(cp.schema!=='rbb.checkpoint.local.v1'||cp.run_id!==manifest.run_id||cp.tenant_ref!==manifest.tenant_ref||cp.stream_id!==start.stream_id||item.checkpoint.authentication.key_id!==manifest.authentication.key_id||cp.sequence<=lastSequence||cp.previous_checkpoint_digest!==prior||events[cp.sequence-1]?.authentication.event_digest!==cp.head_digest)throw Error('CHECKPOINT_CHAIN');
   if(item.receipt){const r=authenticate(item.receipt,trust.witnesses,'WITNESS');if(r.run_id!==cp.run_id||r.sequence!==cp.sequence||r.head_digest!==cp.head_digest||r.checkpoint_digest!==item.checkpoint.authentication.event_digest)throw Error('WITNESS_RECEIPT');}
   prior=item.checkpoint.authentication.event_digest;lastSequence=cp.sequence;
  }
  const last=checkpoints.at(-1);
  if(!last?.receipt)anchoring='unanchored';
  else if(!latestHeads?.[manifest.run_id])anchoring='unknown';
  else {
   const head=authenticate(latestHeads[manifest.run_id],trust.witnesses,'WITNESS');
   if(head.run_id!==manifest.run_id||head.sequence!==last.checkpoint.sequence||head.head_digest!==last.checkpoint.head_digest||head.checkpoint_digest!==last.checkpoint.authentication.event_digest) {anchoring='stale';fail('EXTERNAL_HEAD_MISMATCH');}
   else anchoring=last.checkpoint.sequence===events.length?'local_current':'local_tail_unanchored';
  }
 }catch(err){fail(err.message);}
 if(integrity!=='valid')facts.length=0;
 return {schema:'rbb.verification.v1',bundle_path:resolve(directory),bundle_digest:manifest?digest(canonical(manifest)):null,run_id:manifest?.run_id??null,tenant_ref:manifest?.tenant_ref??null,mode:'synthetic_replay',integrity,anchoring,completeness,event_count:events.length,errors,warnings,facts,trust_digest:digest(canonical(trust)),latest_heads_digest:latestHeads?digest(canonical(latestHeads)):null,limitations:['Local witness latestness only; same-machine producer, authority and witness custody.','Synthetic observations do not prove input truth or physical safety.']};
}

export {captureQuality} from './capture-quality.mjs';
