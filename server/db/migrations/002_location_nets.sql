-- Add location_nets table to store individual net/table coordinates per beach
-- net_type: 'volleyball' = beach volleyball / footvolley court, 'teqball' = teqball table

CREATE TABLE IF NOT EXISTS location_nets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(10,7) NOT NULL,
  net_type    VARCHAR(20) NOT NULL DEFAULT 'volleyball'
                CHECK (net_type IN ('volleyball', 'teqball')),
  label       VARCHAR(100),
  sort_order  SMALLINT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_nets_location ON location_nets(location_id);
