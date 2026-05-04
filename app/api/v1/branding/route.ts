import { NextResponse } from "next/server";
import { defaultBranding } from "@/lib/brand";
import { execute, queryRows } from "@/lib/db";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { ResourceError } from "@/lib/resources";

interface BrandingRow {
  id: number;
  company_name: string;
  app_name: string;
  gstin: string;
  location: string;
  logo_url: string | null;
  theme_primary: string;
  theme_accent: string;
  invoice_header: string;
  digital_signature_url: string | null;
  support_email: string | null;
  support_phone: string | null;
  whatsapp_number: string | null;
  locale_default: string;
}

async function getBranding() {
  const rows = await queryRows<BrandingRow>(
    "SELECT * FROM branding_settings WHERE id = 1 LIMIT 1",
  );

  return (
    rows[0] ?? {
      id: 1,
      company_name: defaultBranding.companyName,
      app_name: defaultBranding.appName,
      gstin: defaultBranding.gstin,
      location: defaultBranding.location,
      logo_url: null,
      theme_primary: defaultBranding.themePrimary,
      theme_accent: defaultBranding.themeAccent,
      invoice_header: defaultBranding.invoiceHeader,
      digital_signature_url: null,
      support_email: defaultBranding.supportEmail,
      support_phone: defaultBranding.supportPhone,
      whatsapp_number: defaultBranding.whatsappNumber,
      locale_default: "en-IN",
    }
  );
}

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    return NextResponse.json({ data: await getBranding() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    if (session.role !== "admin") {
      throw new ResourceError("Only admins can change branding.", 403);
    }

    const body = (await request.json()) as BrandingRow;

    await execute(
      `INSERT INTO branding_settings
        (id, company_name, app_name, gstin, location, logo_url, theme_primary, theme_accent, invoice_header, digital_signature_url, support_email, support_phone, whatsapp_number, locale_default)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        app_name = VALUES(app_name),
        gstin = VALUES(gstin),
        location = VALUES(location),
        logo_url = VALUES(logo_url),
        theme_primary = VALUES(theme_primary),
        theme_accent = VALUES(theme_accent),
        invoice_header = VALUES(invoice_header),
        digital_signature_url = VALUES(digital_signature_url),
        support_email = VALUES(support_email),
        support_phone = VALUES(support_phone),
        whatsapp_number = VALUES(whatsapp_number),
        locale_default = VALUES(locale_default)`,
      [
        body.company_name,
        body.app_name,
        body.gstin,
        body.location,
        body.logo_url,
        body.theme_primary,
        body.theme_accent,
        body.invoice_header,
        body.digital_signature_url,
        body.support_email,
        body.support_phone,
        body.whatsapp_number,
        body.locale_default,
      ],
    );

    return NextResponse.json({ data: await getBranding() });
  } catch (error) {
    return handleRouteError(error);
  }
}
