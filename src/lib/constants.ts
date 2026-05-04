import { ATTR_DEFS } from './CM0102Parser';
export { ATTR_DEFS };

export const NATION_ISO_MAP: Record<string, string> = {
  'England': 'gb-eng', 'Scotland': 'gb-sct', 'Wales': 'gb-wls',
  'Ireland': 'ie', 'Northern Ireland': 'gb-nir',
  'France': 'fr', 'Germany': 'de', 'Italy': 'it', 'Spain': 'es',
  'Portugal': 'pt', 'Netherlands': 'nl', 'Belgium': 'be',
  'Brazil': 'br', 'Argentina': 'ar', 'Sweden': 'se', 'Norway': 'no',
  'Denmark': 'dk', 'Finland': 'fi', 'Japan': 'jp', 'South Korea': 'kr',
  'Australia': 'au', 'USA': 'us', 'Canada': 'ca', 'Mexico': 'mx',
  'Nigeria': 'ng', 'Cameroon': 'cm', 'Senegal': 'sn', 'Egypt': 'eg',
  'Morocco': 'ma', 'South Africa': 'za', 'Russia': 'ru', 'Croatia': 'hr',
  'Serbia': 'rs', 'Turkey': 'tr', 'Greece': 'gr', 'Poland': 'pl',
  'Ukraine': 'ua', 'Switzerland': 'ch', 'Austria': 'at',
  'Czech Republic': 'cz', 'Romania': 'ro', 'Bulgaria': 'bg',
  'Hungary': 'hu', 'Slovakia': 'sk', 'Slovenia': 'si', 'Iceland': 'is',
  'Israel': 'il', 'Saudi Arabia': 'sa', 'China': 'cn', 'Tunisia': 'tn',
  'Uruguay': 'uy', 'Colombia': 'co', 'Chile': 'cl', 'Paraguay': 'py',
  'Peru': 'pe', 'Ecuador': 'ec', 'Bolivia': 'bo', 'Venezuela': 've',
};

export const getFlagUrl = (nationality: string) => {
  const cc = NATION_ISO_MAP[nationality] || 'un';
  return `https://flagcdn.com/16x12/${cc.toLowerCase()}.png`;
};

export const formatCurrency = (val: number) => {
  if (val >= 1_000_000) return `£${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `£${(val / 1_000).toFixed(0)}k`;
  return `£${val}`;
};

/** Returns a Tailwind colour class. Handles isLessBetter attributes correctly. */
export const getAttributeColor = (val: number, attrName?: string) => {
  const def = attrName ? ATTR_DEFS[attrName] : undefined;
  const effectiveVal = def?.isLessBetter ? 21 - val : val; // invert scale for injury etc.
  if (effectiveVal >= 15) return 'text-[#00C853]';
  if (effectiveVal >= 10) return 'text-[#FF9800]';
  return 'text-[#FF3D00]';
};

/** Ordered attribute list matching DataService.Attributes[] groupings. */
export const ALL_ATTRIBUTES: string[] = [
  // CA18 — tactical / technical
  'Anticipation', 'Creativity', 'Crossing', 'Decisions', 'Dribbling',
  'Finishing', 'Heading', 'LongShots', 'Marking', 'OffTheBall',
  'Passing', 'Penalties', 'Positioning', 'Tackling', 'ThrowIns',
  // CA18 — GK-specific
  'Handling', 'OneOnOnes', 'Reflexes',
  // Non-CA18 — physical
  'Acceleration', 'Agility', 'Balance', 'Jumping', 'NaturalFitness',
  'Pace', 'Stamina', 'Strength',
  // Non-CA18 — mental / technical
  'Aggression', 'Bravery', 'Consistency', 'Corners', 'Dirtiness',
  'Flair', 'ImportantMatches', 'Influence', 'InjuryProneness',
  'SetPieces', 'Teamwork', 'Technique', 'Versatility', 'WorkRate',
  // Foot ratings
  'LeftFoot', 'RightFoot',
  // Staff mentals (hidden in-game)
  'Adaptability', 'Ambition', 'Determination', 'Loyalty',
  'Pressure', 'Professionalism', 'Sportsmanship', 'Temperament',
];

/** Group label for display in the PlayerProfile attribute grid. */
export const getAttributeCategory = (attr: string): string => {
  const def = ATTR_DEFS[attr];
  if (!def) return 'Other';
  if (def.isCA18 && attr !== 'Handling' && attr !== 'OneOnOnes' && attr !== 'Reflexes')
    return 'Technical';
  if (attr === 'Handling' || attr === 'OneOnOnes' || attr === 'Reflexes')
    return 'Goalkeeping';
  const physical = ['Acceleration','Agility','Balance','Jumping','NaturalFitness','Pace','Stamina','Strength'];
  if (physical.includes(attr)) return 'Physical';
  const staff = ['Adaptability','Ambition','Determination','Loyalty','Pressure','Professionalism','Sportsmanship','Temperament'];
  if (staff.includes(attr)) return 'Personality';
  return 'Mental';
};
