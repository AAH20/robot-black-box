import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,existsSync,unlinkSync,symlinkSync,linkSync,openSync,ftruncateSync,closeSync,cpSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {exportPortable} from './robot-black-box/portable-export.mjs';
import {inventory} from './robot-black-box/portable-review.mjs';
import {bootstrap} from './robot-black-box/portable-bootstrap.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const setup=()=>{const t=mkdtempSync(join(tmpdir(),'rbb-bootstrap-test-')),p=join(t,'package');exportPortable(p);return {t,p,pin:sha(readFileSync(join(p,'package-manifest.json')))};};
const rewrite=p=>{const file=join(p,'package-manifest.json'),m=JSON.parse(readFileSync(file));m.files=inventory(p);writeFileSync(file,JSON.stringify(m));};
test('trusted bootstrap works outside package in a fresh process and recovers from clean copy',()=>{const {t,p,pin}=setup();try{const detached=join(t,'detached');cpSync(p,detached,{recursive:true});rmSync(p,{recursive:true});const r=spawnSync(process.execPath,[resolve('scripts/robot-black-box/portable-bootstrap.mjs'),detached,pin],{cwd:tmpdir(),encoding:'utf8'});assert.equal(r.status,0,r.stderr);const report=JSON.parse(r.stdout);assert.equal(report.inventory_match,true);assert.equal(report.review.cases.length,6);assert.equal(report.external_custody,'unknown');const event=join(detached,'evidence/cases/declared_baseline/events.ndjson'),original=readFileSync(event);writeFileSync(event,'tampered');assert.equal(bootstrap(detached,pin).included_code_executed,false);writeFileSync(event,original);assert.equal(bootstrap(detached,pin).review.cryptographic_integrity,'valid');}finally{rmSync(t,{recursive:true,force:true});}});
for(const attack of ['coherent_tool_rewrite','coherent_evidence_rewrite','wrong_pin','absent_pin','missing','extra','symlink','hardlink','oversize','traversal'])test(`bootstrap rejects ${attack} before included sentinel code executes`,()=>{const {t,p,pin}=setup();try{const sentinel=join(t,'sentinel'),runner=join(p,'scripts/robot-black-box/portable-review.mjs');writeFileSync(runner,`import {writeFileSync} from 'node:fs';writeFileSync(${JSON.stringify(sentinel)},'executed');console.log('{}');`);let expected=pin;
if(attack==='coherent_tool_rewrite')rewrite(p);
if(attack==='coherent_evidence_rewrite'){writeFileSync(join(p,'evidence/cases/declared_baseline/events.ndjson'),'forged');rewrite(p);}
if(attack==='wrong_pin')expected='0'.repeat(64);if(attack==='absent_pin')expected=undefined;
// For structural attacks pin the sentinel-containing manifest to isolate intake from pin rejection.
if(['missing','extra','symlink','hardlink','oversize','traversal'].includes(attack)){rewrite(p);expected=sha(readFileSync(join(p,'package-manifest.json')));const e=join(p,'README.md');if(attack==='missing')unlinkSync(e);if(attack==='extra')writeFileSync(join(p,'unexpected.json'),'{}');if(attack==='symlink'){unlinkSync(e);symlinkSync('/etc/passwd',e);}if(attack==='hardlink'){unlinkSync(e);linkSync(runner,e);}if(attack==='oversize'){const fd=openSync(e,'w');ftruncateSync(fd,16*1024*1024+1);closeSync(fd);}if(attack==='traversal'){const file=join(p,'package-manifest.json'),m=JSON.parse(readFileSync(file));m.files[0].path='../outside';writeFileSync(file,JSON.stringify(m));expected=sha(readFileSync(file));}}
const result=bootstrap(p,expected);assert.equal(result.status,'rejected');assert.equal(result.included_code_executed,false);assert.equal(existsSync(sentinel),false);if(attack.startsWith('coherent'))assert.ok(result.errors.includes('EXTERNAL_PIN_MISMATCH'));}finally{rmSync(t,{recursive:true,force:true});}});
