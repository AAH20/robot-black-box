import {validate,SCHEMA} from './index.mjs';
// Vendor-neutral intake boundaries. The caller supplies receipts, never SDK credentials or sensor bytes.
// Status is part of signed evidence, not inferred from vendor branding.
export function adaptVlaReceipt(receipt){return structuredClone(validate(receipt,SCHEMA.properties.model,'$.model'));}
export function adaptTwinReceipt(receipt){return structuredClone(validate(receipt,SCHEMA.properties.twins.items,'$.twins[]'));}
export function adaptBiometricDeclaration(receipt){return structuredClone(validate(receipt,SCHEMA.properties.biometric,'$.biometric'));}
export function adaptContextSnapshot(receipt){return structuredClone(validate(receipt,SCHEMA.properties.sources.items,'$.sources[]'));}
export function adaptWorkflowReceipt(receipt){return structuredClone(validate(receipt,SCHEMA.properties.workflow,'$.workflow'));}
