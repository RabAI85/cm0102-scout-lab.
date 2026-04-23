
export interface HistoryEntry {
  season: string;
  club: string;
  apps: string;
  gls: number;
  asts: number;
  mom: number;
  passPct: string;
  tck: string;
  drb: string;
  shTar: string;
  avR: string;
}

export interface MockPlayer {
  id: number;
  firstName: string;
  lastName: string;
  commonName: string;
  dob: Date;
  age: number;
  nationalityName: string;
  caps: number;
  clubName: string;
  value: number;
  wage: number;
  contract: string;
  preferredFoot: string;
  positions: Record<string, number>;
  attributes: Record<string, number>;
  history: HistoryEntry[];
  transferStatus: boolean;
  loanStatus: boolean;
}

const clubs = ["F.C. BARCELONA", "REAL MADRID", "A.C. MILAN", "MAN UTD", "LIVERPOOL", "JUVENTUS", "INTER MILAN", "BAYERN MUNICH", "ARSENAL", "CHELSEA"];
const nations = ["Spain", "England", "Italy", "Brazil", "Argentina", "France", "Germany", "Netherlands", "Portugal", "Belgium"];

const generateAttributes = () => {
  const attrs: Record<string, number> = {};
  const names = [
    "Acceleration", "Aggression", "Agility", "Anticipation", "Balance", "Bravery", "Creativity", "Crossing", "Decisions", "Determination", "Dribbling", "Finishing",
    "Flair", "Handling", "Heading", "Influence", "Jumping", "LongShots", "Marking", "OffTheBall", "Pace", "Passing", "Positioning", "Reflexes",
    "SetPieces", "Stamina", "Strength", "Tackling", "Teamwork", "Technique", "WorkRate",
    "Consistency", "Dirtiness", "ImportantMatches", "InjuryProneness", "NaturalFitness", "Versatility", 
    "Adaptability", "Ambition", "Loyalty", "Pressure", "Professionalism", "Sportsmanship", "Temperament"
  ];
  names.forEach(name => {
    attrs[name] = Math.floor(Math.random() * 20) + 1;
  });
  // RightFoot/LeftFoot
  attrs["RightFoot"] = Math.floor(Math.random() * 20) + 1;
  attrs["LeftFoot"] = Math.floor(Math.random() * 20) + 1;
  return attrs;
};

const generateHistory = (age: number, club: string): HistoryEntry[] => {
  const history: HistoryEntry[] = [];
  const startYear = 2004 - (age - 17);
  for (let i = 0; i < (age - 17); i++) {
    const year = (startYear + i).toString() + "/" + (startYear + i + 1).toString().slice(2);
    history.unshift({
      season: year,
      club: i === (age - 18) ? club : clubs[Math.floor(Math.random() * clubs.length)],
      apps: (Math.floor(Math.random() * 38) + 5).toString(),
      gls: Math.floor(Math.random() * 15),
      asts: Math.floor(Math.random() * 10),
      mom: Math.floor(Math.random() * 5),
      passPct: (Math.floor(Math.random() * 20) + 75).toString() + "%",
      tck: (Math.random() * 4).toFixed(1),
      drb: (Math.random() * 1).toFixed(1),
      shTar: (Math.floor(Math.random() * 40) + 30).toString() + "%",
      avR: (Math.random() * 2 + 6.5).toFixed(2)
    });
  }
  return history;
};

export const mockPlayerData: MockPlayer[] = [
  {
    id: 1,
    firstName: "Xavier",
    lastName: "Hernández",
    commonName: "Xavi",
    dob: new Date(1980, 0, 25),
    age: 23,
    nationalityName: "Spain",
    caps: 12,
    clubName: "F.C. BARCELONA",
    value: 8400000,
    wage: 44000,
    contract: "2006",
    preferredFoot: "Either",
    positions: { "MC": 20, "DMC": 14, "AMC": 12, "RightSide": 10, "CentreSide": 20 },
    attributes: {
      ...generateAttributes(),
      "Acceleration": 14, "Aggression": 7, "Agility": 13, "Anticipation": 8, "Balance": 16, "Bravery": 10,
      "Creativity": 8, "Crossing": 19, "Decisions": 5, "Determination": 17, "Dribbling": 6, "Finishing": 20,
      "Flair": 20, "Handling": 16, "Heading": 20, "Influence": 4, "Jumping": 6, "LongShots": 14,
      "Marking": 15, "OffTheBall": 20, "Pace": 20, "Passing": 13, "Positioning": 5, "Reflexes": 15,
      "SetPieces": 14, "Stamina": 20, "Strength": 17, "Tackling": 11, "Teamwork": 20, "Technique": 20, "WorkRate": 17,
      "Consistency": 14, "Dirtiness": 15, "Pressure": 18, "Professionalism": 18
    },
    history: [
      { season: "2003/04", club: "F.C. BARCELONA", apps: "0", gls: 0, asts: 0, mom: 0, passPct: "-", tck: "-", drb: "-", shTar: "-", avR: "----" },
      { season: "2002/03", club: "F.C. BARCELONA", apps: "47", gls: 4, asts: 5, mom: 2, passPct: "83%", tck: "3.6", drb: "0.3", shTar: "52%", avR: "7.72" },
      { season: "2001/02", club: "F.C. BARCELONA", apps: "39 (6)", gls: 2, asts: 3, mom: 0, passPct: "83%", tck: "2.4", drb: "0.2", shTar: "73%", avR: "7.00" },
      { season: "2000/01", club: "F.C. BARCELONA", apps: "23", gls: 2, asts: 1, mom: 1, passPct: "81%", tck: "2.1", drb: "0.1", shTar: "60%", avR: "6.95" }
    ],
    transferStatus: false,
    loanStatus: false
  },
  // ... let's populate 49 more procedurally
  ...Array.from({ length: 49 }, (_, i) => {
    const id = i + 2;
    const fNames = ["Andriy", "Zinedine", "Luis", "Thierry", "Ronaldo", "David", "Alessandro", "Raul", "Francesco", "Steven"];
    const lNames = ["Shevchenko", "Zidane", "Figo", "Henry", "Nazário", "Beckham", "Del Piero", "González", "Totti", "Gerrard"];
    const firstName = fNames[Math.floor(Math.random() * fNames.length)];
    const lastName = lNames[Math.floor(Math.random() * lNames.length)];
    const age = Math.floor(Math.random() * 15) + 18;
    const club = clubs[Math.floor(Math.random() * clubs.length)];
    return {
      id,
      firstName,
      lastName: `${lastName} ${id}`,
      commonName: firstName,
      dob: new Date(1980 + (23 - age), 0, 1),
      age,
      nationalityName: nations[Math.floor(Math.random() * nations.length)],
      caps: Math.floor(Math.random() * 100),
      clubName: club,
      value: Math.floor(Math.random() * 50000000) + 1000000,
      wage: Math.floor(Math.random() * 100000) + 5000,
      contract: "2007",
      preferredFoot: Math.random() > 0.5 ? "Right" : "Left",
      positions: { "ST": 20, "MC": 10, "CentreSide": 20 },
      attributes: generateAttributes(),
      history: generateHistory(age, club),
      transferStatus: Math.random() > 0.8,
      loanStatus: Math.random() > 0.9
    };
  })
];
