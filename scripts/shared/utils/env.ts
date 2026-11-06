export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수가 없다: ${name}`);
  return value;
}
