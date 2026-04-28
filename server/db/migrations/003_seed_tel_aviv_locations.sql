-- Seed canonical Tel Aviv beaches with per-net GPS coordinates.
-- Replaces any existing Tel Aviv location rows so this is safe to run on
-- a fresh DB or an existing one (old rows are removed first via CASCADE).

DELETE FROM locations WHERE city = 'Tel Aviv';

-- Mezitzim Beach (3 volleyball nets)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Mezitzim Beach', 'Tel Aviv', 32.0936100, 34.7710500)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order) SELECT id, 32.0936100, 34.7710500, 'volleyball', 0 FROM loc UNION ALL SELECT id, 32.0936700, 34.7708300, 'volleyball', 1 FROM loc UNION ALL SELECT id, 32.0937500, 34.7705900, 'volleyball', 2 FROM loc;

-- Hilton Beach (2 volleyball nets)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Hilton Beach', 'Tel Aviv', 32.0897000, 34.7698100)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order) SELECT id, 32.0897000, 34.7698100, 'volleyball', 0 FROM loc UNION ALL SELECT id, 32.0907000, 34.7699800, 'volleyball', 1 FROM loc;

-- Gordon Beach (10 volleyball nets + 3 teqball tables)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Gordon Beach', 'Tel Aviv', 32.0833300, 34.7679700)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order)
  SELECT id, 32.0833300, 34.7679700, 'volleyball',  0 FROM loc UNION ALL
  SELECT id, 32.0834100, 34.7676800, 'volleyball',  1 FROM loc UNION ALL
  SELECT id, 32.0835400, 34.7681400, 'volleyball',  2 FROM loc UNION ALL
  SELECT id, 32.0836800, 34.7678500, 'volleyball',  3 FROM loc UNION ALL
  SELECT id, 32.0836800, 34.7682700, 'volleyball',  4 FROM loc UNION ALL
  SELECT id, 32.0837400, 34.7680500, 'volleyball',  5 FROM loc UNION ALL
  SELECT id, 32.0837900, 34.7678600, 'volleyball',  6 FROM loc UNION ALL
  SELECT id, 32.0838800, 34.7683400, 'volleyball',  7 FROM loc UNION ALL
  SELECT id, 32.0839300, 34.7681800, 'volleyball',  8 FROM loc UNION ALL
  SELECT id, 32.0839800, 34.7680200, 'volleyball',  9 FROM loc UNION ALL
  SELECT id, 32.0836600, 34.7683000, 'teqball',    10 FROM loc UNION ALL
  SELECT id, 32.0840500, 34.7684400, 'teqball',    11 FROM loc UNION ALL
  SELECT id, 32.0841600, 34.7681900, 'teqball',    12 FROM loc;

-- Frischmann Beach (2 volleyball nets)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Frischmann Beach', 'Tel Aviv', 32.0815300, 34.7672000)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order) SELECT id, 32.0815300, 34.7672000, 'volleyball', 0 FROM loc UNION ALL SELECT id, 32.0816600, 34.7672100, 'volleyball', 1 FROM loc;

-- Bograshov Beach (4 volleyball nets + 4 teqball tables)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Bograshov Beach', 'Tel Aviv', 32.0783000, 34.7663800)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order)
  SELECT id, 32.0783000, 34.7663800, 'volleyball', 0 FROM loc UNION ALL
  SELECT id, 32.0783800, 34.7661600, 'volleyball', 1 FROM loc UNION ALL
  SELECT id, 32.0785800, 34.7663900, 'volleyball', 2 FROM loc UNION ALL
  SELECT id, 32.0786400, 34.7661500, 'volleyball', 3 FROM loc UNION ALL
  SELECT id, 32.0783900, 34.7664300, 'teqball',    4 FROM loc UNION ALL
  SELECT id, 32.0791100, 34.7665200, 'teqball',    5 FROM loc UNION ALL
  SELECT id, 32.0794700, 34.7666100, 'teqball',    6 FROM loc UNION ALL
  SELECT id, 32.0797300, 34.7667300, 'teqball',    7 FROM loc;

-- Trumpeldor Beach (1 volleyball net + 11 teqball tables)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Trumpeldor Beach', 'Tel Aviv', 32.0743600, 34.7648000)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order)
  SELECT id, 32.0743600, 34.7648000, 'volleyball',  0 FROM loc UNION ALL
  SELECT id, 32.0745600, 34.7650200, 'teqball',     1 FROM loc UNION ALL
  SELECT id, 32.0746400, 34.7649900, 'teqball',     2 FROM loc UNION ALL
  SELECT id, 32.0749100, 34.7647600, 'teqball',     3 FROM loc UNION ALL
  SELECT id, 32.0748800, 34.7649900, 'teqball',     4 FROM loc UNION ALL
  SELECT id, 32.0749800, 34.7650600, 'teqball',     5 FROM loc UNION ALL
  SELECT id, 32.0751200, 34.7651400, 'teqball',     6 FROM loc UNION ALL
  SELECT id, 32.0761600, 34.7656200, 'teqball',     7 FROM loc UNION ALL
  SELECT id, 32.0763500, 34.7655900, 'teqball',     8 FROM loc UNION ALL
  SELECT id, 32.0765000, 34.7655700, 'teqball',     9 FROM loc UNION ALL
  SELECT id, 32.0769600, 34.7656700, 'teqball',    10 FROM loc UNION ALL
  SELECT id, 32.0771300, 34.7657200, 'teqball',    11 FROM loc;

-- Jerusalem Beach / Geula (3 volleyball nets + 5 teqball tables)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Jerusalem Beach (Geula)', 'Tel Aviv', 32.0741500, 34.7647700)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order)
  SELECT id, 32.0741500, 34.7647700, 'volleyball', 0 FROM loc UNION ALL
  SELECT id, 32.0743600, 34.7648000, 'volleyball', 1 FROM loc UNION ALL
  SELECT id, 32.0714200, 34.7637300, 'volleyball', 2 FROM loc UNION ALL
  SELECT id, 32.0715700, 34.7640200, 'teqball',    3 FROM loc UNION ALL
  SELECT id, 32.0716900, 34.7639900, 'teqball',    4 FROM loc UNION ALL
  SELECT id, 32.0719600, 34.7639100, 'teqball',    5 FROM loc UNION ALL
  SELECT id, 32.0721000, 34.7640400, 'teqball',    6 FROM loc UNION ALL
  SELECT id, 32.0721300, 34.7638800, 'teqball',    7 FROM loc;

-- Aviv Beach (1 volleyball net)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Aviv Beach', 'Tel Aviv', 32.0698600, 34.7632200)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order) SELECT id, 32.0698600, 34.7632200, 'volleyball', 0 FROM loc;

-- Charles Clore Beach (2 volleyball nets)
WITH loc AS (
  INSERT INTO locations (name, city, lat, lng)
  VALUES ('Charles Clore Beach', 'Tel Aviv', 32.0686400, 34.7624700)
  RETURNING id
)
INSERT INTO location_nets (location_id, lat, lng, net_type, sort_order) SELECT id, 32.0686400, 34.7624700, 'volleyball', 0 FROM loc UNION ALL SELECT id, 32.0685000, 34.7625000, 'volleyball', 1 FROM loc;
