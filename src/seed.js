// Seed data for the preview. Everything is generated relative to "now" so the
// demo always looks alive. All maisons other than Moth to a Flame are fictional.

const DAY = 86400000;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

const DEFAULT_KNOWLEDGE = (shop) => [
  { q: 'How long does delivery take? shipping times', a: shop.policies.shipping },
  { q: 'What is your return policy? refunds exchanges', a: shop.policies.returns },
  { q: 'Do you offer gift wrapping or gift notes?', a: shop.policies.gifting },
  { q: 'What wax do you use? ingredients vegan clean', a: `Every ${shop.name} candle is poured by hand in small batches using ${shop.wax}. No paraffin, no phthalates, and wicks are lead-free cotton or wood.` },
  { q: 'How should I care for my candle? first burn tunnelling wick trim', a: 'On the first burn, let the wax melt edge to edge — usually two to three hours. Trim the wick to 5 mm before each lighting and never burn longer than four hours at a time.' },
];

const SHOPS = [
  {
    id: 'shop_mtaf', slug: 'moth-to-a-flame', name: 'Moth to a Flame', ownerId: 'u_house',
    tagline: 'Luxury Candle Co.', location: 'Fort Lauderdale, Florida', founded: 2025,
    story: 'The founding house of the Palace. Affirmation-led candles poured in matte black and gold, made for the quiet rituals that bring you back to yourself.',
    theme: 'obsidian', accent: '#c9a35c', heroStyle: 'centered', font: 'classic', monogram: 'M', featured: true, flagship: true,
    wax: 'a coconut–soy blend with fine fragrance oils', banner: ['#1a1410', '#0b0a09'], heroImage: 'assets/img/signature-jars.jpg',
    desk: { name: 'Lumière', tone: 'poetic' },
  },
  {
    id: 'shop_soleil', slug: 'soleil-noir', name: 'Maison Soleil Noir', ownerId: 'u_vendor',
    tagline: 'Smoke, resin and slow evenings', location: 'Savannah, Georgia', founded: 2021,
    story: 'Isolde Marchetti pours resinous, smoke-laced candles in a converted carriage house. Each batch rests for fourteen days before it leaves the atelier.',
    theme: 'espresso', accent: '#c98f5c', heroStyle: 'split', font: 'classic', monogram: 'S', featured: true,
    wax: 'coconut–apricot wax and resin absolutes', banner: ['#3a2416', '#140c08'],
    desk: { name: 'Noor', tone: 'warm' },
  },
  {
    id: 'shop_blanche', slug: 'atelier-blanche', name: 'Atelier Blanche', ownerId: 'u_v3',
    tagline: 'White florals, poured in porcelain', location: 'Charleston, South Carolina', founded: 2019,
    story: 'A two-woman atelier devoted to white flowers — tuberose, gardenia, orange blossom — set in hand-thrown porcelain vessels made a few streets away.',
    theme: 'ivory', accent: '#a8823c', heroStyle: 'editorial', font: 'couture', monogram: 'B', featured: true,
    wax: 'rapeseed and coconut wax with natural absolutes', banner: ['#f4ecdf', '#e2d5c0'],
    desk: { name: 'Odette', tone: 'formal' },
  },
  {
    id: 'shop_ember', slug: 'ember-and-oud', name: 'Ember & Oud', ownerId: 'u_v4',
    tagline: 'Rare woods, patiently aged', location: 'Santa Fe, New Mexico', founded: 2020,
    story: 'Built around a private reserve of aged oud and palo santo. Limited pours, numbered by hand, never restocked the same way twice.',
    theme: 'midnight', accent: '#b9a27a', heroStyle: 'centered', font: 'modern', monogram: 'E', featured: false,
    wax: 'pure coconut wax and aged wood oils', banner: ['#1b2233', '#0a0d14'],
    desk: { name: 'Sable', tone: 'formal' },
  },
  {
    id: 'shop_reverie', slug: 'wick-and-reverie', name: 'Wick & Reverie', ownerId: 'u_v5',
    tagline: 'Soft gourmands for unhurried mornings', location: 'Asheville, North Carolina', founded: 2022,
    story: 'Candles that smell like the best part of a slow morning: warm milk, toasted sugar, a window left open. Poured in rose-tinted glass.',
    theme: 'blush', accent: '#b0785f', heroStyle: 'split', font: 'couture', monogram: 'W', featured: true,
    wax: 'soy–coconut wax and gourmand accords', banner: ['#f1d6d0', '#dcb4ab'],
    desk: { name: 'Clémence', tone: 'warm' },
  },
  {
    id: 'shop_salt', slug: 'saltwater-chandlery', name: 'Saltwater Chandlery', ownerId: 'u_v6',
    tagline: 'Sea air, driftwood, green things', location: 'Camden, Maine', founded: 2018,
    story: 'A harbour-side chandlery working with sea salt, juniper and wild herbs gathered along the Maine coast.',
    theme: 'sage', accent: '#7d7446', heroStyle: 'editorial', font: 'classic', monogram: 'C', featured: false,
    wax: 'beeswax and coconut wax with coastal botanicals', banner: ['#d5dac8', '#b4bca2'],
    desk: { name: 'Wren', tone: 'warm' },
  },
];

