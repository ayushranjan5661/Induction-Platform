-- The built-in presenters use the ready-drawn characters (data only; appearance is JSON).
-- Presenters an admin already gave a character keep theirs.
UPDATE "Avatar" SET "appearance" = "appearance" || '{"character": "01-maya"}'::jsonb WHERE "name" = 'Maya' AND NOT ("appearance" ? 'character');
UPDATE "Avatar" SET "appearance" = "appearance" || '{"character": "02-arjun"}'::jsonb WHERE "name" = 'Rajamannar Abboy' AND NOT ("appearance" ? 'character');
UPDATE "Avatar" SET "appearance" = "appearance" || '{"character": "14-omar"}'::jsonb WHERE "name" = 'Ramki Ramakrishnen' AND NOT ("appearance" ? 'character');
UPDATE "Avatar" SET "appearance" = "appearance" || '{"character": "07-amara"}'::jsonb WHERE "name" = 'Zara' AND NOT ("appearance" ? 'character');
UPDATE "Avatar" SET "appearance" = "appearance" || '{"character": "12-noah"}'::jsonb WHERE "name" = 'Arjun' AND NOT ("appearance" ? 'character');
UPDATE "Avatar" SET "appearance" = "appearance" || '{"character": "11-priya"}'::jsonb WHERE "name" = 'Priya' AND NOT ("appearance" ? 'character');
UPDATE "Avatar" SET "appearance" = "appearance" || '{"character": "06-mateo"}'::jsonb WHERE "name" = 'Kabir' AND NOT ("appearance" ? 'character');
UPDATE "Avatar" SET "appearance" = "appearance" || '{"character": "13-yuki"}'::jsonb WHERE "name" = 'Anika' AND NOT ("appearance" ? 'character');
