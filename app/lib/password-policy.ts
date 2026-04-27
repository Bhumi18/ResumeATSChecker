export function getPasswordPolicyError(password: string): string | null {
  const value = String(password || '');

  if (value.length < 12) {
    return 'Password must be at least 12 characters long.';
  }

  if (value.length > 128) {
    return 'Password must be 128 characters or fewer.';
  }

  if (!/[a-z]/.test(value)) {
    return 'Password must include at least one lowercase letter.';
  }

  if (!/[A-Z]/.test(value)) {
    return 'Password must include at least one uppercase letter.';
  }

  if (!/[0-9]/.test(value)) {
    return 'Password must include at least one number.';
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'Password must include at least one special character.';
  }

  return null;
}
