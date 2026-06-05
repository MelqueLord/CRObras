-- Migration: Add Materiais and RecentObras tables
-- Created: 2026-06-05

-- First verify obras table exists
-- If this fails, you need to apply the initial migrations first

-- Create materiais table
CREATE TABLE IF NOT EXISTS "materiais" (
    "Id" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "Nome" character varying(300) NOT NULL,
    "Quantidade" numeric(18,4) NOT NULL,
    "PrecoUnitario" numeric(18,2) NOT NULL,
    CONSTRAINT "PK_materiais" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_materiais_obras_ObraId" FOREIGN KEY ("ObraId") REFERENCES "obras"("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_materiais_ObraId" ON "materiais"("ObraId");

-- Create recent_obras table
CREATE TABLE IF NOT EXISTS "recent_obras" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "ObraId" uuid NOT NULL,
    "CriadoEm" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_recent_obras" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_recent_obras_UserId_CriadoEm" ON "recent_obras"("UserId", "CriadoEm");

-- Record migration in __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260605120000_AddMateriaisRecentObras', '8.0.6')
ON CONFLICT DO NOTHING;
