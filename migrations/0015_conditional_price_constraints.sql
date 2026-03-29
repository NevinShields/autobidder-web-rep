ALTER TABLE "formulas"
ADD COLUMN "conditional_min_prices" jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "formulas"
ADD COLUMN "conditional_max_prices" jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "formula_templates"
ADD COLUMN "conditional_min_prices" jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "formula_templates"
ADD COLUMN "conditional_max_prices" jsonb NOT NULL DEFAULT '[]'::jsonb;
