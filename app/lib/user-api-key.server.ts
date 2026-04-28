import crypto from 'node:crypto';

const ENCRYPTION_KEY_ENV = 'USER_AI_API_KEY_ENCRYPTION_KEY';
const REQUIRED_KEY_BYTES = 32;

function parseEncryptionKey(rawValue: string): Buffer {
  const trimmed = rawValue.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  const base64Buffer = Buffer.from(trimmed, 'base64');
  if (base64Buffer.length === REQUIRED_KEY_BYTES) {
    return base64Buffer;
  }

  throw new Error(
    `${ENCRYPTION_KEY_ENV} must be 32 bytes (hex or base64).`
  );
}

function getEncryptionKey(): Buffer {
  const rawValue = process.env[ENCRYPTION_KEY_ENV];
  if (!rawValue) {
    throw new Error(`${ENCRYPTION_KEY_ENV} is not configured.`);
  }

  return parseEncryptionKey(rawValue);
}

export type EncryptedUserApiKey = {
  encrypted: string;
  iv: string;
  tag: string;
  last4: string;
};

export function encryptUserApiKey(apiKey: string): EncryptedUserApiKey {
  const normalizedKey = String(apiKey || '').trim();
  if (!normalizedKey) {
    throw new Error('API key is required.');
  }

  const encryptionKey = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(normalizedKey, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encryptedBuffer.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    last4: normalizedKey.slice(-4),
  };
}

export function decryptUserApiKey(payload: {
  encrypted: string;
  iv: string;
  tag: string;
}): string {
  const encryptionKey = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const encryptedBuffer = Buffer.from(payload.encrypted, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(tag);

  const decryptedBuffer = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ]);

  return decryptedBuffer.toString('utf8');
}