// [shopId, name, collection, category, price$, stock, top, heart, base, burnHrs, oz, vessel, extra]
const V = {
  black: { shape: 'tumbler', body: '#15120f', rim: '#c9a35c', wax: '#efe3c8', label: 'none', ink: '#c9a35c' },
  blackGold: { shape: 'tumbler', body: '#15120f', rim: '#c9a35c', wax: '#efe3c8', label: 'none', ink: '#c9a35c', inner: '#c9a35c' },
  amber: { shape: 'jar', body: '#6b2f12', rim: '#0f0d0b', wax: '#f0dcb0', label: '#12100e', ink: '#c9a35c' },
  smoke: { shape: 'tumbler', body: '#3a2a20', rim: '#c98f5c', wax: '#e9d6b6', label: 'none', ink: '#e0b48a' },
  porcelain: { shape: 'coupe', body: '#f7f1e6', rim: '#c9a35c', wax: '#fffaf0', label: 'none', ink: '#a8823c' },
  night: { shape: 'tumbler', body: '#141a28', rim: '#b9a27a', wax: '#e8e2d2', label: 'none', ink: '#cdbb96' },
  tin: { shape: 'tin', body: '#1a1f2c', rim: '#b9a27a', wax: '#e8e2d2', label: 'none', ink: '#cdbb96' },
  rose: { shape: 'jar', body: '#e7b9ae', rim: '#b0785f', wax: '#fff3ea', label: '#fbeeea', ink: '#8c5a45' },
  clear: { shape: 'tumbler', body: '#efe6d6', rim: '#d8ccb6', wax: '#fff8ea', label: '#fbf7f0', ink: '#a8823c', glass: true },
  seaglass: { shape: 'jar', body: '#9fb0a0', rim: '#5c6650', wax: '#f5f1e2', label: '#eef0e7', ink: '#4f5a3f' },
  pillar: { shape: 'pillar', body: '#efe6d2', rim: '#efe6d2', wax: '#efe6d2', label: 'none', ink: '#7d7446' },
};

