import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,writeFileSync,readFileSync,existsSync,renameSync,openSync,closeSync,fsyncSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {generateKeyPairSync,createPublicKey} from 'node:crypto';
import {canonical,digest,signed,authenticate,validateEvent,ZERO} from '../../robot-black-box-contract/src/index.mjs';
export function atomicWrite(path,bytes,mode=0o600) { mkdirSync(dirname(path),{recursive:true,mode:0o700}); const tmp=path+'.tmp'; const fd=openSync(tmp,'w',mode); try { writeFileSync(fd,bytes);fsyncSync(fd); } finally {closeSync(fd);} renameSync(tmp,path); const dir=openSync(dirname(path),'r');try{fsyncSync(dir);}finally{closeSync(dir);} }
export function localKey(directory,name) {
 mkdirSync(directory,{recursive:true,mode:0o700}); const path=join(directory,name+'.pem');
 if(!existsSync(path)) {const {privateKey}=generateKeyPairSync('ed25519');atomicWrite(path,privateKey.export({type:'pkcs8',format:'pem'}));}
 const privateKey=readFileSync(path,'utf8');return {keyId:name,privateKey,public_key:createPublicKey(privateKey).export({type:'spki',format:'pem'})};
}
function database(path) {mkdirSync(dirname(resolve(path)),{recursive:true,mode:0o700});const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');return db;}
export class LocalWitness {
 constructor(path,key,producerKeys) {this.db=database(path);this.key=key;this.producerKeys=producerKeys;this.db.exec('CREATE TABLE IF NOT EXISTS heads(run_id TEXT PRIMARY KEY, sequence INTEGER, digest TEXT, receipt TEXT)');}
 anchor(checkpoint) {
  const body=authenticate(checkpoint,this.producerKeys,'CHECKPOINT');
  this.db.exec('BEGIN IMMEDIATE');
  try {
   const prior=this.db.prepare('SELECT * FROM heads WHERE run_id=?').get(body.run_id);
   if(prior&&body.sequence===prior.sequence&&body.head_digest===prior.digest) {this.db.exec('COMMIT');return JSON.parse(prior.receipt);}
   if(prior&&(body.sequence<=prior.sequence||body.previous_checkpoint_digest!==JSON.parse(prior.receipt).checkpoint_digest)) throw Error('WITNESS_FORK_OR_ROLLBACK');
   if(!prior&&body.previous_checkpoint_digest!==ZERO) throw Error('WITNESS_MISSING_PREDECESSOR');
   const receipt=signed({schema:'rbb.witness.local.v1',run_id:body.run_id,sequence:body.sequence,head_digest:body.head_digest,checkpoint_digest:checkpoint.authentication.event_digest,observed_at:new Date().toISOString(),custody:'local_separate_db_same_machine'},this.key.keyId,this.key.privateKey,'WITNESS');
   this.db.prepare('INSERT INTO heads VALUES(?,?,?,?) ON CONFLICT(run_id) DO UPDATE SET sequence=excluded.sequence,digest=excluded.digest,receipt=excluded.receipt').run(body.run_id,body.sequence,body.head_digest,canonical(receipt));
   this.db.exec('COMMIT');return receipt;
  } catch(err){this.db.exec('ROLLBACK');throw err;}
 }
 snapshot(){return Object.fromEntries(this.db.prepare('SELECT run_id,receipt FROM heads').all().map(x=>[x.run_id,JSON.parse(x.receipt)]));}
 close(){this.db.close();}
}
export class Recorder {
 constructor({path,key,run_id,tenant_ref='tenant-a',witness=null,fault=null,max_events=100000}) {
  this.db=database(path);this.key=key;this.run_id=run_id;this.tenant_ref=tenant_ref;this.witness=witness;this.fault=fault;this.max_events=max_events;
  this.db.exec('CREATE TABLE IF NOT EXISTS events(run_id TEXT,seq INTEGER,event_id TEXT,bytes TEXT,digest TEXT,PRIMARY KEY(run_id,seq),UNIQUE(run_id,event_id)); CREATE TABLE IF NOT EXISTS checkpoints(run_id TEXT,seq INTEGER,bytes TEXT,receipt TEXT,PRIMARY KEY(run_id,seq));');
  const rows=this.list(); let previous=ZERO;
  for(const [i,e]of rows.entries()){validateEvent(e);authenticate(e,{[key.keyId]:key},'EVENT');if(e.previous_digest!==previous||e.sequence!==i+1)throw Error('SPOOL_CORRUPT');previous=e.authentication.event_digest;}
 }
 list(){return this.db.prepare('SELECT bytes FROM events WHERE run_id=? ORDER BY seq').all(this.run_id).map(x=>JSON.parse(x.bytes));}
 append(input) {
  this.db.exec('BEGIN IMMEDIATE');
  try {
   const previous=this.db.prepare('SELECT * FROM events WHERE run_id=? ORDER BY seq DESC LIMIT 1').get(this.run_id);
   const duplicate=this.db.prepare('SELECT bytes FROM events WHERE run_id=? AND event_id=?').get(this.run_id,input.event_id);
   if(duplicate) {const e=JSON.parse(duplicate.bytes);const {authentication,previous_digest,sequence,received_at,...original}=e;const proposed={...input,run_id:this.run_id,tenant_ref:this.tenant_ref};if(canonical(original)!==canonical(proposed))throw Error('CONFLICTING_DUPLICATE');this.db.exec('COMMIT');return e;}
   if(previous&&JSON.parse(previous.bytes).event_type==='run.closed') throw Error('RUN_CLOSED');
   if((previous?.seq??0)>=this.max_events)throw Error('SPOOL_BUDGET_EXHAUSTED');
   const body={...input,run_id:this.run_id,tenant_ref:this.tenant_ref,sequence:(previous?.seq??0)+1,received_at:new Date().toISOString(),previous_digest:previous?.digest??ZERO};
   const e=signed(body,this.key.keyId,this.key.privateKey,'EVENT');validateEvent(e);
   if((!previous&&e.event_type!=='run.started')||(previous&&e.event_type==='run.started'))throw Error('RUN_START_INVALID');
   this.db.prepare('INSERT INTO events VALUES(?,?,?,?,?)').run(this.run_id,e.sequence,e.event_id,canonical(e),e.authentication.event_digest);
   if(this.fault==='exit_before_commit')process.exit(99);
   if(this.fault==='before_commit')throw Error('INJECTED_PRECOMMIT_FAILURE');
   this.db.exec('COMMIT'); return e;
  }catch(err){this.db.exec('ROLLBACK');throw err;}
 }
 checkpoint() {
  const rows=this.list();if(!rows.length)throw Error('EMPTY_RUN');const e=rows.at(-1);
  const existing=this.db.prepare('SELECT bytes,receipt FROM checkpoints WHERE run_id=? AND seq=?').get(this.run_id,e.sequence);
  if(existing) return {checkpoint:JSON.parse(existing.bytes),receipt:existing.receipt?JSON.parse(existing.receipt):null};
  const prior=this.db.prepare('SELECT bytes FROM checkpoints WHERE run_id=? ORDER BY seq DESC LIMIT 1').get(this.run_id);
  const cp=signed({schema:'rbb.checkpoint.local.v1',run_id:this.run_id,tenant_ref:this.tenant_ref,stream_id:e.stream_id,sequence:e.sequence,head_digest:e.authentication.event_digest,previous_checkpoint_digest:prior?JSON.parse(prior.bytes).authentication.event_digest:ZERO},this.key.keyId,this.key.privateKey,'CHECKPOINT');
  let receipt=null; if(this.witness)receipt=this.witness.anchor(cp);
  if(this.fault==='checkpoint_before_persist')throw Error('INJECTED_CHECKPOINT_PERSISTENCE_FAILURE');
  this.db.prepare('INSERT INTO checkpoints VALUES(?,?,?,?) ON CONFLICT(run_id,seq) DO UPDATE SET receipt=excluded.receipt').run(this.run_id,e.sequence,canonical(cp),receipt?canonical(receipt):null);
  return {checkpoint:cp,receipt};
 }
 export(directory,artifacts={}) {
  const events=this.list();mkdirSync(directory,{recursive:true,mode:0o700});
  atomicWrite(join(directory,'events.ndjson'),events.map(canonical).join('\n')+'\n');
  mkdirSync(join(directory,'objects'),{recursive:true});for(const [id,bytes]of Object.entries(artifacts)){if(!/^[A-Za-z0-9_-]+$/.test(id))throw Error('ARTIFACT_PATH');atomicWrite(join(directory,'objects',id),bytes);}
  const checkpoints=this.db.prepare('SELECT bytes,receipt FROM checkpoints WHERE run_id=? ORDER BY seq').all(this.run_id).map(x=>({checkpoint:JSON.parse(x.bytes),receipt:x.receipt?JSON.parse(x.receipt):null}));
  const manifest=signed({schema:'rbb.bundle.local.v1',run_id:this.run_id,tenant_ref:this.tenant_ref,mode:'synthetic_replay',profile:'single_stream_local_v1',event_count:events.length,events_digest:digest(events.map(canonical).join('\n')+'\n'),head_digest:events.at(-1)?.authentication.event_digest??ZERO,checkpoints_digest:digest(canonical(checkpoints)),limitations:['Synthetic task observations and authority; no hardware inference.','Keys and witness on same machine; no independent external custody.']},this.key.keyId,this.key.privateKey,'MANIFEST');
  atomicWrite(join(directory,'manifest.json'),canonical(manifest));atomicWrite(join(directory,'checkpoints.json'),canonical(checkpoints));return manifest;
 }
 close(){this.db.close();}
}
