// ============================================================
// CM0102Parser.ts
// Ported from CMScoutIntrinsic C# Source (DataService.cs)
// Corrected attribute byte order and CA18 conversion logic.
// ============================================================

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
  divisionName: string;
  wage: number;
  value: number;
  currentAbility: number;
  potentialAbility: number;
  reputation: {
    home: number;
    current: number;
    world: number;
  };
  /** In-game visible attribute values (CA-scaled for isCA18 attrs). */
  attributes: Record<string, number>;
  /** Raw intrinsic values straight from the save file (-128..128). */
  intrinsicAttributes: Record<string, number>;
  positions: Record<string, number>;
  preferredFoot: string;
}

export interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  commonName: string;
  dob: Date | null;
  nationality: string;
  clubName: string;
  job: string;
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

export interface Club {
  id: number;
  name: string;
  nationName: string;
  divisionName: string;
  cash: number;
  reputation: number;
  training: number;
  stadiumName: string;
  attendance: number;
}

// ── Compression-Aware Binary Reader ───────────────────────────

class CMBinaryReader {
  private view: DataView;
  private buffer: ArrayBuffer;
  private pos: number = 0;
  private isCompressed: boolean;
  private rleRunCount: number = 0;
  private rleByte: number = 0;

  constructor(buffer: ArrayBuffer, isCompressed: boolean) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.isCompressed = isCompressed;
  }

  public seek(offset: number): void {
    this.pos = offset;
    this.rleRunCount = 0;
    this.rleByte = 0;
  }

  public readByte(): number {
    if (!this.isCompressed) {
      if (this.pos >= this.buffer.byteLength) return 0;
      return this.view.getUint8(this.pos++);
    }
    if (this.rleRunCount > 0) {
      this.rleRunCount--;
      return this.rleByte;
    }
    if (this.pos >= this.buffer.byteLength) return 0;
    const b = this.view.getUint8(this.pos++);
    if (b <= 128) return b;
    this.rleRunCount = (b - 128) - 1;
    this.rleByte = this.view.getUint8(this.pos++);
    return this.rleByte;
  }

  public readSByte(): number {
    const b = this.readByte();
    return b > 127 ? b - 256 : b;
  }

  public readInt16(): number {
    const b1 = this.readByte();
    const b2 = this.readByte();
    const val = b1 | (b2 << 8);
    return val > 32767 ? val - 65536 : val;
  }

  public readInt32(): number {
    const b1 = this.readByte();
    const b2 = this.readByte();
    const b3 = this.readByte();
    const b4 = this.readByte();
    return (b1 | (b2 << 8) | (b3 << 16) | (b4 << 24)) | 0;
  }

  public readFloat64(): number {
    const buf = new Uint8Array(8);
    for (let i = 0; i < 8; i++) buf[i] = this.readByte();
    return new DataView(buf.buffer).getFloat64(0, true);
  }

  public readString(len: number): string {
    const buf = new Uint8Array(len);
    for (let i = 0; i < len; i++) buf[i] = this.readByte();
    let end = buf.indexOf(0);
    if (end === -1) end = len;
    try {
      return new TextDecoder('windows-1252').decode(buf.slice(0, end));
    } catch {
      return new TextDecoder('iso-8859-1').decode(buf.slice(0, end));
    }
  }

  public skip(count: number): void {
    for (let i = 0; i < count; i++) this.readByte();
  }
}

// ── CA18 Attribute Definitions (ported from DataService.Attributes[]) ─────
//
// isCA18       – attribute is scaled with HighConvert/LowConvert using CA.
// isLessBetter – lower value is better (InjuryProneness, Dirtiness).
// gkConvert    – how GK/outfield split is applied:
//   'alwaysHigh' – HighConvert regardless of position
//   'gkLow'      – GK gets LowConvert, outfield gets HighConvert
//   'gkHigh'     – GK gets HighConvert, outfield gets LowConvert
export interface AttrDef {
  isCA18: boolean;
  isLessBetter: boolean;
  gkConvert: 'alwaysHigh' | 'gkLow' | 'gkHigh';
}

