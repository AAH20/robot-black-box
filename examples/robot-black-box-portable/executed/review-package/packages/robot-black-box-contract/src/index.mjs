import {createHash, createPublicKey, sign, verify} from 'node:crypto';
export const VERSION='0.1.0';
export const ZERO='0'.repeat(64);
export const digest=(bytes)=>createHash('sha256').update(bytes).digest('hex');
export function canonical(value) {
  if(value===null || typeof value==='boolean') return JSON.stringify(value);
  if(typeof value==='string') {
    if(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) throw Error('INVALID_UNICODE');
    return JSON.stringify(value);
  }
  if(typeof value==='number') {
    if(!Number.isFinite(value) || (Number.isInteger(value)&&!Number.isSafeInteger(value))) throw Error('INVALID_NUMBER');
    return JSON.stringify(value);
  }
  if(Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if(typeof value==='object' && Object.getPrototypeOf(value)===Object.prototype) return '{'+Object.keys(value).sort().map(k=>canonical(k)+':'+canonical(value[k])).join(',')+'}';
  throw Error('INVALID_JSON_TYPE');
}
// Wire records must already be canonical. This also rejects duplicate JSON keys.
export function parseWire(text) { const x=JSON.parse(text); if(canonical(x)!==text) throw Error('NONCANONICAL_OR_DUPLICATE_JSON'); return x; }
export function signed(body,keyId,privateKey,domain) {
  const event_digest=digest(canonical(body));
  return {...body,authentication:{algorithm:'ed25519',key_id:keyId,event_digest,signature:sign(null,Buffer.concat([Buffer.from(`RBB-${domain}-v1\0`),Buffer.from(event_digest,'hex')]),privateKey).toString('base64')}};
}
export function authenticate(record,keys,domain) {
  const {authentication:a,...body}=record;
  if(!a || a.algorithm!=='ed25519' || !keys[a.key_id]) throw Error('UNTRUSTED_KEY');
  const enrollment=keys[a.key_id];
  if(enrollment.revoked) throw Error('KEY_REVOKED');
  if(a.event_digest!==digest(canonical(body))) throw Error('DIGEST_MISMATCH');
  const signature=Buffer.from(a.signature,'base64');
  if(signature.length!==64 || signature.toString('base64')!==a.signature) throw Error('BAD_SIGNATURE_ENCODING');
  if(!verify(null,Buffer.concat([Buffer.from(`RBB-${domain}-v1\0`),Buffer.from(a.event_digest,'hex')]),createPublicKey(enrollment.public_key),signature)) throw Error('SIGNATURE_MISMATCH');
  return body;
}
export function exact(x,keys,label) { if(!x || typeof x!=='object'||Array.isArray(x)||Object.keys(x).sort().join('|')!==[...keys].sort().join('|')) throw Error(`SCHEMA_${label}`); }
const fields=['schema_version','event_id','tenant_ref','system_id','run_id','stream_id','producer_id','boot_id','sequence','event_type','observed_at','received_at','monotonic_ns','clock','mode','causal_refs','provenance','config_digest','policy_digest','payload','artifact_refs','privacy','previous_digest','authentication'];
export const payloadFields={
 'run.started':['task','required_streams','trust_profile','source_digest'],
 'observation.recorded':['sensor_id','frame_index','value','units','coordinate_frame','evidence_status'],
 'proposal.recorded':['action_id','input_refs','requested_scope','model_revision','action_representation'],
 'approval.recorded':['grant'],
 'execution.observed':['action_id','start','end','task_outcome','evidence_status'],
 'telemetry.gap':['affected_stream','missing_interval','origin'],
 'config.changed':['previous_config_digest','new_config_digest','activated_at'],
 'run.closed':['status','event_count','unresolved_gaps']
};
export function validateEvent(e) {
 exact(e,fields,'EVENT');
 if(e.schema_version!=='1.0.0-local.1') throw Error('UNSUPPORTED_SCHEMA');
 for(const k of ['event_id','tenant_ref','system_id','run_id','stream_id','producer_id','boot_id']) if(typeof e[k]!=='string'||! /^[A-Za-z0-9_.:-]{1,128}$/.test(e[k])) throw Error(`SCHEMA_${k}`);
 if(!Number.isSafeInteger(e.sequence)||e.sequence<1) throw Error('SCHEMA_SEQUENCE');
 if(!Object.hasOwn(payloadFields,e.event_type)) throw Error('UNSUPPORTED_EVENT_TYPE');
 exact(e.payload,payloadFields[e.event_type],'PAYLOAD');
 if(e.mode!=='synthetic_replay') throw Error('UNSUPPORTED_MODE');
 for(const k of ['config_digest','policy_digest','previous_digest']) if(!/^[a-f0-9]{64}$/.test(e[k])) throw Error(`SCHEMA_${k}`);
 for(const k of ['received_at','observed_at']) if(e[k]!==null && (typeof e[k]!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(e[k])||!Number.isFinite(Date.parse(e[k])))) throw Error(`SCHEMA_${k}`);
 if(e.received_at===null||!/^\d+$/.test(e.monotonic_ns)) throw Error('SCHEMA_CLOCK');
 exact(e.clock,['clock_id','status','max_uncertainty_ms'],'CLOCK');
 if(!['synchronized','unsynchronized','unknown'].includes(e.clock.status)||!(e.clock.max_uncertainty_ms===null || (Number.isFinite(e.clock.max_uncertainty_ms)&&e.clock.max_uncertainty_ms>=0))) throw Error('SCHEMA_CLOCK');
 if(e.observed_at===null && e.clock.status!=='unknown') throw Error('SCHEMA_UNKNOWN_CLOCK');
 if(!Array.isArray(e.causal_refs)||e.causal_refs.some(x=>typeof x!=='string')||new Set(e.causal_refs).size!==e.causal_refs.length) throw Error('SCHEMA_REFS');
 exact(e.provenance,['adapter_name','adapter_version','source_kind','source_digest','source_offsets','claim_class'],'PROVENANCE');
 if(e.provenance.claim_class!=='synthetic'|| !/^[a-f0-9]{64}$/.test(e.provenance.source_digest)||!Array.isArray(e.provenance.source_offsets)) throw Error('SCHEMA_PROVENANCE');
 exact(e.privacy,['classification','purpose_id','retention_policy_id'],'PRIVACY');
 if(e.privacy.classification!=='public_synthetic') throw Error('UNSUPPORTED_PRIVATE_CAPTURE');
 if(!Array.isArray(e.artifact_refs)) throw Error('SCHEMA_ARTIFACTS');
 for(const a of e.artifact_refs) { exact(a,['object_id','algorithm','digest','bytes','media_type','capture_role','availability'],'ARTIFACT'); if(!/^[A-Za-z0-9_-]+$/.test(a.object_id)||a.algorithm!=='sha256'||!/^[a-f0-9]{64}$/.test(a.digest)||!Number.isSafeInteger(a.bytes)||a.bytes<0||a.availability!=='available') throw Error('SCHEMA_ARTIFACT'); }
 exact(e.authentication,['algorithm','key_id','event_digest','signature'],'AUTH');
 if(e.authentication.algorithm!=='ed25519'||typeof e.authentication.key_id!=='string'||! /^(?:[a-f0-9]{64})$/.test(e.authentication.event_digest)||typeof e.authentication.signature!=='string') throw Error('SCHEMA_AUTH');
 if(e.event_type==='run.started'&&(!Array.isArray(e.payload.required_streams)||!e.payload.required_streams.length||e.payload.task!=='benign_block_handover')) throw Error('SCHEMA_START');
 if(e.event_type==='observation.recorded'&&(!Number.isSafeInteger(e.payload.frame_index)||typeof e.payload.value!=='string'||e.payload.evidence_status!=='synthetic')) throw Error('SCHEMA_OBSERVATION');
 if(e.event_type==='proposal.recorded'&&(!Array.isArray(e.payload.input_refs)||typeof e.payload.action_id!=='string'||e.payload.requested_scope!=='benign_block_handover')) throw Error('SCHEMA_PROPOSAL');
 if(e.event_type==='approval.recorded'&&(!e.payload.grant||typeof e.payload.grant!=='object')) throw Error('SCHEMA_APPROVAL');
 if(e.event_type==='execution.observed'&&(!Number.isFinite(Date.parse(e.payload.start))||!Number.isFinite(Date.parse(e.payload.end))||Date.parse(e.payload.end)<Date.parse(e.payload.start)||!['success','failure','unknown'].includes(e.payload.task_outcome)||e.payload.evidence_status!=='synthetic')) throw Error('SCHEMA_EXECUTION');
 if(e.event_type==='telemetry.gap'&&(!Array.isArray(e.payload.missing_interval)||e.payload.missing_interval.length!==2)) throw Error('SCHEMA_GAP');
 if(e.event_type==='config.changed'&&(!/^[a-f0-9]{64}$/.test(e.payload.previous_config_digest)||!/^[a-f0-9]{64}$/.test(e.payload.new_config_digest)||!Number.isFinite(Date.parse(e.payload.activated_at)))) throw Error('SCHEMA_CONFIG');
 if(e.event_type==='run.closed'&&(!['complete','interrupted'].includes(e.payload.status)||!Array.isArray(e.payload.unresolved_gaps)||!Number.isSafeInteger(e.payload.event_count))) throw Error('SCHEMA_CLOSE');
 return e;
}
