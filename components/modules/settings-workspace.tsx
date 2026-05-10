"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface BrandingState {
  company_name: string;
  app_name: string;
  gstin: string;
  location: string;
  logo_url: string;
  theme_primary: string;
  theme_accent: string;
  invoice_header: string;
  digital_signature_url: string;
  support_email: string;
  support_phone: string;
  whatsapp_number: string;
  locale_default: string;
}

const defaultState: BrandingState = {
  company_name: "",
  app_name: "",
  gstin: "",
  location: "",
  logo_url: "",
  theme_primary: "#111111",
  theme_accent: "#F26A1B",
  invoice_header: "",
  digital_signature_url: "",
  support_email: "",
  support_phone: "",
  whatsapp_number: "",
  locale_default: "en-IN",
};

export function SettingsWorkspace() {
  const [branding, setBranding] = useState<BrandingState>(defaultState);
  const [message, setMessage] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const response = await fetch("/api/v1/branding");
      const payload = await response.json();
      if (response.ok && active) {
        setBranding(payload.data);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/v1/branding", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(branding),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Branding saved." : payload.error ?? "Save failed.");
  }

  async function handleFileUpload(file: File, key: string) {
    setUploadingField(key);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      if (response.ok && result.url) {
        setBranding((current) => ({
          ...current,
          [key]: result.url,
        }));
      } else {
        setMessage(result.error || "Failed to upload image");
      }
    } catch (err) {
      setMessage("An error occurred during upload.");
    } finally {
      setUploadingField(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
          Brand control
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">
          Settings & branding
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
          Store the company identity that appears on dashboards, receipts, agreements, emails, and mobile clients.
        </p>
      </Card>

      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
          {Object.entries(branding).map(([key, value]) => (
            <label
              className={key === "location" || key === "invoice_header" ? "md:col-span-2" : ""}
              key={key}
            >
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                {key.replace(/_/g, " ")}
              </span>
              {key.endsWith("_url") ? (
                <div className="relative w-full rounded-2xl border border-dashed border-gray-400 bg-gray-50/50 hover:bg-gray-50 transition p-4">
                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    {branding[key as keyof BrandingState] ? (
                      <div className="relative h-16 w-32 overflow-hidden mx-auto bg-white rounded-md border border-line group">
                        <img 
                          src={String(branding[key as keyof BrandingState])} 
                          alt="preview" 
                          className="w-full h-full object-contain" 
                        />
                        <button
                          type="button"
                          className="absolute inset-0 bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center text-xs font-bold"
                          onClick={() => setBranding(cur => ({ ...cur, [key]: "" }))}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {uploadingField === key ? (
                          <span className="animate-pulse">Uploading...</span>
                        ) : (
                          <>
                            <span className="font-semibold text-accent block mb-1">Click or Drag & Drop</span>
                            <span className="text-xs">PNG, JPG up to 5MB</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], key);
                      }
                    }}
                  />
                </div>
              ) : key === "location" || key === "invoice_header" ? (
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-line bg-white px-4 py-3"
                  onChange={(event) =>
                    setBranding((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  value={String(value)}
                />
              ) : (
                <input
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3"
                  onChange={(event) =>
                    setBranding((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  type="text"
                  value={String(value)}
                />
              )}
            </label>
          ))}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-accent px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white"
              type="submit"
            >
              Save settings
            </button>
          </div>

          {message ? (
            <div className="md:col-span-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-muted">
              {message}
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
