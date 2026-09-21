import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {context,replay} from '../packages/robot-black-box-cli/src/index.mjs';
import {verifyBundle} from '../packages/robot-black-box-verifier/src/index.mjs';
import {projectVerifiedReport,reconcileProjection,tableContract} from '../packages/robot-black-box-iceberg/src/index.mjs';

test('valid evidence projects deterministically and reconciles to the source bundle',()=>{
 const root=mkdtempSync(join(tmpdir(),'rbb-iceberg-'));const ctx=context(join(root,'custody'));
 try{
  const out=join(root,'H0');replay(ctx,{out,run_id:'iceberg-H0'});
  const verification=verifyBundle(out,ctx.trust,{latestHeads:ctx.witness.snapshot()});
  const first=projectVerifiedReport(verification),second=projectVerifiedReport(verification);
  assert.equal(first.rows_digest,second.rows_digest);
  assert.equal(first.row_count,verification.event_count);
  assert.equal(first.rows[0].source_bundle_digest,verification.bundle_digest);
  assert.equal(first.rows[0].source_event_digest,verification.facts[0].authentication.event_digest);
  assert.equal(reconcileProjection(verification,first).status,'pass');
  assert.equal(tableContract().format_version,2);
  const changed=structuredClone(first);changed.rows[0].event_type='forged';
  assert.equal(reconcileProjection(verification,changed).status,'fail');
 }finally{ctx.witness.close();rmSync(root,{recursive:true,force:true});}
});

test('invalid or incomplete trusted fact sets are not projected',()=>{
 const report={schema:'rbb.verification.v1',integrity:'invalid',event_count:1,facts:[],bundle_digest:'a'.repeat(64)};
 assert.throws(()=>projectVerifiedReport(report),/VALID_INTEGRITY/);
 report.integrity='valid';assert.throws(()=>projectVerifiedReport(report),/COMPLETE_FACT_SET/);
});