const PRODUCTS = [
  // Moth to a Flame — flagship, uses the house photography
  ['shop_mtaf', 'Signature Amber Jar', 'Signature', 'Signature', 68, 42, 'Bergamot, saffron', 'Amber resin, jasmine', 'Vanilla, cedar', 60, 14, V.amber, { image: 'assets/img/signature-jars.jpg', tags: ['bestseller'], desc: 'The candle that began the house. Amber glass, a matte black label and a slow, golden burn that fills a room without raising its voice.' }],
  ['shop_mtaf', 'Morning Renewal', 'The Sanctuary Collection', 'Fresh & Coastal', 74, 30, 'Neroli, white tea', 'Green fig, mint leaf', 'Pale musk', 55, 10, V.blackGold, { tags: ['new'], desc: 'A breath of light, clarity and quiet strength. It whispers, “Today is new, and so are you.”' }],
  ['shop_mtaf', 'Evening Sanctuary', 'The Sanctuary Collection', 'Woody & Resin', 74, 28, 'Black plum', 'Lavender absolute, incense', 'Sandalwood, tonka', 55, 10, V.blackGold, { desc: 'A cocoon of peace, intimacy and restoration. As night falls it softens the noise of the day — a reminder that rest is not retreat.' }],
  ['shop_mtaf', 'The Sanctuary Duo', 'The Sanctuary Collection', 'Gift Sets', 138, 16, 'Neroli, black plum', 'Fig, lavender', 'Musk, sandalwood', 110, 20, V.blackGold, { image: 'assets/img/sanctuary-card.jpg', tags: ['gift'], desc: 'Morning Renewal and Evening Sanctuary together — your morning awakening and evening exhale, captured in light.' }],
  ['shop_mtaf', 'Flame Society · Season IV · Harvest & Harmony', 'The Flame Society', 'Gift Sets', 165, 12, 'Spiced pear, clove', 'Pumpkin blossom, amber', 'Oakmoss, smoked vanilla', 120, 22, V.blackGold, { image: 'assets/img/society-season-iv.jpg', tags: ['limited'], desc: 'The seasonal Society box: two gold-lined candles on copper satin with the season’s affirmation card — “My abundance flows as steadily as my flame.”' }],
  ['shop_mtaf', 'Flame Society · Season III · Sands of Desire', 'The Flame Society', 'Gift Sets', 165, 6, 'Pink pepper, mandarin', 'Desert rose, saffron', 'Warm sand accord, oud', 120, 22, V.black, { image: 'assets/img/society-season-iii.jpg', tags: ['limited'], desc: 'Two candles on champagne satin. Affirmation: “I embody light that cannot be contained.”' }],
  ['shop_mtaf', 'Flame Society · Season II · Tide & Bloom', 'The Flame Society', 'Gift Sets', 165, 9, 'Sea salt, pear blossom', 'Peony, water lily', 'Driftwood, white musk', 120, 22, V.porcelain, { image: 'assets/img/society-season-ii.jpg', desc: 'The ivory edition. Affirmation: “I bloom in divine timing.”' }],
  ['shop_mtaf', 'Quarterly Subscription', 'The Flame Society', 'Subscriptions', 120, 99, 'Changes each season', 'Chosen by the house', 'Always hand-poured', 100, 20, V.clear, { image: 'assets/img/quarterly-subscription.jpg', tags: ['subscription'], desc: 'Two candles, four times a year. Each season arrives with its own scent story and affirmation, before it is offered anywhere else.' }],

  // Maison Soleil Noir — the demo vendor
  ['shop_soleil', 'Carriage House Smoke', 'The Hearth', 'Woody & Resin', 82, 24, 'Birch tar, black pepper', 'Labdanum, leather', 'Guaiac wood, ash', 65, 11, V.smoke, { tags: ['bestseller'], desc: 'The scent of the atelier itself — a cold hearth, old leather and the last curl of woodsmoke.' }],
  ['shop_soleil', 'Myrrh & Black Honey', 'The Hearth', 'Woody & Resin', 88, 18, 'Bitter orange', 'Myrrh, beeswax absolute', 'Black honey, benzoin', 65, 11, V.smoke, { desc: 'Thick, golden and a little dangerous. Rests fourteen days before release.' }],
  ['shop_soleil', 'Frankincense at Dusk', 'The Hearth', 'Woody & Resin', 84, 5, 'Elemi, pink pepper', 'Frankincense, iris', 'Cedar, soft amber', 65, 11, V.smoke, { tags: ['low'], desc: 'Cathedral air at closing time. Cool resin over warm wood.' }],
  ['shop_soleil', 'Tobacco Flower', 'Midnight Garden', 'Floral', 79, 21, 'Clary sage', 'Tobacco blossom, hay', 'Tonka, vetiver', 60, 10, V.smoke, { tags: ['new'], desc: 'A night-blooming floral with a dry, golden warmth underneath.' }],
  ['shop_soleil', 'The Hearth Trio', 'The Hearth', 'Gift Sets', 210, 8, 'Birch, orange, elemi', 'Labdanum, myrrh, frankincense', 'Guaiac, honey, cedar', 150, 24, V.smoke, { tags: ['gift'], desc: 'Three travel pours from The Hearth in a linen-lined box.' }],
  ['shop_soleil', 'Votive Study No. 4', 'Atelier Studies', 'Signature', 46, 0, 'Smoked tea', 'Violet leaf', 'Papyrus', 25, 4, V.smoke, { desc: 'An experimental small pour. Returns when the next batch has rested.' }],

  // Atelier Blanche
  ['shop_blanche', 'Tubéreuse Blanche', 'Les Fleurs', 'Floral', 96, 20, 'Green stem, pear', 'Tuberose absolute, ylang', 'Creamy sandalwood', 70, 12, V.porcelain, { tags: ['bestseller'], desc: 'Tuberose at its most luminous — creamy, green and unapologetic.' }],
  ['shop_blanche', 'Gardenia at Noon', 'Les Fleurs', 'Floral', 96, 14, 'Dewy leaves', 'Gardenia, jasmine sambac', 'White musk', 70, 12, V.porcelain, { desc: 'A walled Charleston garden with the sun directly overhead.' }],
  ['shop_blanche', 'Fleur d’Oranger', 'Les Fleurs', 'Floral', 92, 17, 'Petitgrain, neroli', 'Orange blossom, honey', 'Soft cedar', 70, 12, V.porcelain, { tags: ['new'], desc: 'Orange blossom from first bud to honeyed dusk.' }],
  ['shop_blanche', 'Linen & Iris', 'La Maison', 'Fresh & Coastal', 88, 22, 'Aldehydes, bergamot', 'Iris butter, cotton flower', 'Cashmere wood', 70, 12, V.porcelain, { desc: 'Pressed linen, a cool hallway, powder on the air.' }],
  ['shop_blanche', 'The Porcelain Pair', 'Les Fleurs', 'Gift Sets', 180, 7, 'Pear, dewy leaves', 'Tuberose, gardenia', 'Sandalwood, musk', 140, 24, V.porcelain, { tags: ['gift'], desc: 'Two florals in hand-thrown porcelain, wrapped in silk ribbon.' }],

  // Ember & Oud
  ['shop_ember', 'Reserve Oud No. 7', 'The Reserve', 'Woody & Resin', 148, 9, 'Saffron, rose oxide', 'Aged oud, leather', 'Amber, patchouli', 80, 13, V.night, { tags: ['limited'], desc: 'From the seventh cask of the reserve. 120 numbered pours.' }],
  ['shop_ember', 'Palo Santo Ceremony', 'The Reserve', 'Woody & Resin', 112, 15, 'Lime peel', 'Palo santo, copal', 'Soft suede', 80, 13, V.night, { tags: ['bestseller'], desc: 'Sweet, bright wood smoke — clearing and deeply calming.' }],
  ['shop_ember', 'Piñon Fireside', 'High Desert', 'Woody & Resin', 98, 19, 'Juniper berry', 'Piñon pine, cade', 'Vanilla husk', 75, 12, V.night, { desc: 'A New Mexico winter evening, burning piñon in the kiva.' }],
  ['shop_ember', 'Desert Sage Travel Tin', 'High Desert', 'Fresh & Coastal', 42, 34, 'White sage', 'Chamisa, lavender', 'Dry earth', 22, 4, V.tin, { desc: 'A pocket of high-desert air for wherever you land.' }],
  ['shop_ember', 'The Collector’s Flight', 'The Reserve', 'Gift Sets', 260, 4, 'Saffron, lime, juniper', 'Oud, palo santo, piñon', 'Amber, suede, vanilla', 160, 24, V.night, { tags: ['gift', 'low'], desc: 'Three numbered pours in a walnut case.' }],

  // Wick & Reverie
  ['shop_reverie', 'Sunday Milk', 'Slow Mornings', 'Gourmand', 64, 26, 'Steamed milk', 'Rice, almond', 'Vanilla bean, sandalwood', 55, 10, V.rose, { tags: ['bestseller'], desc: 'Warm milk, a spoon of sugar and nowhere to be.' }],
  ['shop_reverie', 'Toasted Brioche', 'Slow Mornings', 'Gourmand', 64, 20, 'Orange zest', 'Butter, toasted grain', 'Brown sugar, tonka', 55, 10, V.rose, { desc: 'The bakery two doors down, at seven on a Saturday.' }],
  ['shop_reverie', 'Rose Jam', 'Slow Mornings', 'Floral', 66, 18, 'Raspberry leaf', 'Rose petal preserve', 'Honeyed musk', 55, 10, V.rose, { tags: ['new'], desc: 'Rose, but edible — bright, sticky and soft.' }],
  ['shop_reverie', 'Cardamom Chai', 'Slow Mornings', 'Gourmand', 64, 3, 'Cardamom, ginger', 'Black tea, clove', 'Condensed milk', 55, 10, V.rose, { tags: ['low'], desc: 'Spiced tea with too much milk, exactly as it should be.' }],
  ['shop_reverie', 'The Breakfast Tray', 'Slow Mornings', 'Gift Sets', 172, 10, 'Milk, zest, raspberry', 'Rice, butter, rose', 'Vanilla, sugar, musk', 150, 24, V.rose, { tags: ['gift'], desc: 'Three gourmands on a blush lacquer tray.' }],

  // Saltwater Chandlery
  ['shop_salt', 'Harbour Fog', 'The Coast', 'Fresh & Coastal', 72, 23, 'Sea salt, ozone', 'Juniper, wet stone', 'Driftwood', 60, 11, V.seaglass, { tags: ['bestseller'], desc: 'Camden harbour before the sun burns through.' }],
  ['shop_salt', 'Wild Thyme & Lichen', 'The Coast', 'Fresh & Coastal', 72, 16, 'Lemon thyme', 'Lichen, bay leaf', 'Oakmoss', 60, 11, V.seaglass, { desc: 'Green, mineral and a little wild.' }],
  ['shop_salt', 'Beeswax Pillar · Sea Lavender', 'The Coast', 'Floral', 58, 28, 'Sea lavender', 'Raw honey', 'Beeswax', 45, 9, V.pillar, { desc: 'A hand-dipped beeswax pillar scented only with what grows on the shore.' }],
  ['shop_salt', 'Boathouse Cedar', 'The Yard', 'Woody & Resin', 76, 12, 'Pine tar', 'Atlantic cedar, rope', 'Varnish, salt', 60, 11, V.seaglass, { tags: ['new'], desc: 'Fresh-cut cedar and old varnish in the boatyard.' }],
  ['shop_salt', 'The Tidewater Set', 'The Coast', 'Gift Sets', 190, 6, 'Salt, thyme, lavender', 'Juniper, lichen, honey', 'Driftwood, oakmoss, beeswax', 165, 31, V.seaglass, { tags: ['gift'], desc: 'Two jars and a pillar in a seagrass basket.' }],
];

