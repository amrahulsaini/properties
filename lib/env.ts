import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  APP_SESSION_SECRET: z.string().min(16).default("change-this-session-secret"),
  APP_SESSION_COOKIE: z.string().default("propertiesuite_session"),
  DB_HOST: z.string().default(""),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default(""),
  DB_USER: z.string().default(""),
  DB_PASSWORD: z.string().default(""),
  DEFAULT_ADMIN_EMAIL: z
    .string()
    .email()
    .default("admin@samarthdevelopers.local"),
  DEFAULT_ADMIN_PASSWORD: z.string().default("Admin@12345"),
  FILE_STORAGE_DIR: z.string().default("uploads"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  SMTP_FROM: z.string().default(""),
  TWILIO_ACCOUNT_SID: z.string().default(""),
  TWILIO_AUTH_TOKEN: z.string().default(""),
  TWILIO_WHATSAPP_FROM: z.string().default(""),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}

export function isDatabaseConfigured() {
  const env = getEnv();
  return Boolean(env.DB_HOST && env.DB_NAME && env.DB_USER);
}

export function isEmailConfigured() {
  const env = getEnv();
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM);
}

export function isWhatsAppConfigured() {
  const env = getEnv();
  return Boolean(
    env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM,
  );
}
