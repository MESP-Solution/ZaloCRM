export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export function requireNumberEnv(name: string): number {
  const value = Number(requireEnv(name));

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return value;
}

export function requireBooleanEnv(name: string): boolean {
  const value = requireEnv(name).toLowerCase();

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`Environment variable ${name} must be true or false`);
}