const FIRST = ['Celeste', 'Aurelia', 'Margaux', 'Vivienne', 'Theodora', 'Ines', 'Rosalind', 'Camille', 'Delphine', 'Beatrix', 'Julian', 'Laurent', 'Sebastian', 'Octavia', 'Genevieve', 'Eloise', 'Florence', 'Leopold'];
const LAST = ['Ashworth', 'Beaumont', 'Carrington', 'Devereux', 'Ellison', 'Fontaine', 'Hartwell', 'Laurier', 'Montrose', 'Sinclair', 'Valmont', 'Whitlock'];
const CITIES = ['New York, NY', 'Palm Beach, FL', 'Aspen, CO', 'Napa, CA', 'Greenwich, CT', 'Charleston, SC', 'Austin, TX', 'Seattle, WA', 'Miami, FL', 'Boston, MA'];
const REVIEWS = [
  [5, 'The throw is extraordinary — one candle scents the whole floor without ever feeling heavy.'],
  [5, 'Arrived wrapped like a gift from someone who loves me. The burn is perfectly even.'],
  [4, 'Beautiful vessel and a very refined scent. I only wish it came in a larger size.'],
  [5, 'I have reordered three times. Nothing else in my home comes close.'],
  [5, 'Subtle, layered and nothing like the candles you find in department stores.'],
  [4, 'Lovely and long-lasting. The packaging alone is worth keeping.'],
];
const QUESTIONS = [
  'Do you ship to Canada?', 'Which candle is best for a bedroom?', 'Is this safe around cats?', 'Can I add a handwritten note?',
  'How long does the large one burn?', 'Do you take custom scent commissions?', 'Something smoky but not too strong?', 'When will it be back in stock?',
];

