import { readFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const env = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  adminEmail: process.env.DEFAULT_ADMIN_EMAIL || "admin@samarthdevelopers.local",
  adminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345",
};

if (!env.host || !env.user || !env.database) {
  throw new Error("DB_HOST, DB_USER, and DB_NAME must be configured before db:setup.");
}

const connection = await mysql.createConnection({
  host: env.host,
  port: env.port,
  user: env.user,
  password: env.password,
  database: env.database,
  multipleStatements: true,
});

try {
  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const schema = await readFile(schemaPath, "utf8");
  await connection.query(schema);

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);

  await connection.execute(
    `INSERT INTO users (full_name, email, phone, role, password_hash, status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      full_name = VALUES(full_name),
      role = VALUES(role),
      password_hash = VALUES(password_hash),
      status = VALUES(status)`,
    [
      "System Admin",
      env.adminEmail,
      "+91 00000 00000",
      "admin",
      passwordHash,
      "active",
    ],
  );

  await connection.execute(
    `INSERT INTO branding_settings
      (id, company_name, app_name, gstin, location, theme_primary, theme_accent, invoice_header, support_email, support_phone, whatsapp_number, locale_default)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      company_name = VALUES(company_name),
      app_name = VALUES(app_name),
      gstin = VALUES(gstin),
      location = VALUES(location),
      theme_primary = VALUES(theme_primary),
      theme_accent = VALUES(theme_accent),
      invoice_header = VALUES(invoice_header),
      support_email = VALUES(support_email),
      support_phone = VALUES(support_phone),
      whatsapp_number = VALUES(whatsapp_number),
      locale_default = VALUES(locale_default)`,
    [
      "Samarth Developers Pro Pvt. Ltd.",
      "PropertySuite",
      "27DNJPK9124G1ZR",
      "Mahasul Colony, near PWD Quarters, Jat - 416404",
      "#111111",
      "#F26A1B",
      "SOMANING KOLI - Samarth Developers Pro Pvt. Ltd.",
      "office@samarthdevelopers.in",
      "+91 00000 00000",
      "+91 00000 00000",
      "en-IN",
    ],
  );

  const templates = [
    {
      title: "Festival Emotional",
      occasion: "Festival",
      channel: "whatsapp",
      style: "emotional",
      language: "mr-IN",
      subject: "Samarth Developers शुभेच्छा",
      body: "प्रिय [नाव], आपणास आणि आपल्या परिवारास हार्दिक शुभेच्छा. - Samarth Developers Pro Pvt. Ltd.",
    },
    {
      title: "Festival Professional",
      occasion: "Festival",
      channel: "whatsapp",
      style: "professional",
      language: "mr-IN",
      subject: "Season Greetings",
      body: "प्रिय [नाव], Samarth Developers Pro Pvt. Ltd. कडून सणाच्या हार्दिक शुभेच्छा.",
    },
    {
      title: "Festival Creative",
      occasion: "Festival",
      channel: "whatsapp",
      style: "creative",
      language: "mr-IN",
      subject: "Celebration Message",
      body: "नवीन संधी, नवीन प्रगती, नवीन शुभेच्छा. Samarth Developers Pro Pvt. Ltd. कडून प्रेमपूर्वक अभिवादन.",
    },
  ];

  for (const template of templates) {
    await connection.execute(
      `INSERT INTO message_templates
        (title, occasion, channel, style, language, subject_template, body_template, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
        occasion = VALUES(occasion),
        channel = VALUES(channel),
        style = VALUES(style),
        language = VALUES(language),
        subject_template = VALUES(subject_template),
        body_template = VALUES(body_template),
        is_active = VALUES(is_active)`,
      [
        template.title,
        template.occasion,
        template.channel,
        template.style,
        template.language,
        template.subject,
        template.body,
      ],
    );
  }

  console.log("Database schema applied.");
  console.log(`Admin email: ${env.adminEmail}`);
  console.log(`Admin password: ${env.adminPassword}`);
} finally {
  await connection.end();
}
