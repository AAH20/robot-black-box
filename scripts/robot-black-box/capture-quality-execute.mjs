import {existsSync,mkdirSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {context} from '../../packages/robot-black-box-cli/src/index.mjs';
import {Recorder,atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {syntheticHandover} from '../../packages/robot-black-box-adapters/src/index.mjs';
import {canonical,digest,signed} from '../../packages/robot-black-box-contract/src/index.mjs';
import {verifyBundle} from '../../packages/robot-black-box-verifier/src/index.mjs';
import {captureQuality} from '../../packages/robot-black-box-verifier/src/capture-quality.mjs';
const root=resolve(process.argv[2]??'.rbb/capture-quality-executed');if(existsSync(root))throw Error('OUTPUT_EXISTS');mkdirSync(root,{recursive:true,mode:0o700});const ctx=context(join(root,'custody')),at=new Date().toISOString(),cases=[];
try{
 for(const name of ['declared_baseline','missing_channel','wrong_units','time_rollback','cadence_gap','uncertain_clock']){
  const run_id='capture-'+name,source=syntheticHandover({case_id:'H0',authority:ctx.authority,producer_id:ctx.producer.keyId,run_id}),e=source.events[1];
  const channel={id:'camera',sensor_id:'synthetic-camera',units:'abstract',coordinate_frame:'diagram',clock_id:'synthetic-clock',max_uncertainty_ms:0,expected_count:1,max_interval_ms:null,calibration:'unverified_synthetic_declaration'};
  if(name==='missing_channel')channel.sensor_id='synthetic-required-second-camera';
  if(name==='wrong_units')e.payload.units='meters';
  if(name==='time_rollback')e.observed_at=new Date(Date.parse(source.events[0].observed_at)-1000).toISOString();
  if(name==='uncertain_clock')e.clock.status='unknown';
  if(name==='cadence_gap'){const extra=structuredClone(e);extra.event_id=run_id+'-second-observation';extra.payload.frame_index++;extra.monotonic_ns='1500000000';extra.observed_at=new Date(Date.parse(e.observed_at)+500).toISOString();extra.artifact_refs=[];source.events.splice(2,0,extra);source.events.at(-1).payload.event_count++;channel.expected_count=2;channel.max_interval_ms=100;}
  const profile=signed({schema:'rbb.capture.profile.v1',issuer:ctx.authority.keyId,tenant:'tenant-a',system_id:'handover-synthetic-01',run_id,mode:'synthetic_replay',not_before:new Date(Date.parse(at)-1000).toISOString(),expires_at:new Date(Date.parse(at)+60000).toISOString(),channels:[channel]},ctx.authority.keyId,ctx.authority.privateKey,'CAPTURE-PROFILE');
  const path=join(root,'cases',name),r=new Recorder({path:join(root,'events.sqlite'),key:ctx.producer,run_id,witness:ctx.witness});try{for(const event of source.events)r.append(event);r.checkpoint();r.export(path,source.objects);}finally{r.close();}
  const verified=verifyBundle(path,ctx.trust,{latestHeads:ctx.witness.snapshot()}),quality=captureQuality(verified,ctx.trust,profile,{at});if(verified.integrity!=='valid'||quality.status!==(['declared_baseline','uncertain_clock'].includes(name)?'unknown':'fail'))throw Error('CAPTURE_DIAGNOSTIC_MISMATCH:'+name);
  const receipt=signed({schema:'rbb.capture.quality.receipt.v1',case:name,at,verification:{integrity:verified.integrity,bundle_digest:verified.bundle_digest,completeness:verified.completeness},profile,quality,scope:'synthetic fault/recovery exercise; no physical capture'},ctx.producer.keyId,ctx.producer.privateKey,'CAPTURE-QUALITY');atomicWrite(join(path,'capture-quality.json'),canonical(receipt));cases.push({name,run_id,integrity:verified.integrity,status:quality.status,receipt_digest:digest(canonical(receipt)),codes:quality.results.map(r=>r.code)});
 }
 atomicWrite(join(root,'custody/witness/latest-heads.json'),canonical(ctx.witness.snapshot()));const result={schema:'rbb.capture.quality.execution.v1',at,cases,status:'verified_synthetic_capture_diagnostics',scope:'read-only profile/time/channel checks; signing is not calibration or crash survival'};atomicWrite(join(root,'execution.json'),canonical(result));console.log(JSON.stringify(result));
}finally{ctx.witness.close();}
