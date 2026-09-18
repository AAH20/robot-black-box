// Trusted reviewer-side tool. Built-in imports only; never import package modules here.
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,lstatSync,openSync,closeSync,fstatSync,constants,realpathSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const safePath=p=>typeof p==='string'&&/^([A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+$/.test(p)&&!p.split('/').some(x=>x==='.'||x==='..');
export function boundedRead(path){const s=lstatSync(path);if(s.isSymbolicLink()||!s.isFile()||s.nlink!==1)throw Error('UNSAFE_FILE');if(s.size>16*1024*1024)throw Error('INTAKE_LIMIT');const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const f=fstatSync(fd);if(f.ino!==s.ino||f.dev!==s.dev||f.size!==s.size||f.nlink!==1)throw Error('FILE_CHANGED');const b=readFileSync(fd);if(b.length!==s.size)throw Error('FILE_CHANGED');return b;}finally{closeSync(fd);}}
export function checkedPackage(root,expectedDigest){
  if(typeof expectedDigest!=='string'||! /^[a-f0-9]{64}$/.test(expectedDigest))throw Error('EXTERNAL_PIN_REQUIRED');
  if(lstatSync(root).isSymbolicLink()||!lstatSync(root).isDirectory())throw Error('UNSAFE_ROOT');root=realpathSync(root);
  const manifestBytes=boundedRead(join(root,'package-manifest.json'));if(sha(manifestBytes)!==expectedDigest)throw Error('EXTERNAL_PIN_MISMATCH');
  const manifest=JSON.parse(manifestBytes);if(manifest.schema!=='rbb.portable.package.v1'||!Array.isArray(manifest.files)||manifest.files.length>512)throw Error('MANIFEST_INVALID');
  const expected=new Map();for(const f of manifest.files){if(!safePath(f.path)||f.path==='package-manifest.json'||expected.has(f.path)||!Number.isSafeInteger(f.bytes)||f.bytes<0||f.bytes>16*1024*1024||! /^[a-f0-9]{64}$/.test(f.sha256))throw Error('MANIFEST_INVALID');expected.set(f.path,f);}
  const bytes=new Map();let total=0,entries=0,files=0;
  const walk=(dir,prefix='')=>{for(const name of readdirSync(dir).sort()){if(++entries>1024||prefix.split('/').length>16)throw Error('INTAKE_LIMIT');const relative=prefix+name;if(!safePath(relative))throw Error('UNSAFE_PATH');const path=join(dir,name),s=lstatSync(path);if(s.isSymbolicLink())throw Error('UNSAFE_LINK');if(s.isDirectory())walk(path,relative+'/');else{if(++files>513||(total+=s.size)>32*1024*1024)throw Error('INTAKE_LIMIT');const b=boundedRead(path);if(relative==='package-manifest.json'){if(!b.equals(manifestBytes))throw Error('MANIFEST_CHANGED');continue;}const f=expected.get(relative);if(!f||f.bytes!==b.length||f.sha256!==sha(b))throw Error('PACKAGE_INVENTORY_MISMATCH');bytes.set(relative,b);}}};walk(root);
  if(bytes.size!==expected.size)throw Error('PACKAGE_INVENTORY_MISMATCH');
  const runner='scripts/robot-black-box/portable-review.mjs';if(!bytes.has(runner))throw Error('RUNNER_MISSING');return {bytes,manifestBytes};
}
export function bootstrap(root,expectedDigest){
 const result={schema:'rbb.portable.bootstrap.v1',pin_match:false,inventory_match:false,included_code_executed:false,pin_origin:'reviewer_supplied_origin_not_attested',publisher_identity:'unknown',external_custody:'unknown',online_freshness:'unknown',errors:[]};let snapshot;
 try{
  const {bytes,manifestBytes}=checkedPackage(root,expectedDigest);result.pin_match=true;result.inventory_match=true;const runner='scripts/robot-black-box/portable-review.mjs';
  // Execute a private snapshot of the checked bytes, never reopen mutable input for imports.
  snapshot=mkdtempSync(join(tmpdir(),'rbb-pinned-review-'));for(const [path,b] of bytes){const dest=join(snapshot,path);mkdirSync(dirname(dest),{recursive:true,mode:0o700});writeFileSync(dest,b,{mode:0o600,flag:'wx'});}writeFileSync(join(snapshot,'package-manifest.json'),manifestBytes,{mode:0o600,flag:'wx'});
  const env={...process.env};delete env.NODE_OPTIONS;delete env.NODE_PATH;
  const execution=spawnSync(process.execPath,[join(snapshot,runner),snapshot],{cwd:snapshot,env,encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});result.included_code_executed=Boolean(execution.pid);result.review_pid=execution.pid??null;if(execution.status!==0)throw Error('PINNED_REVIEW_FAILED');result.review=JSON.parse(execution.stdout);result.status='verified_bytes_against_reviewer_pin';
 }catch(e){result.status='rejected';result.errors.push(e.message);}finally{if(snapshot)rmSync(snapshot,{recursive:true,force:true});}return result;
}
if(process.argv[1]&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){const result=bootstrap(resolve(process.argv[2]??'.'),process.argv[3]);console.log(JSON.stringify(result));process.exitCode=result.errors.length?2:0;}