export const ATTR_DEFS: Record<string, AttrDef> = {
  // ── CA18 = true ──────────────────────────────────────────────
  // Neutral / outfield-preferred (always HighConvert)
  'Anticipation':    { isCA18: true,  isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Decisions':       { isCA18: true,  isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Heading':         { isCA18: true,  isLessBetter: false, gkConvert: 'alwaysHigh' },
  'LongShots':       { isCA18: true,  isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Passing':         { isCA18: true,  isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Penalties':       { isCA18: true,  isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Positioning':     { isCA18: true,  isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Tackling':        { isCA18: true,  isLessBetter: false, gkConvert: 'alwaysHigh' },
  // Outfield prefers HighConvert; GK gets LowConvert
  'Creativity':      { isCA18: true,  isLessBetter: false, gkConvert: 'gkLow' },
  'Crossing':        { isCA18: true,  isLessBetter: false, gkConvert: 'gkLow' },
  'Dribbling':       { isCA18: true,  isLessBetter: false, gkConvert: 'gkLow' },
  'Finishing':       { isCA18: true,  isLessBetter: false, gkConvert: 'gkLow' },
  'Marking':         { isCA18: true,  isLessBetter: false, gkConvert: 'gkLow' },
  'OffTheBall':      { isCA18: true,  isLessBetter: false, gkConvert: 'gkLow' },
  'ThrowIns':        { isCA18: true,  isLessBetter: false, gkConvert: 'gkLow' },
  // GK-specific: GK gets HighConvert, outfield gets LowConvert
  'Handling':        { isCA18: true,  isLessBetter: false, gkConvert: 'gkHigh' },
  'OneOnOnes':       { isCA18: true,  isLessBetter: false, gkConvert: 'gkHigh' },
  'Reflexes':        { isCA18: true,  isLessBetter: false, gkConvert: 'gkHigh' },
  // ── CA18 = false (raw intrinsic, clamped 1-20) ───────────────
  'Acceleration':    { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Aggression':      { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Agility':         { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Balance':         { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Bravery':         { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Consistency':     { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Corners':         { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Dirtiness':       { isCA18: false, isLessBetter: true,  gkConvert: 'alwaysHigh' },
  'Flair':           { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'ImportantMatches':{ isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Influence':       { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'InjuryProneness': { isCA18: false, isLessBetter: true,  gkConvert: 'alwaysHigh' },
  'Jumping':         { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'LeftFoot':        { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'NaturalFitness':  { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Pace':            { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'RightFoot':       { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'SetPieces':       { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Stamina':         { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Strength':        { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Teamwork':        { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Technique':       { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Versatility':     { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'WorkRate':        { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  // Staff mental (non-CA18, from CMStaff record)
  'Adaptability':    { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Ambition':        { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Determination':   { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Loyalty':         { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Pressure':        { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Professionalism': { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Sportsmanship':   { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
  'Temperament':     { isCA18: false, isLessBetter: false, gkConvert: 'alwaysHigh' },
};

// ── Conversion Functions (ported from DataService.cs) ─────────

function highConvert(ca: number, val: number): number {
  const d = (val / 10.0) + (ca / 20.0) + 10;
  return Math.max(1, Math.min(20, Math.floor((d * d / 30.0) + (d / 3.0) + 0.5)));
}

function lowConvert(ca: number, val: number): number {
  const d = (val / 10.0) + (ca / 200.0) + 10;
  return Math.max(1, Math.min(20, Math.floor((d * d / 30.0) + (d / 3.0) + 0.5)));
}

function computeInGame(name: string, intrinsic: number, ca: number, isGK: boolean): number {
  const def = ATTR_DEFS[name];
  if (!def || !def.isCA18) {
    return Math.max(1, Math.min(20, Math.abs(intrinsic)));
  }
  const v = Math.abs(intrinsic);
  switch (def.gkConvert) {
    case 'alwaysHigh': return highConvert(ca, v);
    case 'gkLow':      return isGK ? lowConvert(ca, v) : highConvert(ca, v);
    case 'gkHigh':     return isGK ? highConvert(ca, v) : lowConvert(ca, v);
  }
}

// ── Parser Main Class ──────────────────────────────────────────

export class CM0102Parser {
  private buffer: ArrayBuffer;
  private log: (msg: string, type?: 'info' | 'success' | 'error') => void;
  private blocks: Map<string, { position: number; size: number }> = new Map();
  private gameDate: Date | null = null;
  private isCompressed: boolean = false;

  constructor(
    buffer: ArrayBuffer,
    logger?: (msg: string, type?: 'info' | 'success' | 'error') => void
  ) {
    this.buffer = buffer;
    this.log = logger || (() => {});
  }

  private readCMDate(reader: CMBinaryReader): Date | null {
    const day  = reader.readInt16();
    const year = reader.readInt16();
    reader.readInt32(); // isLeapYear
    if (day === 0 && year === 0) return null;
    const date = new Date(year, 0, 1);
    date.setDate(date.getDate() + day);
    return date;
  }

  public async parse(): Promise<{
    players: Player[];
    staff: Staff[];
    clubs: Club[];
    gameDate: Date | null;
    positionCounts: Record<string, number>;
  }> {
    const headerView = new DataView(this.buffer);
    this.isCompressed = headerView.getInt32(0, true) === 4;
    const numBlocks   = headerView.getInt32(8, true);

    // Block directory is never compressed — read with uncompressed reader
    for (let i = 0; i < numBlocks; i++) {
      const pos  = headerView.getInt32(12 + i * 268, true);
      const size = headerView.getInt32(16 + i * 268, true);
      const nameBytes = new Uint8Array(this.buffer, 20 + i * 268, 260);
      let end = nameBytes.indexOf(0);
      if (end === -1) end = 260;
      const name = new TextDecoder('windows-1252')
        .decode(nameBytes.slice(0, end))
        .toLowerCase()
        .split('\\')
        .pop() || '';
      this.blocks.set(name, { position: pos, size });
    }

    const r = new CMBinaryReader(this.buffer, this.isCompressed);

    // 1. Game date (general.dat)
    const genBlock = this.blocks.get('general.dat');
    if (genBlock) {
      r.seek(genBlock.position);
      r.skip(3944);
      this.gameDate = this.readCMDate(r);
      this.log(`Game date: ${this.gameDate?.toDateString()}`, 'success');
    }

    // 2. Reference data
    const nationsMap   = this.loadNations(r);
    const divisionsMap = this.loadDivisions(r);
    const clubsMap     = this.loadClubs(r, nationsMap, divisionsMap);
    const firstNames   = this.loadNames(r, 'first_names.dat');
    const secondNames  = this.loadNames(r, 'second_names.dat');
    const commonNames  = this.loadNames(r, 'common_names.dat');

    // 3. Raw player data
    const rawPlayerMap = this.loadRawPlayers(r);

    // 4. Staff records → build Player list
    const finalists: Player[]  = [];
    const staffList: Staff[]   = [];
    const positionCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

    const staffBlock = this.blocks.get('staff.dat');
    if (staffBlock) {
      const count = Math.floor(staffBlock.size / 110);
      this.log(`Linking ${count} staff records…`, 'info');

      for (let i = 0; i < count; i++) {
        r.seek(staffBlock.position + i * 110);

        const id       = r.readInt32();          // 4
        const fNameId  = r.readInt32();          // 4
        const sNameId  = r.readInt32();          // 4
        const cNameId  = r.readInt32();          // 4
        const dob      = this.readCMDate(r);     // 8  (CMDate)
        r.readInt16();                            // 2  YearOfBirth
        const fNationId = r.readInt32();         // 4
        const sNationId = r.readInt32();         // 4
        // IntApps(1) + IntGoals(1) + NationalJobId(4) + JobForNation(1)
        // + DateJoinedNation(8) + DateExpiresNation(8) = 23 bytes
        r.skip(23);
        const clubJobId = r.readInt32();         // 4
        // JobForClub(1) + DateJoinedClub(8) + DateExpiresClub(8) = 17 bytes
        r.skip(17);
        const wage  = r.readInt32();             // 4
        const value = r.readInt32();             // 4

        const adapt = r.readSByte();
        const amb   = r.readSByte();
        const det   = r.readSByte();
        const loy   = r.readSByte();
        const pre   = r.readSByte();
        const pro   = r.readSByte();
        const spo   = r.readSByte();
        const tem   = r.readSByte();

        r.skip(3); // PlayingSquad + Classification + ClubValuation
        const playerId = r.readInt32();
        // StaffPreferencesId(4) + NonPlayerId(4) + SquadSelectedFor(1) are after

        const fName = firstNames.get(fNameId)  || '';
        const sName = secondNames.get(sNameId) || '';
        const cName = commonNames.get(cNameId) || '';

        const age  = dob && this.gameDate
          ? this.gameDate.getFullYear() - dob.getFullYear()
          : 0;
        const club = clubsMap.get(clubJobId);

        if (playerId >= 0) {
          const rp = rawPlayerMap.get(playerId);
          if (rp) {
            const isGK = rp.gk > 14;
            const ca   = rp.ca;

            const attrs: Record<string, number>          = {};
            const intrinsicAttrs: Record<string, number> = {};

            for (const [attrName, intrinsic] of Object.entries(rp.namedAttrs) as [string, number][]) {
              intrinsicAttrs[attrName] = intrinsic;
              attrs[attrName]          = computeInGame(attrName, intrinsic, ca, isGK);
            }

            // Staff mentals (non-CA18, stored as abs values)
            const staffMentals: Record<string, number> = {
              Adaptability:    Math.abs(adapt),
              Ambition:        Math.abs(amb),
              Determination:   Math.abs(det),
              Loyalty:         Math.abs(loy),
              Pressure:        Math.abs(pre),
              Professionalism: Math.abs(pro),
              Sportsmanship:   Math.abs(spo),
              Temperament:     Math.abs(tem),
            };
            Object.assign(attrs, staffMentals);
            Object.assign(intrinsicAttrs, staffMentals);

            // Positions
            const pos: Record<string, number> = {};
            if (isGK)     { pos['GK'] = 20; positionCounts.GK++;  }
            if (rp.sw > 14) pos['SW'] = 20;
            if (rp.d  > 14) pos['D']  = 20;
            if (rp.dm > 14) pos['DM'] = 20;
            if (rp.m  > 14) pos['M']  = 20;
            if (rp.am > 14) pos['AM'] = 20;
            if (rp.at > 14) pos['AT'] = 20;
            if (rp.wb > 14) pos['WB'] = 20;

            if (!isGK) {
              if (rp.d > 14)                                      positionCounts.DEF++;
              else if (rp.m > 14 || rp.dm > 14 || rp.am > 14)   positionCounts.MID++;
              else if (rp.at > 14)                               positionCounts.FWD++;
            }

            finalists.push({
              id: id,
              firstName: fName, lastName: sName, commonName: cName,
              age, dob,
              nationalityName:       nationsMap.get(fNationId) || 'Unknown',
              secondNationalityName: nationsMap.get(sNationId) || '',
              clubName:     club?.name         || 'Free Agent',
              divisionName: club?.divisionName || '',
              wage, value,
              currentAbility:   ca,
              potentialAbility: rp.pa,
              reputation: { home: rp.hRep, current: rp.cRep, world: rp.wRep },
              attributes:          attrs,
              intrinsicAttributes: intrinsicAttrs,
              positions: pos,
              preferredFoot: rp.lf > rp.rf ? 'Left' : (rp.rf > rp.lf ? 'Right' : 'Either'),
            });
          }
        } else {
          staffList.push({
            id, firstName: fName, lastName: sName, commonName: cName,
            dob,
            nationality: nationsMap.get(fNationId) || 'Unknown',
            clubName:    club?.name || 'Unemployed',
            job:         'Staff',
            wage, value,
            adaptability:    Math.abs(adapt),
            ambition:        Math.abs(amb),
            determination:   Math.abs(det),
            loyalty:         Math.abs(loy),
            pressure:        Math.abs(pre),
            professionalism: Math.abs(pro),
            sportsmanship:   Math.abs(spo),
            temperament:     Math.abs(tem),
            playerId: -1,
          });
        }
      }
    }

    this.log(
      `Parsed ${finalists.length} players, ${staffList.length} staff, ${clubsMap.size} clubs.`,
      'success'
    );

    return {
      players: finalists,
      staff:   staffList,
      clubs:   Array.from(clubsMap.values()),
      gameDate: this.gameDate,
      positionCounts,
    };
  }

  // ── Private loaders ───────────────────────────────────────────

  private loadNames(reader: CMBinaryReader, file: string): Map<number, string> {
    const block = this.blocks.get(file);
    const map   = new Map<number, string>();
    if (!block) return map;
    // CMName record = 60 bytes: Name(51) + Id(4) + NationId(4) + Count(1)
    const count = Math.floor(block.size / 60);
    for (let i = 0; i < count; i++) {
      reader.seek(block.position + i * 60);
      const name = reader.readString(51);
      const id   = reader.readInt32();
      map.set(id, name);
    }
    return map;
  }

  private loadNations(reader: CMBinaryReader): Map<number, string> {
    const block = this.blocks.get('nation.dat');
    const map   = new Map<number, string>();
    if (!block) return map;
    // CMNation record = 290 bytes
    const count = Math.floor(block.size / 290);
    for (let i = 0; i < count; i++) {
      reader.seek(block.position + i * 290);
      const id   = reader.readInt32();
      const name = reader.readString(51);
      map.set(id, name);
    }
    return map;
  }

  private loadDivisions(reader: CMBinaryReader): Map<number, string> {
    const block = this.blocks.get('club_comp.dat');
    const map   = new Map<number, string>();
    if (!block) return map;
    // CMDivision record = 107 bytes
    // Id(4) + Name(51) + GenderName(1) + ShortName(26) + GenderShortName(1)
    // + Code(4) + Scope(1) + Selected(1) + ContinentId(4) + NationId(4)
    // + ForeColourId(4) + BackColourId(4) + Reputation(2) = 107
    const count = Math.floor(block.size / 107);
    for (let i = 0; i < count; i++) {
      reader.seek(block.position + i * 107);
      const id   = reader.readInt32();
      const name = reader.readString(51);
      map.set(id, name);
    }
    return map;
  }

  private loadClubs(
    reader: CMBinaryReader,
    nations: Map<number, string>,
    divisions: Map<number, string>
  ): Map<number, Club> {
    const block = this.blocks.get('club.dat');
    const map   = new Map<number, Club>();
    if (!block) return map;
    // CMClub record = 581 bytes
    const count = Math.floor(block.size / 581);
    for (let i = 0; i < count; i++) {
      reader.seek(block.position + i * 581);
      const id         = reader.readInt32();
      const name       = reader.readString(51);
      reader.skip(1);                  // GenderName
      reader.readString(26);           // ShortName (advance pointer)
      reader.skip(1);                  // GenderShortName
      const nationId   = reader.readInt32();
      const divisionId = reader.readInt32();
      reader.skip(4);                  // LastDivisionId
      reader.skip(1);                  // LastPosition
      reader.skip(4);                  // ReserveDivisionId
      reader.skip(1);                  // ProfessionalStatus
      const cash       = reader.readInt32();
      const stadiumId  = reader.readInt32();
      reader.skip(1);                  // OwnStadium
      reader.skip(4);                  // ReserveStadiumId
      reader.skip(1);                  // MatchDay
      const attendance = reader.readInt32();
      reader.skip(4);                  // MinAttendance
      reader.skip(4);                  // MaxAttendance
      const training   = reader.readSByte();
      const rep        = reader.readInt16();

      map.set(id, {
        id, name, cash,
        reputation:   rep,
        training:     Math.max(0, training),
        nationName:   nations.get(nationId)   || '',
        divisionName: divisions.get(divisionId) || '',
        stadiumName:  `Stadium ${stadiumId}`,
        attendance,
      });
    }
    return map;
  }

  private loadRawPlayers(reader: CMBinaryReader): Map<number, any> {
    const block = this.blocks.get('player.dat');
    const map   = new Map<number, any>();
    if (!block) return map;
    // CMPlayer record = 70 bytes (verified against C# struct)
    const count = Math.floor(block.size / 70);
    for (let i = 0; i < count; i++) {
      reader.seek(block.position + i * 70);

      const id  = reader.readInt32();  // 4
      reader.skip(1);                  // SquadNumber
      const ca  = reader.readInt16();  // 2
      const pa  = reader.readInt16();  // 2
      const hRep = reader.readInt16(); // 2
      const cRep = reader.readInt16(); // 2
      const wRep = reader.readInt16(); // 2  → 15 bytes total

      // 12 position bytes
      const gk = reader.readSByte(); // Goalkeeper
      const sw = reader.readSByte(); // Sweeper
      const d  = reader.readSByte(); // Defender
      const dm = reader.readSByte(); // DefensiveMidfielder
      const m  = reader.readSByte(); // Midfielder
      const am = reader.readSByte(); // AttackingMidfielder
      const at = reader.readSByte(); // Attacker
      const wb = reader.readSByte(); // WingBack
      const rs = reader.readSByte(); // RightSide
      const ls = reader.readSByte(); // LeftSide
      reader.skip(1);                // CentreSide
      reader.skip(1);                // FreeRole  → 27 bytes total

      // 43 attribute bytes in exact C# CMPlayer struct order:
      const namedAttrs: Record<string, number> = {
        Acceleration:    reader.readSByte(),
        Aggression:      reader.readSByte(),
        Agility:         reader.readSByte(),
        Anticipation:    reader.readSByte(),
        Balance:         reader.readSByte(),
        Bravery:         reader.readSByte(),
        Consistency:     reader.readSByte(),
        Corners:         reader.readSByte(),
        Crossing:        reader.readSByte(),
        Decisions:       reader.readSByte(),
        Dirtiness:       reader.readSByte(),
        Dribbling:       reader.readSByte(),
        Finishing:       reader.readSByte(),
        Flair:           reader.readSByte(),
        SetPieces:       reader.readSByte(),
        Handling:        reader.readSByte(),
        Heading:         reader.readSByte(),
        ImportantMatches:reader.readSByte(),
        InjuryProneness: reader.readSByte(),
        Jumping:         reader.readSByte(),
        Influence:       reader.readSByte(),
        LeftFoot:        reader.readSByte(),
        LongShots:       reader.readSByte(),
        Marking:         reader.readSByte(),
        OffTheBall:      reader.readSByte(),
        NaturalFitness:  reader.readSByte(),
        OneOnOnes:       reader.readSByte(),
        Pace:            reader.readSByte(),
        Passing:         reader.readSByte(),
        Penalties:       reader.readSByte(),
        Positioning:     reader.readSByte(),
        Reflexes:        reader.readSByte(),
        RightFoot:       reader.readSByte(),
        Stamina:         reader.readSByte(),
        Strength:        reader.readSByte(),
        Tackling:        reader.readSByte(),
        Teamwork:        reader.readSByte(),
        Technique:       reader.readSByte(),
        ThrowIns:        reader.readSByte(),
        Versatility:     reader.readSByte(),
        Creativity:      reader.readSByte(),
        WorkRate:        reader.readSByte(),
      };
      reader.readSByte(); // Morale — last byte, not exposed as a player attribute

      map.set(id, {
        id, ca, pa, hRep, cRep, wRep,
        gk, sw, d, dm, m, am, at, wb,
        rf: Math.abs(rs),
        lf: Math.abs(ls),
        namedAttrs,
      });
    }
    return map;
  }
}
