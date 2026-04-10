-- Seed data for SilverTBProject
-- Can be run in Supabase SQL Editor after running schema.sql

INSERT INTO public.products (id, name, description, price, stock, category, images, is_best_seller, views, is_active)
VALUES
  (gen_random_uuid(), 'Dynastes hercules', 'The Hercules Beetle — the longest beetle in the world. Males can reach up to 17cm in total length. Native to the rainforests of Central and South America.', 8500, 3, 'Rhinoceros', '{}', true, 1240, true),
  (gen_random_uuid(), 'Chalcosoma atlas', 'Atlas Beetle — one of the largest beetles in the world, found in Southeast Asia. Males have three large horns used for combat.', 3200, 7, 'Rhinoceros', '{}', true, 890, true),
  (gen_random_uuid(), 'Dorcus titanus', 'Giant Stag Beetle from Southeast Asia. The impressive mandibles of the male can reach 1/3 of their body length.', 5600, 2, 'Stag', '{}', false, 567, true),
  (gen_random_uuid(), 'Goliathus goliatus', 'Goliath Beetle — one of the heaviest insects in the world by mass. Native to African tropical forests.', 12000, 1, 'Flower', '{}', true, 2100, true),
  (gen_random_uuid(), 'Mecynorrhina torquata', 'Elegant flower beetle from Central Africa with striking metallic coloration in green, red, and white.', 2800, 10, 'Flower', '{}', false, 430, true),
  (gen_random_uuid(), 'Xylotrupes gideon', 'Fighting Beetle popular across Southeast Asia. Hardy and great for beginners, easy to breed.', 900, 20, 'Rhinoceros', '{}', false, 750, true);
