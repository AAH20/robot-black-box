import {generateKeyPairSync} from 'node:crypto';
import {join,resolve} from 'node:path';
import {cpSync,mkdirSync,writeFileSync} from 'node:fs';
import {signed,digest,canonical} from '../../packages/robot-black-box-contract/src/index.mjs';
import {PUBLIC_PACKAGE_DIGEST,CUSTODY_SCOPE} from './local-custody.mjs';
export function custodyDemo(root){
 const key=id=>{const pair=generateKeyPairSync('ed25519');return {keyId:id,privateKey:pair.privateKey.export({type:'pkcs8',format:'pem'}),public_key:pair.publicKey.export({type:'spki',format:'pem'})};};
 const issuer=key('issuer-local-custody-grant'),custodian=key('custodian-local-separate'),enroll=k=>({public_key:k.public_key,tenants:['tenant-a'],purposes:['investigation_review'],revoked:false});mkdirSync(root,{recursive:true,mode:0o700});const packagePath=join(root,'assembly');cpSync(resolve('examples/robot-black-box-portable/executed/review-package'),packagePath,{recursive:true});const authorityKeys={[issuer.keyId]:enroll(issuer)},custodianKeys={[custodian.keyId]:enroll(custodian)},base={schema:'rbb.custody.grant.v1',issuer:issuer.keyId,acceptance_id:'acceptance-public-001',tenant:'tenant-a',purpose:'investigation_review',scope:CUSTODY_SCOPE,manifest_digest:PUBLIC_PACKAGE_DIGEST,not_before:new Date(Date.now()-60000).toISOString(),expires_at:new Date(Date.now()+3600000).toISOString()},grant=signed(base,issuer.keyId,issuer.privateKey,'CUSTODY-GRANT');
 const config={path:join(root,'custodian-store.sqlite'),key:{keyId:custodian.keyId,privateKey:custodian.privateKey},authorityKeys,custodianKeys},request={packagePath,manifestDigest:PUBLIC_PACKAGE_DIGEST,grant},reviewer={expectedCustodianFingerprint:digest(custodian.public_key),tenant:'tenant-a',purpose:'investigation_review',manifestDigest:PUBLIC_PACKAGE_DIGEST};return {root,issuer,custodian,base,config,request,reviewer,custodianKeys,grant};
}
export function workerConfig(path,config,operation,request){writeFileSync(path,canonical({...config,operation,request}),{mode:0o600});return path;}
