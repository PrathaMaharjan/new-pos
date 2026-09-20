function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  jwtAccessSecret: () => required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: () => required("JWT_REFRESH_SECRET"),
  redisUrl: () => process.env.REDIS_URL ?? "redis://localhost:6379",
};