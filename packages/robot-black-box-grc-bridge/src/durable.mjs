import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {canonical,digest,signed,authenticate} from '../../robot-black-box-contract/src/index.mjs';
const deny=code=>{throw Object.assign(Error(code),{status:403});};
export class DurableReportStore {
 constructor(path,key){mkdirSync(dirname(path),{recursive:true,mode:0o700});this.key=key;this.db=new DatabaseSync(path);this.db.exec('PRAGMA busy_timeout=5000;PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;CREATE TABLE IF NOT EXISTS reports(tenant TEXT,id TEXT,purpose TEXT,digest TEXT,content BLOB,receipt TEXT,held INTEGER DEFAULT 0,deleted INTEGER DEFAULT 0,PRIMARY KEY(tenant,id,purpose));');}
 authorize(a,p,roles=['admin','reviewer','investigator']){if(!a||!roles.includes(a.role)||!['tenant-a','tenant-b'].includes(a.tenant)||a.purpose!==p||!['handover_evaluation','governance_evaluation'].includes(p))deny('DURABLE_ACCESS_DENIED');}
 attach(a,{id,purpose,content,expected_digest},{fault=null}={}){
  this.authorize(a,purpose);if(typeof id!=='string'||! /^[A-Za-z0-9_.:-]{1,128}$/.test(id))throw Error('DURABLE_ID_INVALID');const bytes=Buffer.from(content);if(bytes.length>8*1024*1024||digest(bytes)!==expected_digest)throw Error('DURABLE_CONTENT_DIGEST');
  const body=JSON.parse(bytes.toString());if(canonical(body)!==bytes.toString()||body.verification?.tenant_ref!==a.tenant||body.verification?.run_id!==id)deny('DURABLE_REPORT_BINDING');
  this.db.exec('BEGIN IMMEDIATE');try{
   const row=this.db.prepare('SELECT * FROM reports WHERE tenant=? AND id=? AND purpose=?').get(a.tenant,id,purpose);
   if(row){if(row.deleted)throw Error('DURABLE_TOMBSTONE');if(row.digest!==expected_digest||!Buffer.from(row.content).equals(bytes))throw Error('DURABLE_ID_CONFLICT');this.check(row);this.db.exec('COMMIT');return {...JSON.parse(row.receipt),idempotent:true};}
   const receipt=signed({schema:'rbb.grc.durable.receipt.v1',tenant:a.tenant,run_id:id,purpose,content_digest:expected_digest,bytes:bytes.length,committed_at:new Date().toISOString(),durability:'local_sqlite_wal_full',scope:'local report bytes; no remote replication or secure erasure'},this.key.keyId,this.key.privateKey,'DURABLE-REPORT');
   this.db.prepare('INSERT INTO reports(tenant,id,purpose,digest,content,receipt) VALUES(?,?,?,?,?,?)').run(a.tenant,id,purpose,expected_digest,bytes,canonical(receipt));
   if(fault==='exit_before_commit')process.exit(99);if(fault==='before_commit')throw Error('INJECTED_DURABLE_PRECOMMIT');this.db.exec('COMMIT');return receipt;
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 check(row){const receipt=authenticate(JSON.parse(row.receipt),{[this.key.keyId]:this.key},'DURABLE-REPORT');if(!row.deleted&&(digest(Buffer.from(row.content))!==row.digest||receipt.content_digest!==row.digest))throw Error('DURABLE_READBACK_DIGEST');}
 read(a,id,purpose){this.authorize(a,purpose);const row=this.db.prepare('SELECT * FROM reports WHERE tenant=? AND id=? AND purpose=?').get(a.tenant,id,purpose);if(!row)deny('DURABLE_REPORT_DENIED');this.check(row);return {receipt:JSON.parse(row.receipt),availability:row.deleted?'deleted_report_copy':'available',content:row.deleted?null:Buffer.from(row.content).toString(),held:!!row.held};}
 hold(a,id,purpose,enabled){this.authorize(a,purpose,['admin']);if(typeof enabled!=='boolean')throw Error('DURABLE_HOLD_BOOLEAN');this.read(a,id,purpose);this.db.prepare('UPDATE reports SET held=? WHERE tenant=? AND id=? AND purpose=?').run(enabled?1:0,a.tenant,id,purpose);}
 remove(a,id,purpose){this.authorize(a,purpose,['admin']);this.db.exec('BEGIN IMMEDIATE');try{const row=this.read(a,id,purpose);if(row.held)throw Error('DURABLE_REPORT_HELD');this.db.prepare('UPDATE reports SET content=NULL,deleted=1 WHERE tenant=? AND id=? AND purpose=?').run(a.tenant,id,purpose);this.db.exec('COMMIT');return {availability:'deleted_report_copy',receipt:row.receipt,physical_erasure:'not_attested',originals:'signed source bundles and digest receipt retained'};}catch(e){this.db.exec('ROLLBACK');throw e;}}
 reconcile(a,id,purpose,expected){const r=this.read(a,id,purpose);if(r.receipt.content_digest!==expected)throw Error('DURABLE_RECONCILIATION_DIGEST');return {...r,verified_readback:true};}
 close(){this.db.close();}
}
export function reportBytes(verification,evaluation,governance=null){const {facts,...summary}=verification;return canonical({verification:summary,evaluation,...(governance?{governance}:{})});}
