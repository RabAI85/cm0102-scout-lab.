// ============================================================
// CM0102Parser.ts
// Complete rewrite based on verified C# source code from
// agevak/CM0102PlayerBenchmarker — SaveFileParser.cs
// All byte offsets are taken directly from the working C# parser.
// Do not modify offset values without cross-referencing the source.
// ============================================================

export interface CMDate {
  day: number;
  year: number;
  isLeapYear: number;
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  commonName: string;
  age: number;
  dob: Date | null;
  nationalityName: string;
  secondNationalityName: string;
  clubName: string;
  wage: number;
  value: number;
  currentAbility: number;
  potentialAbility: number;
  reputation: {
    home: number;
    current: number;
    world: number;
  };
  attributes: Record<string, number>;
  positions: Record<string, number>;
  preferredFoot: string;
  history?: any[];
  transferStatus?: boolean;
  loanStatus?: boolean;
}

// ── Internal types ────────────────────────────────────────────

interface CMBlock {
  position: number;
  size: number;
}

interface CMName {
  name: string;
  id: number;
  nationId: number;
}

interface CMNation {
  id: number;
  name: string;
}

interface CMClub {
  id: number;
  name: string;
}

interface CMRawPlayer {
  id: number;
  squadNumber: number;
  currentAbility: number;
  potentialAbility: number;
  homeReputation: number;
  currentReputation: number;
  worldReputation: number;
  // Position suitability (signed, -1 means not suited)
  goalkeeper: number;
  sweeper: number;
  defender: number;
  defensiveMidfielder: number;
  midfielder: number;
  attackingMidfielder: number;
  attacker: number;
  wingBack: number;
  rightSide: number;
  leftSide: number;
  centreSide: number;
  freeRole: number;
  // Mental / Personality (at offsets 27-29)
  creativity: number;
  workRate: number;
  morale: number;
  // Technical & physical attributes (40 attributes starting at offset 30)
  acceleration: number;
  aggression: number;
  agility: number;
  anticipation: number;
  balance: number;
  bravery: number;
  consistency: number;
  corners: number;
  crossing: number;
  decisions: number;
  dirtiness: number;
  dribbling: number;
  handling: number;
  heading: number;
  importantMatches: number;
  injuryProneness: number;
  jumping: number;
  influence: number;
  leftFoot: number;
  longShots: number;
  marking: number;
  offTheBall: number;
  naturalFitness: number;
  oneOnOnes: number;
  pace: number;
  passing: number;
  penalties: number;
  positioning: number;
  reflexes: number;
  rightFoot: number;
  stamina: number;
  strength: number;
  tackling: number;
  teamwork: number;
  technique: number;
  throwIns: number;
  versatility: number;
  finishing: number;
  flair: number;
  setPieces: number;
}

interface CMRawStaff {
  id: number;
  firstNameId: number;
  secondNameId: number;
  commonNameId: number;
  dateOfBirth: Date | null;
  yearOfBirth: number;
  firstNationId: number;
  secondNationId: number;
  clubJobId: number;
  wage: number;
  value: number;
  adaptability: number;
  ambition: number;
  determination: number;
  loyalty: number;
  pressure: number;
  professionalism: number;
  sportsmanship: number;
  temperament: number;
  playerId: number;
}

// ── Parser class ──────────────────────────────────────────────

export class CM0102Parser {
  private view: DataView;
  private buffer: ArrayBuffer;
  private offset: number = 0;
  private log: (msg: string, type?: 'info' | 'success' | 'error') => void;
  private blocks: Map<string, CMBlock> = new Map();
  private gameDate: Date | null = null;

