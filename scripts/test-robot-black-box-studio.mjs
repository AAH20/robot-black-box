import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {context,replay} from '../packages/robot-black-box-cli/src/index.mjs';
import {LocalStudio,server} from '../packages/robot-black-box-studio/src/index.mjs';
import {DEFAULT_POLICY} from '../packages/robot-black-box-policy/src/index.mjs';
import {authenticate} from '../packages/robot-black-box-contract/src/index.mjs';
test('local fleet end-to-end identity, isolation, approval, purpose, citations, retention and HTTP auth',async()=>{
 const root=mkdtempSync(join(tmpdir(),'rbb-studio-'));const execution=join(root,'execution');const ctx=context(join(execution,'custody'));let service,s;
 try {
  replay(ctx,{out:join(execution,'cases','H0'),run_id:'demo-H0'});service=new LocalStudio(join(root,'studio'),execution);
  const who=(tenant,role)=>service.identities.find(x=>x.tenant===tenant&&x.role===role);const admin=who('tenant-a','admin'),author=who('tenant-a','author'),reviewer=who('tenant-a','reviewer'),investigator=who('tenant-a','investigator'),other=who('tenant-b','admin');
  service.ingest(admin,'H0');assert.equal(service.runs(admin).length,1);assert.equal(service.runs(other).length,0);assert.throws(()=>service.ingest(other,'H0'),/Tenant/);assert.throws(()=>service.run(other,'demo-H0'),/not found/);
  service.policy(author,'handover-v1',DEFAULT_POLICY);assert.throws(()=>service.approve(author,'handover-v1'),/Forbidden/);assert.equal(service.approve(reviewer,'handover-v1').state,'approved');
  assert.throws(()=>service.export(investigator,'demo-H0','unrelated_surveillance'),/Purpose/);assert.equal(service.export(investigator,'demo-H0','handover_evaluation').manifest.run_id,'demo-H0');
  assert.throws(()=>service.investigate(investigator,'demo-H0','unsupported',['nonexistent']),/Citations/);assert.equal(service.investigate(investigator,'demo-H0','Approval and execution are linked.',['demo-H0-approval.recorded','demo-H0-execution.observed']).stored,true);
  assert.equal(service.managedArtifacts(admin,'demo-H0').availability,'available');service.hold(admin,'demo-H0',true);assert.equal(service.retention(admin,'demo-H0').state,'held');assert.throws(()=>service.deleteManaged(admin,'demo-H0'),/held/);service.hold(admin,'demo-H0',false);assert.equal(service.retention(admin,'demo-H0').state,'deletion_requested');assert.equal(service.deleteManaged(admin,'demo-H0').state,'managed_copy_deleted');assert.equal(service.managedArtifacts(admin,'demo-H0').availability,'deleted_managed_copy');service.snapshot(admin,join(root,'snapshot.sqlite'));assert.equal(service.monitor(admin).exceptions.length,0);
  const audit=service.db.prepare('SELECT bytes FROM audit ORDER BY id').all();let previous='0'.repeat(64);for(const x of audit){const record=JSON.parse(x.bytes);const body=authenticate(record,{[service.key.keyId]:service.key},'AUDIT');assert.equal(body.previous_digest,previous);previous=record.authentication.event_digest;}
  s=server(service,{port:0});await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+s.address().port;
  assert.equal((await fetch(base+'/v1/runs')).status,401);const response=await fetch(base+'/v1/runs',{headers:{Authorization:'Bearer '+admin.token}});assert.equal(response.status,200);assert.equal((await response.json()).length,1);
  assert.equal((await fetch(base+'/v1/runs/demo-H0/bundle?purpose=handover_evaluation',{headers:{Authorization:'Bearer '+other.token}})).status,404);
 } finally {if(s)await new Promise(resolve=>s.close(resolve));service?.close();ctx.witness.close();rmSync(root,{recursive:true,force:true});}
});
