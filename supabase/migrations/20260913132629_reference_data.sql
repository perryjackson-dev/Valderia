-- Reference data: alpha scope only (see build prompt "Alpha Feature List").
-- Costs/times are placeholder balance values, easy to retune later since
-- they live in data, not code.

insert into public.buildings
  (type, display_name, category, max_level, base_cost, cost_multiplier, base_build_seconds, build_seconds_multiplier, effect)
values
  ('castle', 'Castle', 'city', 20,
    '{"food":0,"wood":0,"stone":0,"ore":0,"gold":0}', 1.6, 60, 1.45, '{}'),
  ('walls', 'Walls', 'city', 20,
    '{"food":0,"wood":100,"stone":150,"ore":50,"gold":0}', 1.6, 90, 1.45,
    '{"defense_per_level":50}'),
  ('alchemy_lab', 'Alchemy Lab', 'city', 20,
    '{"food":0,"wood":150,"stone":100,"ore":50,"gold":0}', 1.6, 120, 1.45, '{}'),
  ('storehouse', 'Storehouse', 'city', 20,
    '{"food":0,"wood":120,"stone":80,"ore":40,"gold":0}', 1.55, 90, 1.4,
    '{"capacity_base":1000,"capacity_per_level":500}'),
  ('barracks', 'Barracks', 'city', 20,
    '{"food":0,"wood":100,"stone":60,"ore":40,"gold":0}', 1.55, 90, 1.4,
    '{"train_speed_bonus_per_level":0.02}'),
  ('farm', 'Farm', 'field', 20,
    '{"food":0,"wood":60,"stone":30,"ore":0,"gold":0}', 1.5, 45, 1.35,
    '{"produces":"food","base_rate":10,"rate_per_level":8}'),
  ('sawmill', 'Sawmill', 'field', 20,
    '{"food":0,"wood":40,"stone":40,"ore":0,"gold":0}', 1.5, 45, 1.35,
    '{"produces":"wood","base_rate":10,"rate_per_level":8}'),
  ('quarry', 'Quarry', 'field', 20,
    '{"food":0,"wood":50,"stone":30,"ore":0,"gold":0}', 1.5, 45, 1.35,
    '{"produces":"stone","base_rate":8,"rate_per_level":6}'),
  ('mine', 'Mine', 'field', 20,
    '{"food":0,"wood":60,"stone":50,"ore":0,"gold":0}', 1.5, 45, 1.35,
    '{"produces":"ore","base_rate":6,"rate_per_level":5}');

insert into public.troop_types
  (type, display_name, tier, class, attack, life, speed, load, train_seconds, train_cost, requires_building, requires_building_level)
values
  ('militiaman', 'Militiaman', 1, 'ground', 12, 40, 8, 10, 45,
    '{"food":20,"wood":10,"stone":0,"ore":0,"gold":0}', 'barracks', 1),
  ('archer', 'Archer', 1, 'ground', 18, 25, 8, 8, 60,
    '{"food":15,"wood":25,"stone":0,"ore":0,"gold":0}', 'barracks', 1),
  ('light_cavalry', 'Light Cavalry', 1, 'cavalry', 22, 35, 16, 12, 90,
    '{"food":25,"wood":10,"stone":0,"ore":15,"gold":0}', 'barracks', 1),
  ('supply_troop', 'Supply Troop', 1, 'supply', 2, 20, 10, 60, 60,
    '{"food":15,"wood":15,"stone":0,"ore":0,"gold":0}', 'barracks', 1);
