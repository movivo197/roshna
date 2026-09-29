import {z} from 'zod';
export const VAULT_MAX_BYTES=1_000_000;
const base64=z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/);
export const vaultEnvelopeSchema=z.object({
  version:z.literal(1),cipher:z.literal('AES-GCM'),kdf:z.literal('PBKDF2-SHA256'),iterations:z.literal(600000),
  salt:base64.length(24),iv:base64.length(16),ciphertext:base64.min(24).max(1_340_000),
}).strict();
export type VaultEnvelope=z.infer<typeof vaultEnvelopeSchema>;
