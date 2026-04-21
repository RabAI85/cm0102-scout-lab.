
export const NATION_ISO_MAP: Record<string, string> = {
  'England': 'gb', 'Scotland': 'gb', 'Wales': 'gb', 'Ireland': 'ie', 'Northern Ireland': 'gb',
  'France': 'fr', 'Germany': 'de', 'Italy': 'it', 'Spain': 'es', 'Portugal': 'pt', 'Netherlands': 'nl',
  'Belgium': 'be', 'Brazil': 'br', 'Argentina': 'ar', 'Sweden': 'se', 'Norway': 'no', 'Denmark': 'dk',
  'Finland': 'fi', 'Japan': 'jp', 'South Korea': 'kr', 
  'Australia': 'au', 'USA': 'us', 'Canada': 'ca', 'Mexico': 'mx', 'Nigeria': 'ng', 'Cameroon': 'cm',
  'Senegal': 'sn', 'Egypt': 'eg', 'Morocco': 'ma', 'South Africa': 'za', 'Russia': 'ru',
  'Croatia': 'hr', 'Serbia': 'rs', 'Turkey': 'tr', 'Greece': 'gr', 'Poland': 'pl',
  'Ukraine': 'ua', 'Switzerland': 'ch', 'Austria': 'at', 'Czech Republic': 'cz', 'Romania': 'ro',
  'Bulgaria': 'bg', 'Hungary': 'hu', 'Slovakia': 'sk', 'Slovenia': 'si', 'Iceland': 'is',
  'Israel': 'il', 'Saudi Arabia': 'sa', 'China': 'cn', 'Tunisia': 'tn', 'Uruguay': 'uy', 'Colombia': 'co',
  'Chile': 'cl', 'Paraguay': 'py', 'Peru': 'pe', 'Ecuador': 'ec', 'Bolivia': 'bo', 'Venezuela': 've'
};

export const getFlagUrl = (nationality: string) => {
  const cc = NATION_ISO_MAP[nationality] || 'un';
  return `https://flagcdn.com/16x12/${cc.toLowerCase()}.png`;
};

export const formatCurrency = (val: number) => {
  if (val >= 1000000) return `£${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `£${(val / 1000).toFixed(0)}k`;
  return `£${val}`;
};

export const getAttributeColor = (val: number) => {
  if (val >= 15) return 'text-[#00C853]'; // green
  if (val >= 10) return 'text-[#FF9800]'; // amber
  return 'text-[#FF3D00]'; // red
};

export const ALL_ATTRIBUTES = [
  'Acceleration', 'Aggression', 'Agility', 'Anticipation', 'Balance', 'Bravery', 'Consistency', 
  'Corners', 'Crossing', 'Decisions', 'Dirtiness', 'Dribbling', 'Finishing', 'Flair', 'Handling', 
  'Heading', 'ImportantMatches', 'InjuryProneness', 'Jumping', 'Influence', 'LeftFoot', 
  'RightFoot', 'LongShots', 'Marking', 'NaturalFitness', 'OffTheBall', 'OneOnOnes', 
  'Pace', 'Passing', 'Penalties', 'Positioning', 'Reflexes', 'Stamina', 'Strength', 'Tackling', 
  'Teamwork', 'Technique', 'Versatility', 'Creativity', 'WorkRate', 'Adaptability', 'Ambition', 
  'Determination', 'Loyalty', 'Pressure', 'Professionalism', 'Sportsmanship', 'Temperament'
];
