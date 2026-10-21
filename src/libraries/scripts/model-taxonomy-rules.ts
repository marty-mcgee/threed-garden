/** Proposed functional taxonomy. Existing owner categories are never renamed/reparented. */
export const TAXONOMY_ROOT = 'ThreeDs';
type Rule = { path: string[]; pattern: RegExp; priority: number };
const rule = (branch: string, leaf: string, pattern: RegExp, priority = 50): Rule => ({ path: [TAXONOMY_ROOT, branch, leaf], pattern, priority });
export const MODEL_TAXONOMY_RULES: Rule[] = [
  rule('People', 'Character Attachments', /\b(chr attach|character attachment|bucket hat|cowboy hat)\b/, 100),
  rule('People', 'Characters', /\b(character|sk chr|farm boy|farmer|scarecrow)\b/, 90),
  rule('Architecture', 'Windows', /\b(window|windows|skylight)\b/, 80),
  rule('Architecture', 'Doors', /\b(door|doors|patio door)\b/, 75),
  rule('Architecture', 'Stairs and Railings', /\b(staircase|stair|stairs|railing|handrail|balustrade)\b/, 80),
  rule('Architecture', 'Fences and Gates', /\b(fence|gate|fencing)\b/, 80),
  rule('Architecture', 'Buildings', /\b(barn|farmhouse|farm house|cottage|garage|greenhouse|green house|outhouse|silo|water tower|shelter)\b/, 70),
  rule('Architecture', 'Building Parts', /\b(wall|roof|foundation|concrete base|column|pillar|beam|chimney)\b/, 50),
  rule('Architecture', 'Outdoor Structures', /\b(pergola|awning|gazebo|swimming pool|pool ladder)\b/, 75),
  rule('Furniture', 'Tables and Desks', /\b(table|desk|counter|workbench|work bench)\b/, 50),
  rule('Furniture', 'Seating', /\b(chair|armchair|arm chair|bench|sofa|couch|stool|seat)\b/, 50),
  rule('Furniture', 'Beds', /\b(bed|bunk bed|mattress|cot)\b/, 50),
  rule('Furniture', 'Storage', /\b(cabinet|cupboard|wardrobe|dresser|shelves|shelf|bookcase|sideboard|tv stand|tv center|wine rack|pinewood rack)\b/, 65),
  rule('Lighting', 'Lamps and Fixtures', /\b(lamp|chandelier|lantern|sconce|light fixture|street light)\b/, 80),
  rule('Appliances', 'Kitchen Appliances', /\b(stove|cooker|oven|microwave|fridge|refrigerator|dish washer|dishwasher|toaster|kitchenaid|coffee maker|kitchen scale|barbecue)\b/, 70),
  rule('Appliances', 'Laundry and Climate', /\b(washing machine|tumble dryer|dryer|boiler|radiator|air conditioner|fan)\b/, 70),
  rule('Plumbing', 'Bathroom Fixtures', /\b(bathtub|bath|washbasin|wash basin|toilet|bidet|shower|sink|urinal)\b/, 70),
  rule('Decor', 'Mirrors and Artwork', /\b(mirror|painting|picture|frame|artwork|poster)\b/, 50),
  rule('Decor', 'Textiles', /\b(cushion|pillow|curtain|rug|carpet|towel|tablecloth)\b/, 75),
  rule('Decor', 'Household Accessories', /\b(book|clock|vase|basket|bread box|chopping board|glass|cup|plate|coffee press|kettle|toast|calendar|kalender)\b/, 45),
  rule('Electronics', 'Computers and Displays', /\b(computer|laptop|monitor|television|tv|keyboard|mouse)\b/, 50),
  rule('Electronics', 'Audio Equipment', /\b(speaker|radio|amplifier|turntable|hifi|hi fi)\b/, 60),
  rule('Nature', 'Trees', /\b(tree|trees|palm|trunk|stump|log)\b/, 70),
  rule('Nature', 'Plants and Flowers', /\b(plant|plants|flower|flowers|tulip|yucca|bamboo|lily|lillypads|lily pads|reeds|grass|bush|shrub|fern|succulent)\b/, 50),
  rule('Nature', 'Rocks', /\b(rock|rocks|pebble|pebbles|boulder)\b/, 60),
  rule('Nature', 'Water', /\b(river|pond|puddle|waterfall|water fall|lake|stream|water plane)\b/, 65),
  rule('Nature', 'Terrain and Roads', /\b(road|path)\b/, 80),
  rule('Nature', 'Terrain and Roads', /\b(terrain|mountain|dirt|road|path|ground|cliff|hill)\b/, 45),
  rule('Farming', 'Crops and Produce', /\b(crop|wheat|corn|carrot|pumpkin|potato|tomato|cabbage|lettuce|produce|apple|orange|lemon|pear|plum|peach|cherry|apricot)\b/, 40),
  rule('Farming', 'Equipment and Supplies', /\b(wheelbarrow|hay|bale|plough|plow|sprinkler|watering can|seed bag|fertilizer|feed bag|trough)\b/, 65),
  rule('Tools', 'Hand Tools', /\b(shovel|spade|rake|hoe|pitchfork|hammer|saw|axe|pickaxe|wrench|screwdriver|ladder)\b/, 65),
  rule('Storage and Supplies', 'Containers', /\b(crate|barrel|bucket|pallet|sack|box|bin|container|tank|bottle)\b/, 40),
  rule('Animals', 'Animals', /\b(dog|bulldog|horse|cow|pig|sheep|goat|chicken|rooster|duck|cat|bird)\b/, 60),
  rule('Vehicles', 'Farm Vehicles', /\b(tractor|harvester|combine|farm trailer)\b/, 80),
  rule('Vehicles', 'Road Vehicles', /\b(car|truck|van|bus|motorcycle|motorbike|bike|bicycle|trailer)\b/, 50),
  rule('Sports and Recreation', 'Sports and Games', /\b(soccer|football|foot ball|ballon foot|pool table|pool cue|table football|chess|chessboard|abdominal bench|gym|treadmill|toy train)\b/, 85),
  rule('Sports and Recreation', 'Musical Instruments', /\b(piano|guitar|drums|drum|xylophone|violin|trumpet)\b/, 80),
];

export function normalizedModelWords(value: string) {
  return value.replace(/\.[a-z0-9]+$/i, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').replace(/[^a-z]+/gi, ' ').trim().toLowerCase();
}

export function suggestModelPath(model: { modelName: string; legacyAssetName?: string | null; primaryFileName?: string | null }) {
  const sources = [model.modelName, model.legacyAssetName, model.primaryFileName].filter((s): s is string => Boolean(s));
  // A separate FX/export helper is not a physical object even when its name includes a crop or shape.
  if (sources.some(s => /^(?:fx|vfx)\b/.test(normalizedModelWords(s)))) return { path: null, reason: 'FX/helper name needs manual review.' };
  const matches = MODEL_TAXONOMY_RULES.filter(rule => sources.some(source => rule.pattern.test(normalizedModelWords(source))));
  if (!matches.length) return { path: null, reason: 'No explicit name rule; manual classification required.' };
  const best = Math.max(...matches.map(rule => rule.priority));
  const winners = matches.filter(rule => rule.priority === best);
  if (winners.length !== 1) return { path: null, reason: 'Multiple equally ranked taxonomy matches; review required.' };
  return { path: winners[0].path, reason: `Name rule: ${winners[0].path.slice(1).join(' > ')}. Verify the asset before approval.` };
}
