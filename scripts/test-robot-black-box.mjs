import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {canonical,digest,parseWire,signed,ZERO} from '../packages/robot-black-box-contract/src/index.mjs';
import {Recorder,atomicWrite} from '../packages/robot-black-box-recorder/src/index.mjs';
import {context,replay} from '../packages/robot-black-box-cli/src/index.mjs';
import {syntheticHandover,cases,GOLD} from '../packages/robot-black-box-adapters/src/index.mjs';
import {verifyBundle} from '../packages/robot-black-box-verifier/src/index.mjs';
import {evaluate,DEFAULT_POLICY} from '../packages/robot-black-box-policy/src/index.mjs';
function withContext(fn){const root=mkdtempSync(join(tmpdir(),'rbb-test-'));const ctx=context(root);try{return fn(ctx);}finally{ctx.witness.close();rmSync(root,{recursive:true,force:true});}}
test('canonicalization RFC-style key/number/string vectors and reject duplicate keys',()=>{
 assert.equal(canonical({b:2,a:1}),'{"a":1,"b":2}');assert.equal(canonical({'10':10,'2':2}),' {"10":10,"2":2}'.trim());
 assert.equal(canonical({numbers:[333333333.33333329,4.50,2e-3,1e-27]}),'{"numbers":[333333333.3333333,4.5,0.002,1e-27]}');
 assert.throws(()=>canonical(NaN));assert.throws(()=>canonical('\ud800'));assert.throws(()=>canonical(9007199254740992));assert.throws(()=>parseWire('{"a":1,"a":2}'));
});
for(const case_id of cases)test(`${case_id} signed replay matches intervention-authored gold`,()=>withContext(ctx=>{
 const r=replay(ctx,{case_id,out:join(ctx.base,case_id),run_id:case_id});assert.equal(r.verification.integrity,GOLD[case_id].integrity);assert.equal(r.evaluation.authorization,GOLD[case_id].authorization);
 if(case_id==='H1')assert.equal(r.evaluation.task_outcome,'success');if(case_id==='H3')assert.equal(r.verification.completeness,'partial');
}));
test('precommit failure rolls back and resume commits contiguous sequences; duplicate conflicts',()=>withContext(ctx=>{
 const source=syntheticHandover({authority:ctx.authority,run_id:'fault'});const opts={path:join(ctx.base,'fault.sqlite'),key:ctx.producer,run_id:'fault'};
 let r=new Recorder({...opts,fault:'before_commit'});assert.throws(()=>r.append(source.events[0]),/PRECOMMIT/);assert.equal(r.list().length,0);r.close();
 r=new Recorder(opts);assert.equal(r.append(source.events[0]).sequence,1);assert.equal(r.append(source.events[0]).sequence,1);
 assert.throws(()=>r.append({...source.events[0],monotonic_ns:'1'}),/CONFLICTING/);r.close();r=new Recorder(opts);assert.equal(r.append(source.events[1]).sequence,2);r.close();
}));
test('bounded spool fails explicitly without acknowledging loss',()=>withContext(ctx=>{
 const s=syntheticHandover({authority:ctx.authority,run_id:'budget'});const r=new Recorder({path:join(ctx.base,'budget.sqlite'),key:ctx.producer,run_id:'budget',max_events:1});r.append(s.events[0]);assert.throws(()=>r.append(s.events[1]),/BUDGET/);assert.equal(r.list().length,1);r.close();
}));
test('witness refuses valid signed fork and rollback',()=>withContext(ctx=>{
 replay(ctx,{out:join(ctx.base,'base'),run_id:'fork'});
 const cp=signed({schema:'rbb.checkpoint.local.v1',run_id:'fork',tenant_ref:'tenant-a',stream_id:'main',sequence:6,head_digest:digest('forked'),previous_checkpoint_digest:ZERO},ctx.producer.keyId,ctx.producer.privateKey,'CHECKPOINT');
 assert.throws(()=>ctx.witness.anchor(cp),/FORK_OR_ROLLBACK/);
}));
test('event deletion/reorder, unknown signer, revocation, artifact loss and unanchored latestness',()=>withContext(ctx=>{
 const out=join(ctx.base,'base');replay(ctx,{out,run_id:'mutations'});const heads=ctx.witness.snapshot();
 assert.equal(verifyBundle(out,ctx.trust).anchoring,'unknown');
 const original=readFileSync(join(out,'events.ndjson'),'utf8');let rows=original.trim().split('\n');[rows[1],rows[2]]=[rows[2],rows[1]];writeFileSync(join(out,'events.ndjson'),rows.join('\n')+'\n');assert.equal(verifyBundle(out,ctx.trust,{latestHeads:heads}).integrity,'invalid');
 writeFileSync(join(out,'events.ndjson'),original);const revoked=structuredClone(ctx.trust);revoked.producers['producer-local'].revoked=true;assert.equal(verifyBundle(out,revoked,{latestHeads:heads}).integrity,'unknown');
 const unknown=structuredClone(ctx.trust);unknown.producers={};assert.equal(verifyBundle(out,unknown,{latestHeads:heads}).integrity,'unknown');
 rmSync(join(out,'objects','observation-frame'));const report=verifyBundle(out,ctx.trust,{latestHeads:heads});assert.equal(report.integrity,'valid');assert.equal(report.completeness,'partial');assert.equal(evaluate(report,DEFAULT_POLICY,ctx.trust).authorization,'unknown');
}));
test('approval signature cannot be replaced by recorder signature',()=>withContext(ctx=>{
 const source=syntheticHandover({authority:ctx.authority,run_id:'authority'});source.events[3].payload.grant.signature='fake';source.events[3].payload.grant.authentication.signature=Buffer.alloc(64).toString('base64');delete source.events[3].payload.grant.signature;
 const r=new Recorder({path:join(ctx.base,'auth.sqlite'),key:ctx.producer,run_id:'authority',witness:ctx.witness});for(const e of source.events)r.append(e);r.checkpoint();const out=join(ctx.base,'auth');r.export(out,source.objects);r.close();
 assert.equal(evaluate(verifyBundle(out,ctx.trust,{latestHeads:ctx.witness.snapshot()}),DEFAULT_POLICY,ctx.trust).authorization,'unknown');
}));
test('real process exit inside SQLite write transaction recovers without a phantom acknowledgement',()=>withContext(ctx=>{
 const source=syntheticHandover({authority:ctx.authority,run_id:'crash'});
 const input=join(ctx.base,'input.json');writeFileSync(input,JSON.stringify(source.events[0]));
 const script=`import {readFileSync} from 'node:fs';import {Recorder,localKey} from ${JSON.stringify(new URL('../packages/robot-black-box-recorder/src/index.mjs',import.meta.url).href)};const key=localKey(process.env.RBB_KEYDIR,'producer-local');const r=new Recorder({path:process.env.RBB_DB,key,run_id:'crash',fault:'exit_before_commit'});r.append(JSON.parse(readFileSync(process.env.RBB_INPUT,'utf8')));`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,RBB_KEYDIR:join(ctx.base,'producer-keys'),RBB_DB:join(ctx.base,'crash.sqlite'),RBB_INPUT:input},encoding:'utf8'});
 assert.equal(child.status,99);const r=new Recorder({path:join(ctx.base,'crash.sqlite'),key:ctx.producer,run_id:'crash'});assert.equal(r.list().length,0);assert.equal(r.append(source.events[0]).sequence,1);r.close();
}));