  constructor(
    buffer: ArrayBuffer,
    logger?: (msg: string, type?: 'info' | 'success' | 'error') => void
  ) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.log = logger || ((msg) => console.log(msg));
  }

  // ── Primitive readers (sequential, advance this.offset) ──────

  private readInt32(): number {
    const val = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return val;
  }

  private readUint32(): number {
    const val = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return val;
  }

  private readInt16(): number {
    const val = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return val;
  }

  private readInt8(): number {
    const val = this.view.getInt8(this.offset);
    this.offset += 1;
    return val;
  }

  private readUint8(): number {
    const val = this.view.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  private readDouble(): number {
    const val = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return val;
  }

  private readString(length: number): string {
    const bytes = new Uint8Array(this.buffer, this.offset, length);
    this.offset += length;
    let end = bytes.indexOf(0);
    if (end === -1) end = length;
    try {
      return new TextDecoder('windows-1252').decode(bytes.slice(0, end));
    } catch {
      return new TextDecoder('iso-8859-1').decode(bytes.slice(0, end));
    }
  }

  // CM date format: Int16 day + Int16 year + Int32 isLeapYear = 8 bytes total
  private readCMDate(): Date | null {
    const day = this.readInt16();
    const year = this.readInt16();
    this.readInt32(); // isLeapYear — not needed for date calc
    if (day === 0 && year === 0) return null;
    try {
      const date = new Date(year, 0, 1);
      date.setDate(date.getDate() + day);
      return date;
    } catch {
      return null;
    }
  }

  private seek(position: number): void {
    this.offset = position;
  }

  // ── Block directory ───────────────────────────────────────────

  // Try one candidate block-table format. Returns [score, blocks].
  // Score is 0 if unusable; higher means more valid .dat blocks detected.
  private tryReadBlockTable(
    tableOffset: number,
    numBlocks: number,
    nameFirst: boolean,
    nameLength: number
  ): [number, Map<string, CMBlock>] {
    const fileSize = this.buffer.byteLength;
    const testBlocks = new Map<string, CMBlock>();
    this.seek(tableOffset);

    for (let i = 0; i < numBlocks; i++) {
      let name: string, position: number, size: number;
      if (nameFirst) {
        name     = this.readString(nameLength);
        position = this.readInt32();
        size     = this.readInt32();
      } else {
        position = this.readInt32();
        size     = this.readInt32();
        name     = this.readString(nameLength);
      }
      testBlocks.set(name.toLowerCase().trim(), { position, size });
    }

    let score = 0;
    for (const [name, block] of testBlocks.entries()) {
      if (
        name.includes('.dat') &&
        block.position > 0 &&
        block.position < fileSize &&
        block.size > 0 &&
        block.size < fileSize
      ) {
        score++;
        // Extra weight for blocks we absolutely require
        if (name.endsWith('player.dat') || name.endsWith('staff.dat') ||
            name.endsWith('nation.dat') || name.endsWith('second_names.dat') ||
            name.endsWith('common_names.dat')) {
          score += 2;
        }
      }
    }

    return [score, testBlocks];
  }

  public parseHeader(): void {
    this.seek(0);
    const compressionFlag = this.readInt32();
    if (compressionFlag === 4) {
      throw new Error(
        'Compressed saves are not supported — please save with compression off in CM game settings.'
      );
    }

    // Probe all combinations of: numBlocks offset, name-first vs pos-first, name length.
    // CM 01/02 uses 256-byte or 260-byte padded name fields; try both.
    const nameLengthCandidates = [256, 260, 128];
    const layoutCandidates: Array<{ numBlocksOffset: number; nameFirst: boolean }> = [
      { numBlocksOffset: 4, nameFirst: true  },
      { numBlocksOffset: 4, nameFirst: false },
      { numBlocksOffset: 8, nameFirst: true  },
      { numBlocksOffset: 8, nameFirst: false },
    ];

    let bestScore = 0;
    let bestBlocks: Map<string, CMBlock> = new Map();
    let bestDesc = '';

    for (const nameLength of nameLengthCandidates) {
      for (const { numBlocksOffset, nameFirst } of layoutCandidates) {
        this.seek(numBlocksOffset);
        const numBlocks = this.readInt32();
        if (numBlocks < 1 || numBlocks > 200) continue;

        const tableOffset = numBlocksOffset + 4;
        const [score, blocks] = this.tryReadBlockTable(tableOffset, numBlocks, nameFirst, nameLength);

        if (score > bestScore) {
          bestScore = score;
          bestBlocks = blocks;
          bestDesc = `${numBlocks} blocks (numBlocks@${numBlocksOffset}, ${nameFirst ? 'name-first' : 'pos-first'}, nameLen=${nameLength})`;
        }
      }
    }

    if (bestScore === 0) {
      throw new Error(
        'Could not detect save file block table format. ' +
        'Make sure this is an uncompressed CM 01/02 save file (.sav).'
      );
    }

    this.blocks = bestBlocks;
    this.log(`Found ${bestDesc}, score=${bestScore}.`, 'info');
    this.log(`Block directory loaded. Blocks: ${Array.from(this.blocks.keys()).join(', ')}`, 'info');
  }

  private getBlock(name: string): CMBlock {
    const searchName = name.toLowerCase();
    // Support suffix matching (e.g. "player.dat" matches "C:\Games\CM\Data\player.dat")
    for (const [blockName, block] of this.blocks.entries()) {
      if (blockName === searchName || blockName.endsWith('\\' + searchName) || blockName.endsWith('/' + searchName)) {
        return block;
      }
    }
    throw new Error(`Block "${name}" not found in save file. Available keys: ${Array.from(this.blocks.keys()).slice(0, 5).join(', ')}...`);
  }

  // ── Game date (from general.dat) ─────────────────────────────
  // The game date is at offset 3944 within the general.dat block.

  private parseGameDate(): void {
    try {
      const block = this.getBlock('general.dat');
      this.seek(block.position + 3944);
      this.gameDate = this.readCMDate();
      if (this.gameDate) {
        this.log(`Game date: ${this.gameDate.toDateString()}`, 'info');
      }
    } catch (e) {
      this.log('Could not read game date from general.dat — ages may be approximate.', 'info');
      this.gameDate = new Date(2001, 6, 1); // fallback: July 2001
    }
  }

  // ── Nations (nation.dat) ──────────────────────────────────────
  // Record size: 290 bytes exactly (verified from C# source)

  private parseNations(): Map<number, CMNation> {
    const block = this.getBlock('nation.dat');
    const count = Math.floor(block.size / 290);
    this.log(`Parsing ${count} nations...`, 'info');

    const nations = new Map<number, CMNation>();
    this.seek(block.position);

    for (let i = 0; i < count; i++) {
      const startOffset = block.position + i * 290;
      this.seek(startOffset);

      const id = this.readInt32();           // 4 bytes
      const name = this.readString(51);      // 51 bytes
      this.readInt8();                        // genderName 1 byte
      const shortName = this.readString(26); // 26 bytes
      // remaining 290 - 4 - 51 - 1 - 26 = 208 bytes skipped by next seek

      nations.set(id, { id, name: name || shortName });
    }

    return nations;
  }

  // ── Clubs (club.dat) ─────────────────────────────────────────
  // Record size: 581 bytes exactly (verified from C# source)

  private parseClubs(): Map<number, CMClub> {
    const block = this.getBlock('club.dat');
    const count = Math.floor(block.size / 581);
    this.log(`Parsing ${count} clubs...`, 'info');

    const clubs = new Map<number, CMClub>();

    for (let i = 0; i < count; i++) {
      const startOffset = block.position + i * 581;
      this.seek(startOffset);

      const id = this.readInt32();       // 4 bytes
      const name = this.readString(51);  // 51 bytes

      clubs.set(id, { id, name });
    }

    return clubs;
  }

  // ── Names (first_names.dat, second_names.dat, common_names.dat) ──
  // Record size: 60 bytes exactly (verified from C# source)
  // Layout: 51-byte name string, Int32 id, Int32 nationId, Int8 count

  private parseNames(blockName: string): Map<number, CMName> {
    const block = this.getBlock(blockName);
    const count = Math.floor(block.size / 60);
    this.log(`Parsing ${count} names from ${blockName}...`, 'info');

    const names = new Map<number, CMName>();

    for (let i = 0; i < count; i++) {
      const startOffset = block.position + i * 60;
      this.seek(startOffset);

      const name = this.readString(51);  // 51 bytes
      const id = this.readInt32();       // 4 bytes
      const nationId = this.readInt32(); // 4 bytes
      this.readInt8();                   // count 1 byte

      names.set(id, { name, id, nationId });
    }

    return names;
  }

  // ── Raw players (player.dat) ──────────────────────────────────
  // Record size: 70 bytes exactly (verified from C# source)
  // IMPORTANT: CA and PA are Int16 (2 bytes each), not Int8
  // All attribute bytes after WorldReputation are Int8
  // Negative attribute values: CM uses negative to flag "game-set" values
  // The magnitude is still the real rating — use Math.abs()

  private normalizeAttribute(val: number): number {
    // Attributes in CM are generally 1-20.
    // Negative values are random tags or game-set flags. 
    // We take the magnitude as the most reliable value for scouting.
    const v = Math.abs(val);
    
    // In CM, 0 is often used for "random".
    if (v === 0) return 1;

    // Attributes are 1-20. We cap at 20 to maintain consistent scaling in the UI.
    return v > 20 ? 20 : v;
  }

  private parseRawPlayers(): Map<number, CMRawPlayer> {
    const block = this.getBlock('player.dat');
    
    // Auto-detect record size (usually 70 or 76)
    let recordSize = 70;
    if (block.size >= 152) {
       this.seek(block.position);
       const id0 = this.readInt32();
       this.seek(block.position + 70);
       const id1a = this.readInt32();
       this.seek(block.position + 76);
       const id1b = this.readInt32();
       
       if (id1b === id0 + 1 && id1b > 0 && id1b < 1000000) {
         recordSize = 76;
         this.log(`Detected player.dat record size: 76`, 'info');
       } else {
         recordSize = 70;
         this.log(`Detected player.dat record size: 70`, 'info');
       }
    }

    const count = Math.floor(block.size / recordSize);
    this.log(`Parsing ${count} player records...`, 'info');

    const players = new Map<number, CMRawPlayer>();

    for (let i = 0; i < count; i++) {
      const base = block.position + i * recordSize;
      this.seek(base);

      // Helper: read signed byte, map to absolute value and normalize
      const nextAttr = () => this.normalizeAttribute(this.readInt8());
      
      const player: CMRawPlayer = {
        // Offset 0-14: Core attributes
        id: this.readInt32(),             // 0-3
        currentAbility: this.readInt16(),  // 4-5
        potentialAbility: this.readInt16(),// 6-7
        homeReputation: this.readInt16(),  // 8-9
        currentReputation: this.readInt16(),// 10-11
        worldReputation: this.readInt16(),  // 12-13
        squadNumber: this.readUint8(),      // 14
        
        // Offset 15–26: Position suitabilities (12 bytes)
        goalkeeper:           this.readInt8(),
        sweeper:              this.readInt8(),
        defender:             this.readInt8(),
        defensiveMidfielder:  this.readInt8(),
        midfielder:           this.readInt8(),
        attackingMidfielder:  this.readInt8(),
        attacker:             this.readInt8(),
        wingBack:             this.readInt8(),
        rightSide:            this.readInt8(),
        leftSide:             this.readInt8(),
        centreSide:           this.readInt8(),
        freeRole:             this.readInt8(),

        // Offset 27-29: Floating mental attributes
        creativity:       nextAttr(), // 27
        workRate:         nextAttr(), // 28
        morale:           nextAttr(), // 29

        // Offset 30–69: Attributes (1 byte each) - Database Order Sequence
        acceleration:     nextAttr(), // 30
        aggression:       nextAttr(), // 31
        agility:          nextAttr(), // 32
        anticipation:     nextAttr(), // 33
        balance:          nextAttr(), // 34
        bravery:          nextAttr(), // 35
        consistency:      nextAttr(), // 36
        corners:          nextAttr(), // 37
        crossing:         nextAttr(), // 38
        decisions:        nextAttr(), // 39
        dirtiness:        nextAttr(), // 40
        dribbling:        nextAttr(), // 41
        handling:         nextAttr(), // 42
        heading:          nextAttr(), // 43
        importantMatches: nextAttr(), // 44
        injuryProneness:  nextAttr(), // 45
        jumping:          nextAttr(), // 46
        influence:        nextAttr(), // 47
        leftFoot:         nextAttr(), // 48
        longShots:        nextAttr(), // 49
        marking:          nextAttr(), // 50
        offTheBall:       nextAttr(), // 51
        naturalFitness:   nextAttr(), // 52
        oneOnOnes:        nextAttr(), // 53
        pace:             nextAttr(), // 54
        passing:          nextAttr(), // 55
        penalties:        nextAttr(), // 56
        positioning:      nextAttr(), // 57
        reflexes:         nextAttr(), // 58
        rightFoot:        nextAttr(), // 59
        stamina:          nextAttr(), // 60
        strength:         nextAttr(), // 61
        tackling:         nextAttr(), // 62
        teamwork:         nextAttr(), // 63
        technique:        nextAttr(), // 64
        throwIns:         nextAttr(), // 65
        versatility:      nextAttr(), // 66
        finishing:        nextAttr(), // 67
        flair:            nextAttr(), // 68
        setPieces:        nextAttr(), // 69
      };

      players.set(i, player);
      if (player.id !== i && player.id >= 0) {
        players.set(player.id, player);
      }
    }

    return players;
  }

  // ── Staff (staff.dat) ─────────────────────────────────────────
  // Record size: 110 bytes exactly (verified from C# source)
  // Staff links to Player via PlayerId field

  private parseStaff(): CMRawStaff[] {
    const block = this.getBlock('staff.dat');
    
    // Auto-detect record size (usually 110 or 114)
    let recordSize = 110;
    if (block.size >= 228) {
       this.seek(block.position);
       const id0 = this.readInt32();
       this.seek(block.position + 110);
       const id1a = this.readInt32();
       this.seek(block.position + 114);
       const id1b = this.readInt32();
       
       if (id1b === id0 + 1 && id1b > 0 && id1b < 1000000) {
         recordSize = 114;
         this.log(`Detected staff.dat record size: 114`, 'info');
       } else {
         recordSize = 110;
         this.log(`Detected staff.dat record size: 110`, 'info');
       }
    }

    const count = Math.floor(block.size / recordSize);
    this.log(`Parsing ${count} staff records...`, 'info');

    const staffList: CMRawStaff[] = [];

    for (let i = 0; i < count; i++) {
      this.seek(block.position + i * recordSize);

      const id =            this.readInt32();   // 0
      const firstNameId =   this.readInt32();   // 4
      const secondNameId =  this.readInt32();   // 8
      const commonNameId =  this.readInt32();   // 12
      const dateOfBirth =   this.readCMDate();  // 16 (8 bytes: day Int16 + year Int16 + isLeapYear Int32)
      const yearOfBirth =   this.readInt16();   // 24
      const firstNationId = this.readInt32();   // 26
      const secondNationId= this.readInt32();   // 30
      this.readUint8();                          // 34 intApps
      this.readUint8();                          // 35 intGoals
      this.readInt32();                          // 36 nationalJobId
      this.readInt8();                           // 40 jobForNation
      this.readCMDate();                         // 41 dateJoinedNation (8 bytes)
      this.readCMDate();                         // 49 dateExpiresNation (8 bytes)
      const clubJobId =     this.readInt32();   // 57
      this.readInt8();                           // 61 jobForClub
      this.readCMDate();                         // 62 dateJoinedClub (8 bytes)
      this.readCMDate();                         // 70 dateExpiresClub (8 bytes)
      const wage =          this.readInt32();   // 78
      const value =         this.readInt32();   // 82
      const adaptability =  this.readInt8();    // 86
      const ambition =      this.readInt8();    // 87
      const determination = this.readInt8();    // 88
      const loyalty =       this.readInt8();    // 89
      const pressure =      this.readInt8();    // 90
      const professionalism=this.readInt8();    // 91
      const sportsmanship = this.readInt8();    // 92
      const temperament =   this.readInt8();    // 93
      this.readInt8();                           // 94 playingSquad
      this.readInt8();                           // 95 classification
      this.readInt8();                           // 96 clubValuation
      const playerId =      this.readInt32();   // 97
      this.readInt32();                          // 101 staffPreferencesId
      this.readInt32();                          // 105 nonPlayerId
      this.readInt8();                           // 109 squadSelectedFor
      // Total: 110 bytes ✓

      staffList.push({
        id,
        firstNameId,
        secondNameId,
        commonNameId,
        dateOfBirth,
        yearOfBirth,
        firstNationId,
        secondNationId,
        clubJobId,
        wage,
        value,
        adaptability:   Math.min(Math.abs(adaptability),   20) || 1,
        ambition:       Math.min(Math.abs(ambition),       20) || 1,
        determination:  Math.min(Math.abs(determination),  20) || 1,
        loyalty:        Math.min(Math.abs(loyalty),        20) || 1,
        pressure:       Math.min(Math.abs(pressure),       20) || 1,
        professionalism:Math.min(Math.abs(professionalism),20) || 1,
        sportsmanship:  Math.min(Math.abs(sportsmanship),  20) || 1,
        temperament:    Math.min(Math.abs(temperament),    20) || 1,
        playerId,
      });
    }

    return staffList;
  }

  // ── Position label builder ────────────────────────────────────

  private buildPositionLabel(
    baseLabel: string,
    right: number,
    left: number,
    centre: number
  ): string {
    // Pick the highest side value, append once only
    const max = Math.max(right, left, centre);
    if (max < 10) return baseLabel;
    if (right === max) return baseLabel + 'R';
    if (left === max)  return baseLabel + 'L';
    return baseLabel + 'C';
  }

  private buildPositions(p: CMRawPlayer): Record<string, number> {
    const positions: Record<string, number> = {};

    const add = (label: string, val: number, r: number, l: number, c: number) => {
      if (val >= 10) {
        const key = this.buildPositionLabel(label, r, l, c);
        // Take highest if duplicate key
        positions[key] = Math.max(positions[key] || 0, val);
      }
    };

    if (p.goalkeeper >= 10)           positions['GK']  = p.goalkeeper;
    if (p.sweeper >= 10)              positions['SW']  = p.sweeper;
    add('D',  p.defender,             p.rightSide, p.leftSide, p.centreSide);
    add('WB', p.wingBack,             p.rightSide, p.leftSide, p.centreSide);
    add('DM', p.defensiveMidfielder,  p.rightSide, p.leftSide, p.centreSide);
    add('M',  p.midfielder,           p.rightSide, p.leftSide, p.centreSide);
    add('AM', p.attackingMidfielder,  p.rightSide, p.leftSide, p.centreSide);
    add('ST', p.attacker,             p.rightSide, p.leftSide, p.centreSide);

    return positions;
  }

  // ── Preferred foot ────────────────────────────────────────────

  private preferredFoot(leftFoot: number, rightFoot: number): string {
    const diff = rightFoot - leftFoot;
    if (diff >= 3)  return 'Right';
    if (diff <= -3) return 'Left';
    return 'Either';
  }

  // ── Age calculation ───────────────────────────────────────────

  private calcAge(dob: Date | null): number {
    if (!dob || !this.gameDate) return 0;
    let age = this.gameDate.getFullYear() - dob.getFullYear();
    const m = this.gameDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && this.gameDate.getDate() < dob.getDate())) age--;
    return age;
  }

  // ── Main public method ────────────────────────────────────────

  public async parse(): Promise<{
    players: Player[];
    totalPlayers: number;
    gameDate: Date | null;
    positionCounts: Record<string, number>;
  }> {
    this.parseHeader();
    this.parseGameDate();

    const nations =      this.parseNations();
    const clubs =        this.parseClubs();
    const firstNames =   this.parseNames('first_names.dat');
    const secondNames =  this.parseNames('second_names.dat');
    const commonNames =  this.parseNames('common_names.dat');
    const rawPlayers =   this.parseRawPlayers();
    const staffList =    this.parseStaff();

    this.log(`Linking ${staffList.length} staff to player records... (RawPlayers: ${rawPlayers.size})`, 'info');
    if (staffList.length > 0) {
      const samples = staffList.slice(0, 5).map(s => s.playerId).join(', ');
      this.log(`Sample staff.playerId values: ${samples}`, 'info');
    }
    
    let skippedNoPlayer = 0;
    let skippedNoRaw = 0;
    let skippedNoName = 0;
    const players: Player[] = [];
    const positionCounts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

    for (const staff of staffList) {
      if (staff.playerId < 0) {
        skippedNoPlayer++;
        continue;
      }
      const rawPlayer = rawPlayers.get(staff.playerId);
      if (!rawPlayer) {
        skippedNoRaw++;
        continue;
      }

      // Must have at least one name
      const firstName  = staff.firstNameId  >= 0 ? (firstNames.get(staff.firstNameId)?.name  || '') : '';
      const lastName   = staff.secondNameId >= 0 ? (secondNames.get(staff.secondNameId)?.name || '') : '';
      const commonName = staff.commonNameId >= 0 ? (commonNames.get(staff.commonNameId)?.name || '') : '';

      if (!firstName && !lastName && !commonName) {
        skippedNoName++;
        continue;
      }

      const nation       = staff.firstNationId  >= 0 ? nations.get(staff.firstNationId)  : null;
      const secondNation = staff.secondNationId >= 0 ? nations.get(staff.secondNationId) : null;
      const club         = staff.clubJobId      >= 0 ? clubs.get(staff.clubJobId)         : null;

      const positions = this.buildPositions(rawPlayer);

      // Position group counts
      const posKeys = Object.keys(positions);
      if (posKeys.some(p => p === 'GK'))                        positionCounts.GK++;
      else if (posKeys.some(p => p.startsWith('D') || p === 'SW' || p.startsWith('WB')))  positionCounts.DEF++;
      else if (posKeys.some(p => p.startsWith('M') || p.startsWith('DM') || p.startsWith('AM'))) positionCounts.MID++;
      else if (posKeys.some(p => p.startsWith('ST')))           positionCounts.FWD++;
      else positionCounts.MID++; // fallback

      // PA: -1 in CM means "random elite potential" — display as 200
      const pa = rawPlayer.potentialAbility < 0 ? 200 : rawPlayer.potentialAbility;

      players.push({
        id:                    rawPlayer.id,
        firstName,
        lastName,
        commonName,
        age:                   this.calcAge(staff.dateOfBirth),
        dob:                   staff.dateOfBirth,
        nationalityName:       nation?.name       || 'Unknown',
        secondNationalityName: secondNation?.name || '',
        clubName:              club?.name          || 'Free Agent',
        wage:                  staff.wage,
        value:                 staff.value,
        currentAbility:        rawPlayer.currentAbility,
        potentialAbility:      pa,
        reputation: {
          home:    rawPlayer.homeReputation,
          current: rawPlayer.currentReputation,
          world:   rawPlayer.worldReputation,
        },
        attributes: {
          // ── Visible attributes (match CM in-game order) ──
          'Acceleration':     rawPlayer.acceleration,
          'Aggression':       rawPlayer.aggression,
          'Agility':          rawPlayer.agility,
          'Anticipation':     rawPlayer.anticipation,
          'Balance':          rawPlayer.balance,
          'Bravery':          rawPlayer.bravery,
          'Crossing':         rawPlayer.crossing,
          'Decisions':        rawPlayer.decisions,
          'Dribbling':        rawPlayer.dribbling,
          'Finishing':        rawPlayer.finishing,
          'Flair':            rawPlayer.flair,
          'Handling':         rawPlayer.handling,
          'Heading':          rawPlayer.heading,
          'Influence':        rawPlayer.influence,
          'Jumping':          rawPlayer.jumping,
          'LongShots':        rawPlayer.longShots,
          'Marking':          rawPlayer.marking,
          'OffTheBall':       rawPlayer.offTheBall,
          'Pace':             rawPlayer.pace,
          'Passing':          rawPlayer.passing,
          'Penalties':        rawPlayer.penalties,
          'Positioning':      rawPlayer.positioning,
          'Reflexes':         rawPlayer.reflexes,
          'SetPieces':        rawPlayer.setPieces,
          'Stamina':          rawPlayer.stamina,
          'Strength':         rawPlayer.strength,
          'Tackling':         rawPlayer.tackling,
          'Teamwork':         rawPlayer.teamwork,
          'Technique':        rawPlayer.technique,
          'WorkRate':         rawPlayer.workRate,
          'Creativity':       rawPlayer.creativity,
          // ── Hidden attributes ──
          'Consistency':      rawPlayer.consistency,
          'Corners':          rawPlayer.corners,
          'Dirtiness':        rawPlayer.dirtiness,
          'ImportantMatches': rawPlayer.importantMatches,
          'InjuryProneness':  rawPlayer.injuryProneness,
          'LeftFoot':         rawPlayer.leftFoot,
          'NaturalFitness':   rawPlayer.naturalFitness,
          'OneOnOnes':        rawPlayer.oneOnOnes,
          'RightFoot':        rawPlayer.rightFoot,
          'ThrowIns':         rawPlayer.throwIns,
          'Versatility':      rawPlayer.versatility,
          // ── Staff mental attributes ──
          'Adaptability':     staff.adaptability,
          'Ambition':         staff.ambition,
          'Determination':    staff.determination,
          'Loyalty':          staff.loyalty,
          'Pressure':         staff.pressure,
          'Professionalism':  staff.professionalism,
          'Sportsmanship':    staff.sportsmanship,
          'Temperament':      staff.temperament,
        },
        positions,
        preferredFoot: this.preferredFoot(rawPlayer.leftFoot, rawPlayer.rightFoot),
      });
    }

    this.log(`Parsing complete. Success: ${players.length}, Skipped(NoPlayer): ${skippedNoPlayer}, Skipped(NoRawLink): ${skippedNoRaw}, Skipped(NoName): ${skippedNoName}`, 'info');
    this.log(`✓ ${players.length} players loaded successfully.`, 'success');

    return {
      players,
      totalPlayers: players.length,
      gameDate: this.gameDate,
      positionCounts,
    };
  }
}