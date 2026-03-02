CREATE TABLE IF NOT EXISTS "site_config" (
  "id" serial PRIMARY KEY,
  "company_name" text NOT NULL DEFAULT '',
  "legal_name" text NOT NULL DEFAULT '',
  "cnpj" text NOT NULL DEFAULT '',
  "address_line1" text NOT NULL DEFAULT '',
  "city" text NOT NULL DEFAULT '',
  "state" text NOT NULL DEFAULT '',
  "cep" text NOT NULL DEFAULT '',
  "email" text NOT NULL DEFAULT '',
  "phone" text NOT NULL DEFAULT '',
  "whatsapp" text NOT NULL DEFAULT '',
  "instagram_url" text NOT NULL DEFAULT '',
  "facebook_url" text NOT NULL DEFAULT '',
  "maps_url" text NOT NULL DEFAULT '',
  "opening_hours_text" text NOT NULL DEFAULT '',
  "updated_at" timestamp DEFAULT now()
);
