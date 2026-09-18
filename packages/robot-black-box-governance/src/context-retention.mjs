import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,lstatSync,readdirSync,readFileSync,renameSync,rmSync,rmdirSync,unlinkSync,openSync,closeSync,fsyncSync} from 'node:fs';
import {resolve,join,relative,dirname,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {canonical,digest,signed,authenticate,exact} from '../../robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../robot-black-box-recorder/src/index.mjs';
export const RETENTION_POLICY={schema:'rbb.context.retention.policy.v1',purpose:'governance_evaluation',scope:'one dedicated regenerable synthetic tenant/source store',retention_ms:0,max_files:2048,max_bytes:67108864,purge_method:'detach_drop_tables_remove_owned_source_store',retained:'original synthetic vault, signed evidence, control registry and keys',physical_erasure:'not_attested'};
const fail=code=>{throw Object.assign(Error(code),{code});};
const id=x=>{if(typeof x!=='string'||! /^[a-z][a-z0-9-]{0,47}$/.test(x))fail('STORE_IDENTIFIER_INVALID');return x;};
const syncDir=p=>{const fd=openSync(p,'r');try{fsyncSync(fd);}finally{closeSync(fd);}};
function confined(base,path){const b=resolve(base),p=resolve(path),r=relative(b,p);if(!r||r.startsWith('..'+sep)||r==='..'||r.includes(sep+'..'+sep))fail('STORE_PATH_ESCAPE');let cursor=p;while(cursor!==dirname(cursor)){if(existsSync(cursor)&&lstatSync(cursor).isSymbolicLink())fail('STORE_SYMLINK');cursor=dirname(cursor);}return p;}
export function inventoryFiles(path){
 const files=[];let bytes=0,entries=0;
 function walk(dir,depth=0){if(depth>32)fail('STORE_INVENTORY_BOUND_EXCEEDED');for(const name of readdirSync(dir).sort()){if(++entries>4096)fail('STORE_INVENTORY_BOUND_EXCEEDED');const p=join(dir,name),s=lstatSync(p);if(s.isSymbolicLink())fail('STORE_SYMLINK');if(s.isDirectory())walk(p,depth+1);else{if(!s.isFile()||s.nlink!==1)fail('STORE_FILE_BOUNDARY');bytes+=s.size;if(files.length>=RETENTION_POLICY.max_files||bytes>RETENTION_POLICY.max_bytes)fail('STORE_INVENTORY_BOUND_EXCEEDED');files.push({path:relative(path,p),bytes:s.size,sha256:digest(readFileSync(p))});}}}
 if(!lstatSync(path).isDirectory()||lstatSync(path).isSymbolicLink())fail('STORE_DIRECTORY_INVALID');walk(path);return {files,bytes,count:files.length,digest:digest(canonical(files))};
}
export class ContextRetention {
 constructor(root,{allowedBase,trust,create=false}){
  this.root=confined(allowedBase,root);this.trust=trust;
  if(create){if(existsSync(this.root))fail('OWNED_ROOT_ALREADY_EXISTS');mkdirSync(this.root,{recursive:true,mode:0o700});atomicWrite(join(this.root,'.rbb-context-owner.json'),canonical({schema:'rbb.context.owner.v1',owner:randomUUID(),synthetic:true}));}
  const marker=join(this.root,'.rbb-context-owner.json');if(!existsSync(marker)||lstatSync(marker).isSymbolicLink())fail('OWNED_ROOT_MARKER_REQUIRED');this.owner=JSON.parse(readFileSync(marker,'utf8'));if(this.owner.schema!=='rbb.context.owner.v1'||this.owner.synthetic!==true)fail('OWNED_ROOT_INVALID');
  for(const name of ['stores','.retiring','control','receipts']){const p=confined(this.root,join(this.root,name));mkdirSync(p,{recursive:true,mode:0o700});}
  const dbPath=confined(this.root,join(this.root,'control/retention.sqlite'));this.db=new DatabaseSync(dbPath);this.db.exec('PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;CREATE TABLE IF NOT EXISTS sources(tenant TEXT,source TEXT,store_id TEXT,source_digest TEXT,state TEXT,held INTEGER,lease INTEGER,revision INTEGER,created_at TEXT,retention_until TEXT,policy TEXT,plan TEXT,approval TEXT,cleanup TEXT,PRIMARY KEY(tenant,source));');
 }
 require(actor,roles){if(!actor||!roles.includes(actor.role)||actor.purpose!==RETENTION_POLICY.purpose||typeof actor.subject!=='string')fail('RETENTION_ACTOR_DENIED');id(actor.tenant);}
 row(actor,source,roles=['admin']){this.require(actor,roles);const row=this.db.prepare('SELECT * FROM sources WHERE tenant=? AND source=?').get(actor.tenant,id(source));if(!row)fail('RETENTION_SOURCE_DENIED');return row;}
 paths(row){const store=id(row.store_id);return {active:confined(this.root,join(this.root,'stores',store)),retired:confined(this.root,join(this.root,'.retiring',store))};}
 marker(row,path,{emptyAllowed=false}={}){
  const p=join(path,'.rbb-owned-source-store.json');if(!existsSync(p)){if(emptyAllowed&&existsSync(path)&&readdirSync(path).length===0)return;fail('SOURCE_STORE_MARKER_REQUIRED');}
  if(lstatSync(p).isSymbolicLink())fail('STORE_SYMLINK');const record=JSON.parse(readFileSync(p,'utf8'));const body=authenticate(record,this.trust.producers,'CONTEXT-STORE');
  if(body.owner!==this.owner.owner||body.tenant!==row.tenant||body.source_id!==row.source||body.store_id!==row.store_id||body.source_digest!==row.source_digest||body.synthetic!==true)fail('SOURCE_STORE_BINDING_INVALID');
  if(readdirSync(path).some(n=>!['runtime','.rbb-owned-source-store.json'].includes(n)))fail('SOURCE_STORE_TOP_LEVEL_UNEXPECTED');
 }
 register(actor,source,sourceDigest,key){this.require(actor,['admin']);id(source);if(this.db.prepare('SELECT 1 FROM sources WHERE tenant=? AND source=?').get(actor.tenant,source))fail('SOURCE_ALREADY_REGISTERED');if(!/^[a-f0-9]{64}$/.test(sourceDigest))fail('SOURCE_DIGEST_INVALID');const store=id('s-'+randomUUID());const path=confined(this.root,join(this.root,'stores',store));mkdirSync(path,{mode:0o700});const at=new Date().toISOString();const record=signed({schema:'rbb.context.source.store.v1',owner:this.owner.owner,tenant:actor.tenant,source_id:source,store_id:store,source_digest:sourceDigest,synthetic:true},key.keyId,key.privateKey,'CONTEXT-STORE');atomicWrite(join(path,'.rbb-owned-source-store.json'),canonical(record));this.db.prepare('INSERT INTO sources VALUES(?,?,?,?,?,0,0,0,?,?,NULL,NULL,NULL,NULL)').run(actor.tenant,source,store,sourceDigest,'preparing',at,at);return path;}
 withLease(actor,source,fn){const row=this.row(actor,source,['lab_operator']);if(!['ready','preparing'].includes(row.state)||row.lease)fail('STORE_ACCESS_NOT_READY');const path=this.paths(row).active;this.marker(row,path);this.db.exec('BEGIN IMMEDIATE');try{const current=this.row(actor,source,['lab_operator']);if(!['ready','preparing'].includes(current.state)||current.lease)fail('STORE_ACCESS_NOT_READY');this.db.prepare('UPDATE sources SET lease=1 WHERE tenant=? AND source=?').run(row.tenant,row.source);this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}const release=()=>this.db.prepare('UPDATE sources SET lease=0 WHERE tenant=? AND source=?').run(row.tenant,row.source);let result;try{result=fn(join(path,'runtime'));}catch(e){release();throw e;}if(result&&typeof result.then==='function')return Promise.resolve(result).finally(release);release();return result;}
 activate(actor,source,receipt){const row=this.row(actor,source);if(row.state!=='preparing'||row.lease||receipt.status!=='live_success'||receipt.source_digest!==row.source_digest)fail('STORE_ACTIVATION_UNVERIFIED');this.marker(row,this.paths(row).active);inventoryFiles(this.paths(row).active);this.db.prepare('UPDATE sources SET state=?,revision=revision+1 WHERE tenant=? AND source=?').run('ready',row.tenant,row.source);}
 hold(actor,source,enabled){const row=this.row(actor,source);if(row.state!=='ready'||row.lease)fail('HOLD_REQUIRES_IDLE_READY_STORE');if(typeof enabled!=='boolean')fail('HOLD_BOOLEAN_REQUIRED');if(this.db.prepare("UPDATE sources SET held=?,revision=revision+1,plan=NULL,approval=NULL WHERE tenant=? AND source=? AND state='ready' AND lease=0 AND revision=?").run(enabled?1:0,row.tenant,row.source,row.revision).changes!==1)fail('HOLD_CONCURRENT_CHANGE');return {held:!!enabled};}
 policy(actor,source,envelope){const row=this.row(actor,source);if(row.state!=='ready'||row.lease)fail('RETENTION_POLICY_REQUIRES_IDLE_STORE');const b=authenticate(envelope,this.trust.reviewers,'CONTEXT-RETENTION-POLICY');exact(b,['schema','tenant','source_id','operator_subject','reviewer_subject','purpose','policy_digest','not_before','expires_at'],'RETENTION_POLICY_APPROVAL');if(b.schema!=='rbb.context.retention.approval.v1')fail('RETENTION_APPROVAL_SCHEMA');this.review(b,envelope,row,actor);if(b.policy_digest!==digest(canonical(RETENTION_POLICY)))fail('RETENTION_POLICY_UNSUPPORTED');if(this.db.prepare("UPDATE sources SET policy=?,revision=revision+1,plan=NULL,approval=NULL WHERE tenant=? AND source=? AND state='ready' AND lease=0 AND revision=?").run(canonical(envelope),row.tenant,row.source,row.revision).changes!==1)fail('RETENTION_CONCURRENT_CHANGE');}
 review(body,envelope,row,operator,at=new Date().toISOString()){
  const enrollment=this.trust.reviewers?.[envelope.authentication.key_id];const now=Date.parse(at);
  if(!enrollment||enrollment.role!=='reviewer'||enrollment.tenant!==row.tenant||enrollment.subject!==body.reviewer_subject||body.tenant!==row.tenant||body.source_id!==row.source||body.operator_subject!==operator.subject||body.reviewer_subject===operator.subject||body.purpose!==RETENTION_POLICY.purpose)fail('RETENTION_INDEPENDENT_REVIEW_REQUIRED');
  if(!Number.isFinite(now)||!Number.isFinite(Date.parse(body.not_before))||!Number.isFinite(Date.parse(body.expires_at))||now<Date.parse(body.not_before)||now>=Date.parse(body.expires_at))fail('RETENTION_REVIEW_EXPIRED');
 }
 checkPolicy(row,actor){if(!row.policy)fail('RETENTION_POLICY_NOT_APPROVED');const envelope=JSON.parse(row.policy);const b=authenticate(envelope,this.trust.reviewers,'CONTEXT-RETENTION-POLICY');this.review(b,envelope,row,actor);if(b.policy_digest!==digest(canonical(RETENTION_POLICY)))fail('RETENTION_POLICY_UNSUPPORTED');}
 dryRun(actor,source){const row=this.row(actor,source);this.checkPolicy(row,actor);if(row.state!=='ready')fail('RETENTION_STORE_NOT_READY');const path=this.paths(row).active;this.marker(row,path);const inventory=inventoryFiles(path);const plan={schema:'rbb.context.purge.plan.v1',tenant:row.tenant,source_id:row.source,source_digest:row.source_digest,store_id:row.store_id,policy_digest:digest(canonical(RETENTION_POLICY)),revision:row.revision,retention_until:row.retention_until,held:!!row.held,lease:!!row.lease,inventory,method:RETENTION_POLICY.purge_method,retained:RETENTION_POLICY.retained,physical_erasure:'not_attested'};this.db.prepare('UPDATE sources SET plan=?,approval=NULL WHERE tenant=? AND source=?').run(canonical(plan),row.tenant,row.source);return plan;}
 purge(actor,source,approval,{cleanup,fault=null}={}){
  let row=this.row(actor,source);this.checkPolicy(row,actor);if(row.held)fail('RETENTION_HOLD_DENIED');if(row.lease)fail('RETENTION_ACTIVE_LEASE_DENIED');if(Date.now()<Date.parse(row.retention_until))fail('RETENTION_NOT_DUE');if(!row.plan)fail('RETENTION_DRY_RUN_REQUIRED');
  const plan=JSON.parse(row.plan);const grant=authenticate(approval,this.trust.reviewers,'CONTEXT-PURGE-APPROVAL');exact(grant,['schema','tenant','source_id','operator_subject','reviewer_subject','purpose','policy_digest','not_before','expires_at','plan_digest'],'PURGE_APPROVAL');if(grant.schema!=='rbb.context.purge.approval.v1')fail('RETENTION_APPROVAL_SCHEMA');this.review(grant,approval,row,actor);if(grant.plan_digest!==digest(canonical(plan))||grant.policy_digest!==plan.policy_digest)fail('RETENTION_PURGE_APPROVAL_BINDING');
  const paths=this.paths(row);let path;
  if(row.state==='ready'){
   this.marker(row,paths.active);const inventory=inventoryFiles(paths.active);if(plan.revision!==row.revision||inventory.digest!==plan.inventory.digest)fail('RETENTION_STALE_INVENTORY');
   this.db.exec('BEGIN IMMEDIATE');try{const fresh=this.row(actor,source);if(fresh.state!=='ready'||fresh.held||fresh.lease||fresh.revision!==row.revision)fail('RETENTION_CONCURRENT_CHANGE');this.db.prepare('UPDATE sources SET state=?,approval=? WHERE tenant=? AND source=?').run('retiring',canonical(approval),row.tenant,row.source);this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}
   if(fault==='before_detach')throw Error('INJECTED_BEFORE_DETACH');
  }else if(!['retiring','detached','cleaned'].includes(row.state)||row.approval!==canonical(approval))fail('RETENTION_RECOVERY_APPROVAL_REQUIRED');
  row=this.row(actor,source);
  if(row.state==='retiring'){
   if(existsSync(paths.active)&&existsSync(paths.retired))fail('RETENTION_AMBIGUOUS_PATHS');
   if(existsSync(paths.active)){this.marker(row,paths.active);if(inventoryFiles(paths.active).digest!==plan.inventory.digest)fail('RETENTION_STALE_INVENTORY');renameSync(paths.active,paths.retired);syncDir(dirname(paths.active));syncDir(dirname(paths.retired));}
   if(!existsSync(paths.retired))fail('RETENTION_DETACH_UNKNOWN');this.marker(row,paths.retired);
   if(fault==='after_detach')throw Error('INJECTED_AFTER_DETACH');
   this.db.prepare('UPDATE sources SET state=? WHERE tenant=? AND source=?').run('detached',row.tenant,row.source);
  }
  row=this.row(actor,source);path=paths.retired;
  if(existsSync(paths.active))fail('RETENTION_ACTIVE_PATH_REAPPEARED');
  if(existsSync(path)){this.marker(row,path,{emptyAllowed:row.state==='cleaned'});const inventory=inventoryFiles(path);const approved=new Set(plan.inventory.files.map(f=>f.path));if(inventory.files.some(f=>!approved.has(f.path)))fail('RETENTION_UNAPPROVED_FILE');}
  else if(row.state!=='cleaned')fail('RETENTION_RESIDUE_UNKNOWN');
  if(row.state==='detached'){
   if(typeof cleanup!=='function')fail('RETENTION_SUPPORTED_CLEANUP_REQUIRED');const result=cleanup(join(path,'runtime'));if(result.status!=='verified_tables_dropped'||result.remaining_tables!==0||result.source_digest!==row.source_digest)fail('RETENTION_BACKEND_CLEANUP_UNKNOWN');
   this.db.prepare('UPDATE sources SET state=?,cleanup=? WHERE tenant=? AND source=?').run('cleaned',canonical(result),row.tenant,row.source);row=this.row(actor,source);
   if(fault==='after_cleanup')throw Error('INJECTED_AFTER_CLEANUP');
  }
  if(existsSync(path)){
   this.marker(row,path,{emptyAllowed:true});const inventory=inventoryFiles(path);const approved=new Set(plan.inventory.files.map(f=>f.path));if(inventory.files.some(f=>!approved.has(f.path)))fail('RETENTION_UNAPPROVED_FILE');
   if(existsSync(join(path,'runtime')))rmSync(join(path,'runtime'),{recursive:true,force:false});
   if(existsSync(join(path,'.rbb-owned-source-store.json')))unlinkSync(join(path,'.rbb-owned-source-store.json'));rmdirSync(path);syncDir(dirname(path));
  }
  if(existsSync(paths.active)||existsSync(paths.retired))fail('RETENTION_ABSENCE_UNVERIFIED');
  this.db.prepare('UPDATE sources SET state=? WHERE tenant=? AND source=?').run('purged',row.tenant,row.source);
  return {schema:'rbb.context.purge.result.v1',tenant:row.tenant,source_id:row.source,source_digest:row.source_digest,store_id:row.store_id,state:'purged',plan_digest:digest(canonical(plan)),approval,policy:JSON.parse(row.policy),removed_files:plan.inventory.count,removed_bytes:plan.inventory.bytes,cleanup:JSON.parse(row.cleanup),active_path_absent:true,retired_path_absent:true,scope:RETENTION_POLICY.scope,retained:RETENTION_POLICY.retained,physical_erasure:'not_attested'};
 }
 close(){this.db.close();}
}
