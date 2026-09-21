import {resolve,join} from 'node:path';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {canonical,authenticate,digest} from '../../packages/robot-black-box-contract/src/index.mjs';
import {atomicWrite} from '../../packages/robot-black-box-recorder/src/index.mjs';
import {LocalStudio} from '../../packages/robot-black-box-studio/src/index.mjs';
import {DEFAULT_POLICY} from '../../packages/robot-black-box-policy/src/index.mjs';
const execution=resolve(process.argv[2]??'.rbb/local-demo'),folder=resolve(process.argv[3]??'.rbb/studio-executed');const service=new LocalStudio(folder,execution);
const who=(tenant,role)=>service.identities.find(x=>x.tenant===tenant&&x.role===role);const admin=who('tenant-a','admin'),author=who('tenant-a','author'),reviewer=who('tenant-a','reviewer'),investigator=who('tenant-a','investigator'),other=who('tenant-b','admin');
try {
 for(let i=0;i<7;i++)service.ingest(admin,`H${i}`);
 const id='handover-'+Date.now();const drafted=service.policy(author,id,DEFAULT_POLICY),approved=service.approve(reviewer,id);
 const exported=service.export(investigator,'demo-H0','handover_evaluation');const note=service.investigate(investigator,'demo-H0','Synthetic authority grant is linked to the synthetic execution.',['demo-H0-approval.recorded','demo-H0-execution.observed']);
 service.hold(admin,'demo-H0',true);let holdBlocked=false;try{service.deleteManaged(admin,'demo-H0');}catch(err){holdBlocked=err.status===409;}service.hold(admin,'demo-H0',false);const deletion=service.deleteManaged(admin,'demo-H0');
 const backup=join(folder,'snapshot-'+Date.now()+'.sqlite');const snapshot=service.snapshot(admin,backup);authenticate(snapshot.manifest,{[service.key.keyId]:service.key},'SNAPSHOT');if(digest(readFileSync(backup))!==snapshot.manifest.sha256)throw Error('Snapshot digest mismatch');const restored=new DatabaseSync(backup,{readOnly:true});const restoredRuns=restored.prepare('SELECT count(*) AS n FROM runs').get().n;restored.close();
 const report={schema:'rbb.studio.execution.v1',value_status:'executed_local_demo',tenant_a_runs:service.runs(admin).length,tenant_b_runs:service.runs(other).length,monitor:service.monitor(admin),policy:{drafted,approved},purpose_export:{run_id:exported.manifest.run_id,managed_artifacts:exported.managed_artifacts.availability},cited_note:note,hold_blocked_deletion:holdBlocked,deletion:{state:deletion.state,scope:deletion.tombstone.scope},post_deletion_artifact_status:service.managedArtifacts(admin,'demo-H0').availability,backup_restore:{snapshot_path:backup,restored_runs:restoredRuns,scope:'signed tenant-scoped local metadata snapshot only',signature_and_digest_verified:true},audit_entries:service.db.prepare('SELECT count(*) AS n FROM audit').get().n,limitations:['Loopback/local bearer identities; no OIDC/mTLS, cloud, SLA, external key custody or customer data.','Metadata snapshot is not enterprise disaster recovery; source public replay remains after managed-copy deletion.','No private capture or filesystem secure-erasure guarantee.']};
 atomicWrite(join(folder,'execution.json'),canonical(report));console.log(JSON.stringify({report_path:join(folder,'execution.json'),tenant_a_runs:report.tenant_a_runs,tenant_b_runs:report.tenant_b_runs,hold_blocked_deletion:holdBlocked,deleted:report.post_deletion_artifact_status,restored_runs:restoredRuns},null,2));
}finally{service.close();}