export function buildSeed(now = Date.now()) {
  const r = rng(20251112);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const between = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

  const users = [
    { id: 'u_admin', name: 'The Palace Keeper', email: 'keeper@mothtoaflame.demo', password: 'flame', role: 'admin' },
    { id: 'u_house', name: 'Moth to a Flame Atelier', email: 'atelier@mothtoaflame.demo', password: 'flame', role: 'vendor', shopId: 'shop_mtaf' },
    { id: 'u_vendor', name: 'Isolde Marchetti', email: 'isolde@soleilnoir.demo', password: 'flame', role: 'vendor', shopId: 'shop_soleil' },
    { id: 'u_v3', name: 'Hélène Auclair', email: 'helene@atelierblanche.demo', password: 'flame', role: 'vendor', shopId: 'shop_blanche' },
    { id: 'u_v4', name: 'Mateo Ruiz', email: 'mateo@emberandoud.demo', password: 'flame', role: 'vendor', shopId: 'shop_ember' },
    { id: 'u_v5', name: 'Poppy Lindqvist', email: 'poppy@wickandreverie.demo', password: 'flame', role: 'vendor', shopId: 'shop_reverie' },
    { id: 'u_v6', name: 'Nathaniel Crewe', email: 'nat@saltwaterchandlery.demo', password: 'flame', role: 'vendor', shopId: 'shop_salt' },
    { id: 'u_patron', name: 'Celeste Ashworth', email: 'celeste@patron.demo', password: 'flame', role: 'patron',
      address: { line1: '14 Gramercy Park South', city: 'New York', region: 'NY', postal: '10003', country: 'United States' } },
  ];
  for (let i = 0; i < 14; i++) {
    const name = `${FIRST[(i + 1) % FIRST.length]} ${LAST[(i * 5 + 3) % LAST.length]}`;
    users.push({ id: `u_p${i}`, name, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@patron.demo`, password: 'flame', role: 'patron' });
  }
  users.forEach((u, i) => { u.createdAt = now - (200 - i * 7) * DAY; u.wishlist = []; u.following = []; });

  const shops = SHOPS.map((s, i) => {
    const shop = {
      ...s, status: 'live', feeOverride: null, rating: +(4.6 + r() * 0.4).toFixed(1),
      createdAt: now - (320 - i * 40) * DAY, announcement: '',
      policies: {
        shipping: 'Orders are prepared within two working days and travel by insured, signature-on-delivery courier — typically three to five days within the United States. Delivery is complimentary on every Palace order.',
        returns: 'Unlit candles may be returned within 30 days for a full refund. If anything arrives less than perfect, tell us within 7 days and we will replace it at once.',
        gifting: 'Every order can be gift-wrapped with a handwritten note at no charge — simply add your message at checkout.',
      },
      payoutMethod: { type: 'bank', label: `Bank account ending ${between(1000, 9999)}` },
    };
    shop.frontDesk = {
      enabled: true, name: s.desk.name, tone: s.desk.tone,
      greeting: `Welcome to ${s.name}. I am ${s.desk.name}, the maison’s front desk. May I help you find a scent, or answer a question about an order?`,
      knowledge: DEFAULT_KNOWLEDGE({ ...shop, wax: s.wax }).map((k, j) => ({ id: `k_${s.id}_${j}`, ...k, source: 'owner', uses: between(2, 30), at: now - 60 * DAY })),
      unanswered: [], handoffEmail: users.find((u) => u.id === s.ownerId).email,
    };
    delete shop.desk;
    return shop;
  });
  shops[0].feeOverride = 0; // the founding house pays no commission to itself

  const products = PRODUCTS.map((p, i) => {
    const [shopId, name, collection, category, price, stock, top, heart, base, burnTime, oz, vessel, x = {}] = p;
    return {
      id: `p_${String(i + 1).padStart(3, '0')}`, shopId, name, collection, category, price: price * 100, stock,
      status: 'live', notes: { top, heart, base }, burnTime, weight: `${oz} oz`, vessel: { ...vessel },
      image: x.image || null, tags: x.tags || [], description: x.desc || '', createdAt: now - (120 - i * 3) * DAY,
    };
  });

  // The demo vendor has a few open questions for the "teach" inbox.
  const soleil = shops.find((s) => s.id === 'shop_soleil');
  soleil.frontDesk.unanswered = [
    { id: 'uq_1', q: 'Do you take custom scent commissions for weddings?', count: 3, lastAt: now - 0.4 * DAY },
    { id: 'uq_2', q: 'Is the Carriage House Smoke candle safe around cats?', count: 2, lastAt: now - 1.2 * DAY },
    { id: 'uq_3', q: 'Can I visit the atelier in Savannah?', count: 1, lastAt: now - 2.5 * DAY },
  ];
  soleil.announcement = 'The winter Hearth batch has finished resting — now pouring.';

  // Orders across the last 60 days. More recent days are a little busier.
  const patrons = users.filter((u) => u.role === 'patron');
  const weight = { shop_mtaf: 5, shop_soleil: 4, shop_blanche: 3, shop_ember: 2, shop_reverie: 3, shop_salt: 2 };
  const shopPool = Object.entries(weight).flatMap(([id, w]) => Array(w).fill(id));
  const orders = [];
  let n = 1041;
  for (let d = 59; d >= 0; d--) {
    const count = between(0, 2) + (d < 14 ? between(0, 2) : 0) + (r() < 0.25 ? 1 : 0);
    for (let k = 0; k < count; k++) {
      const patron = pick(patrons);
      const at = now - d * DAY - between(0, 20) * 3600000 * (d === 0 ? 0.3 : 1);
      const shopIds = [pick(shopPool)];
      if (r() < 0.22) { const other = pick(shopPool); if (!shopIds.includes(other)) shopIds.push(other); }
      const parcels = shopIds.map((shopId) => {
        const shop = shops.find((s) => s.id === shopId);
        const list = products.filter((p) => p.shopId === shopId && p.stock > 0);
        const items = [];
        const lines = r() < 0.3 ? 2 : 1;
        for (let l = 0; l < lines; l++) {
          const p = pick(list);
          if (items.find((it) => it.productId === p.id)) continue;
          items.push({ productId: p.id, name: p.name, price: p.price, qty: r() < 0.18 ? 2 : 1 });
        }
        const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
        const rate = shop.feeOverride ?? 0.12;
        const fee = Math.round(subtotal * rate);
        const status = d > 9 ? 'delivered' : d > 4 ? (r() < 0.8 ? 'delivered' : 'shipped') : d > 1 ? (r() < 0.6 ? 'shipped' : 'preparing') : (r() < 0.5 ? 'preparing' : 'placed');
        return { shopId, items, subtotal, feeRate: rate, fee, net: subtotal - fee, status, tracking: status === 'shipped' || status === 'delivered' ? `MP${between(10000000, 99999999)}` : '', payoutId: null };
      });
      const subtotal = parcels.reduce((s, p) => s + p.subtotal, 0);
      orders.push({
        id: `o_${n}`, number: `MP-${n}`, userId: patron.id, customer: patron.name, email: patron.email, createdAt: at,
        shipping: { name: patron.name, line1: `${between(2, 480)} ${pick(['Park Avenue', 'Ocean Drive', 'Magnolia Lane', 'Beacon Street', 'Laurel Way'])}`, city: pick(CITIES) },
        giftNote: r() < 0.25 ? 'For you — light it on a quiet evening.' : '', parcels, subtotal, total: subtotal,
      });
      n++;
    }
  }
  orders.sort((a, b) => b.createdAt - a.createdAt);

  // Past payouts: everything delivered more than 21 days ago has been paid out.
  const payouts = [];
  shops.forEach((shop) => {
    [49, 35, 21].forEach((cut, idx) => {
      const included = [];
      orders.forEach((o) => o.parcels.forEach((p) => {
        if (p.shopId === shop.id && !p.payoutId && p.status === 'delivered' && o.createdAt < now - cut * DAY) included.push(p);
      }));
      if (!included.length) return;
      const id = `po_${shop.id}_${idx}`;
      included.forEach((p) => { p.payoutId = id; });
      payouts.push({ id, shopId: shop.id, amount: included.reduce((s, p) => s + p.net, 0), parcels: included.length, status: 'paid', requestedAt: now - (cut - 6) * DAY, paidAt: now - (cut - 7) * DAY });
    });
  });

  // Daily traffic aggregates per shop: v=visits p=product views b=bag adds c=chats o=orders r=revenue
  const stats = {};
  shops.forEach((shop) => {
    stats[shop.id] = {};
    const base = weight[shop.id] * 14;
    for (let d = 59; d >= 0; d--) {
      const key = dayKey(now - d * DAY);
      const trend = 1 + (59 - d) / 120;
      const weekend = [0, 6].includes(new Date(now - d * DAY).getDay()) ? 1.25 : 1;
      const v = Math.round(base * trend * weekend * (0.7 + r() * 0.6));
      stats[shop.id][key] = { v, p: Math.round(v * (0.5 + r() * 0.3)), b: Math.round(v * (0.06 + r() * 0.05)), c: Math.round(v * (0.03 + r() * 0.04)), o: 0, r: 0 };
    }
  });
  orders.forEach((o) => o.parcels.forEach((p) => {
    const day = stats[p.shopId][dayKey(o.createdAt)];
    if (day) { day.o += 1; day.r += p.subtotal; day.b = Math.max(day.b, day.o + 1); }
  }));

  // Recent live events for activity feeds
  const events = [];
  const types = ['shop_view', 'shop_view', 'product_view', 'product_view', 'product_view', 'bag_add', 'chat', 'wish', 'follow'];
  for (let i = 0; i < 160; i++) {
    const shop = pick(shops);
    const list = products.filter((p) => p.shopId === shop.id);
    const type = pick(types);
    events.push({ id: `e_${i}`, type, shopId: shop.id, productId: ['product_view', 'bag_add', 'wish'].includes(type) ? pick(list).id : null, at: now - r() * 2.5 * DAY, meta: { city: pick(CITIES) } });
  }
  orders.slice(0, 30).forEach((o) => o.parcels.forEach((p) => events.push({ id: `e_o_${o.id}_${p.shopId}`, type: 'order', shopId: p.shopId, productId: p.items[0].productId, at: o.createdAt, meta: { amount: p.subtotal, number: o.number, customer: o.customer } })));
  events.sort((a, b) => b.at - a.at);

  // Front desk conversations
  const conversations = [];
  shops.forEach((shop) => {
    for (let i = 0; i < 4; i++) {
      const at = now - (r() * 6 + 0.1) * DAY;
      const q = pick(QUESTIONS);
      conversations.push({
        id: `c_${shop.id}_${i}`, shopId: shop.id, visitor: `${pick(FIRST)} · ${pick(CITIES)}`, startedAt: at, updatedAt: at + 120000, resolved: r() < 0.75,
        messages: [
          { from: 'desk', text: shop.frontDesk.greeting, at },
          { from: 'visitor', text: q, at: at + 40000 },
          { from: 'desk', text: i % 2 ? shop.policies.shipping : 'Of course — may I suggest starting with our most-loved pour? It is the one our patrons return to most often.', at: at + 46000 },
        ],
      });
    }
  });
  conversations.sort((a, b) => b.updatedAt - a.updatedAt);

  const reviews = [];
  products.forEach((p, i) => {
    const count = 1 + (i % 3);
    for (let k = 0; k < count; k++) {
      const [rating, text] = REVIEWS[(i + k * 2) % REVIEWS.length];
      reviews.push({ id: `r_${p.id}_${k}`, productId: p.id, shopId: p.shopId, userName: `${FIRST[(i + k * 3) % FIRST.length]} ${LAST[(i + k) % LAST.length][0]}.`, rating, text, at: now - (5 + ((i * 7 + k * 11) % 80)) * DAY });
    }
  });

  const applications = [
    { id: 'app_1', name: 'Anaïs Durand', email: 'anais@lunefumee.demo', maisonName: 'Lune Fumée', location: 'New Orleans, Louisiana', website: 'lunefumee.example', specialties: 'Incense-inspired candles in hand-blown smoked glass', priceRange: '$70 – $140', story: 'I trained as a perfumer in Grasse before returning home to New Orleans. Lune Fumée is poured in batches of forty, in glass blown by my brother.', status: 'pending', createdAt: now - 1.3 * DAY },
    { id: 'app_2', name: 'Thaddeus Okafor', email: 'thaddeus@goldenhour.demo', maisonName: 'Golden Hour Chandlers', location: 'Ojai, California', website: 'goldenhourchandlers.example', specialties: 'Citrus-grove and beeswax candles from our own orchard', priceRange: '$55 – $110', story: 'We keep bees among the Pixie tangerine trees and pour only with our own wax. Production is small and seasonal by nature.', status: 'pending', createdAt: now - 3.1 * DAY },
    { id: 'app_3', name: 'Marguerite Sato', email: 'm@kintsugiwick.demo', maisonName: 'Kintsugi Wick', location: 'Portland, Oregon', website: 'kintsugiwick.example', specialties: 'Hinoki and tea candles in repaired ceramic vessels', priceRange: '$90 – $220', story: 'Every vessel is a reclaimed ceramic repaired with gold lacquer. No two are alike.', status: 'pending', createdAt: now - 0.3 * DAY },
    { id: 'app_4', name: 'Dale Brenner', email: 'dale@megacandle.demo', maisonName: 'MegaCandle Outlet', location: 'Online', website: 'megacandle.example', specialties: 'Bulk scented candles, wholesale pricing', priceRange: '$6 – $15', story: 'We sell high volume factory candles at the lowest prices.', status: 'declined', createdAt: now - 18 * DAY, decidedAt: now - 17 * DAY, note: 'The Palace is reserved for hand-poured, small-batch maisons.' },
  ];

  const notifications = [
    { id: 'n_1', target: 'shop_soleil', kind: 'order', title: 'A new order has arrived', body: 'Carriage House Smoke is on its way to a new home.', at: now - 0.2 * DAY, read: false, link: '/atelier/orders' },
    { id: 'n_2', target: 'shop_soleil', kind: 'desk', title: 'Noor needs your guidance', body: 'Three guests asked about custom wedding commissions.', at: now - 0.4 * DAY, read: false, link: '/atelier/front-desk' },
    { id: 'n_3', target: 'shop_soleil', kind: 'stock', title: 'Frankincense at Dusk is running low', body: 'Only 5 remain in the atelier.', at: now - 1 * DAY, read: true, link: '/atelier/products' },
    { id: 'n_4', target: 'admin', kind: 'application', title: 'Kintsugi Wick has applied for residency', body: 'A new maison is awaiting your review.', at: now - 0.3 * DAY, read: false, link: '/keeper/applications' },
    { id: 'n_5', target: 'admin', kind: 'application', title: 'Lune Fumée has applied for residency', body: 'A new maison is awaiting your review.', at: now - 1.3 * DAY, read: false, link: '/keeper/applications' },
  ];

  const patron = users.find((u) => u.id === 'u_patron');
  patron.wishlist = ['p_015', 'p_020', 'p_010'];
  patron.following = ['shop_soleil', 'shop_blanche'];
  // Make sure the demo patron has an order history.
  orders.filter((o, i) => i % 9 === 2).slice(0, 4).forEach((o) => { o.userId = patron.id; o.customer = patron.name; o.email = patron.email; o.shipping.name = patron.name; });

  return {
    version: 1, seededAt: now,
    settings: {
      feeRate: 0.12, announcement: 'Complimentary insured delivery on every Palace order', applicationsOpen: true,
      minPayout: 5000, payoutSchedule: 'weekly', aiEnabled: true,
      featuredShopIds: shops.filter((s) => s.featured).map((s) => s.id),
      edits: [
        { id: 'edit_1', title: 'The Evening Edit', subtitle: 'Resin, smoke and low light', productIds: ['p_003', 'p_009', 'p_010', 'p_021'] },
        { id: 'edit_2', title: 'For the Giver', subtitle: 'Boxed, ribboned and ready', productIds: ['p_005', 'p_013', 'p_019', 'p_029'] },
      ],
    },
    session: { userId: null }, bag: [],
    users, shops, products, orders, payouts, stats, events, conversations, reviews, applications, notifications,
  };
}
