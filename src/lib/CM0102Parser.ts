// ============================================================
// CM0102Parser.ts
// Ported from CMScoutIntrinsic C# Source (DataService.cs)
// CA18 attributes use InMatchNormalized (the app's default view).
// Non-CA18 attributes show raw intrinsic values (1-20).
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
  attributes: Record<string, number>;
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

// ── Attribute metadata ──────────────────────────────────────────
export interface AttrDef {
  isCA18: boolean;
  isLessBetter: boolean;
}

export const ATTR_DEFS: Record<string, AttrDef> = {
  'Anticipation':    { isCA18: true,  isLessBetter: false },
  'Creativity':      { isCA18: true,  isLessBetter: false },
  'Crossing':        { isCA18: true,  isLessBetter: false },
  'Decisions':       { isCA18: true,  isLessBetter: false },
  'Dribbling':       { isCA18: true,  isLessBetter: false },
  'Finishing':       { isCA18: true,  isLessBetter: false },
  'Heading':         { isCA18: true,  isLessBetter: false },
  'LongShots':       { isCA18: true,  isLessBetter: false },
  'Marking':         { isCA18: true,  isLessBetter: false },
  'OffTheBall':      { isCA18: true,  isLessBetter: false },
  'Passing':         { isCA18: true,  isLessBetter: false },
  'Penalties':       { isCA18: true,  isLessBetter: false },
  'Positioning':     { isCA18: true,  isLessBetter: false },
  'Tackling':        { isCA18: true,  isLessBetter: false },
  'ThrowIns':        { isCA18: true,  isLessBetter: false },
  'Handling':        { isCA18: true,  isLessBetter: false },
  'OneOnOnes':       { isCA18: true,  isLessBetter: false },
  'Reflexes':        { isCA18: true,  isLessBetter: false },
  'Acceleration':    { isCA18: false, isLessBetter: false },
  'Agility':         { isCA18: false, isLessBetter: false },
  'Balance':         { isCA18: false, isLessBetter: false },
  'Jumping':         { isCA18: false, isLessBetter: false },
  'NaturalFitness':  { isCA18: false, isLessBetter: false },
  'Pace':            { isCA18: false, isLessBetter: false },
  'Stamina':         { isCA18: false, isLessBetter: false },
  'Strength':        { isCA18: false, isLessBetter: false },
  'Aggression':      { isCA18: false, isLessBetter: false },
  'Bravery':         { isCA18: false, isLessBetter: false },
  'Consistency':     { isCA18: false, isLessBetter: false },
  'Corners':         { isCA18: false, isLessBetter: false },
  'Dirtiness':       { isCA18: false, isLessBetter: true  },
  'Flair':           { isCA18: false, isLessBetter: false },
  'ImportantMatches':{ isCA18: false, isLessBetter: false },
  'Influence':       { isCA18: false, isLessBetter: false },
  'InjuryProneness': { isCA18: false, isLessBetter: true  },
  'LeftFoot':        { isCA18: false, isLessBetter: false },
  'RightFoot':       { isCA18: false, isLessBetter: false },
  'SetPieces':       { isCA18: false, isLessBetter: false },
  'Teamwork':        { isCA18: false, isLessBetter: false },
  'Technique':       { isCA18: false, isLessBetter: false },
  'Versatility':     { isCA18: false, isLessBetter: false },
  'WorkRate':        { isCA18: false, isLessBetter: false },
  'Adaptability':    { isCA18: false, isLessBetter: false },
  'Ambition':        { isCA18: false, isLessBetter: false },
  'Determination':   { isCA18: false, isLessBetter: false },
  'Loyalty':         { isCA18: false, isLessBetter: false },
  'Pressure':        { isCA18: false, isLessBetter: false },
  'Professionalism': { isCA18: false, isLessBetter: false },
  'Sportsmanship':   { isCA18: false, isLessBetter: false },
  'Temperament':     { isCA18: false, isLessBetter: false },
};

// CA18 attributes in the same order as DataService.Attributes[].
// gkOnly = true means the normalization range is built only from GK players.
const CA18_ATTRS: { name: string; gkOnly: boolean }[] = [
  { name: 'Anticipation', gkOnly: false },
  { name: 'Creativity',   gkOnly: false },
  { name: 'Crossing',     gkOnly: false },
  { name: 'Decisions',    gkOnly: false },
  { name: 'Dribbling',    gkOnly: false },
  { name: 'Finishing',    gkOnly: false },
  { name: 'Heading',      gkOnly: false },
  { name: 'LongShots',    gkOnly: false },
  { name: 'Marking',      gkOnly: false },
  { name: 'OffTheBall',   gkOnly: false },
  { name: 'Passing',      gkOnly: false },
  { name: 'Penalties',    gkOnly: false },
  { name: 'Positioning',  gkOnly: false },
  { name: 'Tackling',     gkOnly: false },
  { name: 'ThrowIns',     gkOnly: false },
  { name: 'Handling',     gkOnly: true  },
  { name: 'OneOnOnes',    gkOnly: true  },
  { name: 'Reflexes',     gkOnly: true  },
];

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
    if (this.rleRunCount > 0) { this.rleRunCount--; return this.rleByte; }
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
    const b1 = this.readByte(), b2 = this.readByte();
    const v = b1 | (b2 << 8);
    return v > 32767 ? v - 65536 : v;
  }

  public readInt32(): number {
    const b1 = this.readByte(), b2 = this.readByte(),
          b3 = this.readByte(), b4 = this.readByte();
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
    try { return new TextDecoder('windows-1252').decode(buf.slice(0, end)); }
    catch { return new TextDecoder('iso-8859-1').decode(buf.slice(0, end)); }
  }

  public skip(count: number): void {
    for (let i = 0; i < count; i++) this.readByte();
  }
}

// ── InMatchNormalized helpers (mirrors DataService.cs logic) ────

function getInMatch(intrinsic: number, ca: number): number {
  const r = intrinsic / 5.0 + ca / 20.0 + 10;
  return Math.trunc(Math.max(0, r));
}

function normalizeInMatch(inMatch: number, min: number, max: number): number {
  if (max <= min) return 10;
  const r = 20.0 * (inMatch - min) / (max - min) + 0.5;
  return Math.max(1, Math.min(20, Math.trunc(r)));
}

// ── Parser Main Class ──────────────────────────────────────────

export class CM0102Parser {
  private buffer: ArrayBuffer;
  private log: (msg: string, type?: 'info' | 'success' | 'error') => void;
  private blocks: Map<string, { position: number; size: number }> = new Map();
  private gameDate: Date | null = null;
  private isCompressed = false;

  constructor(
    buffer: ArrayBuffer,
    logger?: (msg: string, type?: 'info' | 'success' | 'error') => void
  ) {
    this.buffer = buffer;
    this.log = logger || (() => {});
  }

  private readCMDate(r: CMBinaryReader): Date | null {
    const day = r.readInt16(), year = r.readInt16();
    r.readInt32(); // isLeapYear
    if (day === 0 && year === 0) return null;
    const d = new Date(year, 0, 1);
    d.setDate(d.getDate() + day);
    return d;
  }

  public async parse(): Promise<{
    players: Player[];
    staff: Staff[];
    clubs: Club[];
    gameDate: Date | null;
    positionCounts: Record<string, number>;
  }> {
    const hv = new DataView(this.buffer);
    this.isCompressed = hv.getInt32(0, true) === 4;
    const numBlocks   = hv.getInt32(8, true);

    for (let i = 0; i < numBlocks; i++) {
      const pos  = hv.getInt32(12 + i * 268, true);
      const size = hv.getInt32(16 + i * 268, true);
      const nb = new Uint8Array(this.buffer, 20 + i * 268, 260);
      let end = nb.indexOf(0);
      if (end === -1) end = 260;
      const name = new TextDecoder('windows-1252')
        .decode(nb.slice(0, end)).toLowerCase().split('\\').pop() || '';
      this.blocks.set(name, { position: pos, size });
    }

    const r = new CMBinaryReader(this.buffer, this.isCompressed);

    const genBlock = this.blocks.get('general.dat');
    if (genBlock) {
      r.seek(genBlock.position);
      r.skip(3944);
      this.gameDate = this.readCMDate(r);
      this.log(`Game date: ${this.gameDate?.toDateString()}`, 'success');
    }

    const nationsMap   = this.loadNations(r);
    const divisionsMap = this.loadDivisions(r);
    const clubsMap     = this.loadClubs(r, nationsMap, divisionsMap);
    const firstNames   = this.loadNames(r, 'first_names.dat');
    const secondNames  = this.loadNames(r, 'second_names.dat');
    const commonNames  = this.loadNames(r, 'common_names.dat');
    const rawPlayerMap = this.loadRawPlayers(r);

    // ── Pass 1: compute inMatch min/max for each CA18 attribute ──
    // Mirrors C# first pass in DataService.cs.
    // For GK-specific attrs (Handling/OneOnOnes/Reflexes), only GK
    // players contribute to the normalization range.
    const inMatchRanges = new Map<string, { min: number; max: number }>();
    for (const { name } of CA18_ATTRS) {
      inMatchRanges.set(name, { min: 127, max: -128 });
    }

    for (const rp of rawPlayerMap.values()) {
      if (rp.ca <= 0) continue; // skip placeholder entries
      const isGK = rp.gk > 14;
      for (const { name, gkOnly } of CA18_ATTRS) {
        if (gkOnly && !isGK) continue;
        const intrinsic = rp.namedAttrs[name] ?? 0;
        const im = getInMatch(intrinsic, rp.ca);
        const rng = inMatchRanges.get(name)!;
        if (im < rng.min) rng.min = im;
        if (im > rng.max) rng.max = im;
      }
    }
    this.log('CA18 ranges computed.', 'info');

    // ── Pass 2: build player objects ──────────────────────────────
    const finalists: Player[] = [];
    const staffList: Staff[]  = [];
    const positionCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

    const staffBlock = this.blocks.get('staff.dat');
    if (staffBlock) {
      const count = Math.floor(staffBlock.size / 110);
      this.log(`Linking ${count} staff records…`, 'info');

      for (let i = 0; i < count; i++) {
        r.seek(staffBlock.position + i * 110);

        const id        = r.readInt32();
        const fNameId   = r.readInt32();
        const sNameId   = r.readInt32();
        const cNameId   = r.readInt32();
        const dob       = this.readCMDate(r);
        r.readInt16();                         // YearOfBirth
        const fNationId = r.readInt32();
        const sNationId = r.readInt32();
        // IntApps(1)+IntGoals(1)+NationalJobId(4)+JobForNation(1)+DateJoinedNation(8)+DateExpiresNation(8) = 23
        r.skip(23);
        const clubJobId = r.readInt32();
        // JobForClub(1)+DateJoinedClub(8)+DateExpiresClub(8) = 17
        r.skip(17);
        const wage  = r.readInt32();
        const value = r.readInt32();

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
            const attrs: Record<string, number> = {};

            for (const [k, v] of Object.entries(rp.namedAttrs) as [string, number][]) {
              const def = ATTR_DEFS[k];
              if (def?.isCA18) {
                // InMatchNormalized — mirrors CMScoutIntrinsic default mode
                const im  = getInMatch(v, rp.ca);
                const rng = inMatchRanges.get(k)!;
                attrs[k] = normalizeInMatch(im, rng.min, rng.max);
              } else {
                // Non-CA18: raw value clamped 1-20
                attrs[k] = Math.max(1, Math.min(20, v < 0 ? 1 : v));
              }
            }

            // Staff mentals from staff.dat (1-20, no conversion needed)
            attrs['Adaptability']    = Math.max(1, Math.min(20, Math.abs(adapt)));
            attrs['Ambition']        = Math.max(1, Math.min(20, Math.abs(amb)));
            attrs['Determination']   = Math.max(1, Math.min(20, Math.abs(det)));
            attrs['Loyalty']         = Math.max(1, Math.min(20, Math.abs(loy)));
            attrs['Pressure']        = Math.max(1, Math.min(20, Math.abs(pre)));
            attrs['Professionalism'] = Math.max(1, Math.min(20, Math.abs(pro)));
            attrs['Sportsmanship']   = Math.max(1, Math.min(20, Math.abs(spo)));
            attrs['Temperament']     = Math.max(1, Math.min(20, Math.abs(tem)));

            const pos: Record<string, number> = {};
            if (isGK)       { pos['GK'] = 20; positionCounts.GK++;  }
            if (rp.sw > 14) pos['SW'] = 20;
            if (rp.d  > 14) pos['D']  = 20;
            if (rp.dm > 14) pos['DM'] = 20;
            if (rp.m  > 14) pos['M']  = 20;
            if (rp.am > 14) pos['AM'] = 20;
            if (rp.at > 14) pos['AT'] = 20;
            if (rp.wb > 14) pos['WB'] = 20;

            if (!isGK) {
              if (rp.d > 14)                                    positionCounts.DEF++;
              else if (rp.m > 14 || rp.dm > 14 || rp.am > 14) positionCounts.MID++;
              else if (rp.at > 14)                             positionCounts.FWD++;
            }

            const lf = attrs['LeftFoot']  || 1;
            const rf = attrs['RightFoot'] || 1;

            finalists.push({
              id,
              firstName: fName, lastName: sName, commonName: cName,
              age, dob,
              nationalityName:       nationsMap.get(fNationId) || 'Unknown',
              secondNationalityName: nationsMap.get(sNationId) || '',
              clubName:     club?.name         || 'Free Agent',
              divisionName: club?.divisionName || '',
              wage, value,
              currentAbility:   rp.ca,
              potentialAbility: rp.pa,
              reputation: { home: rp.hRep, current: rp.cRep, world: rp.wRep },
              attributes: attrs,
              positions:  pos,
              preferredFoot: lf > rf ? 'Left' : (rf > lf ? 'Right' : 'Either'),
            });
          }
        } else {
          staffList.push({
            id, firstName: fName, lastName: sName, commonName: cName,
            dob,
            nationality: nationsMap.get(fNationId) || 'Unknown',
            clubName:    club?.name || 'Unemployed',
            job: 'Staff', wage, value,
            adaptability:    Math.max(1, Math.min(20, Math.abs(adapt))),
            ambition:        Math.max(1, Math.min(20, Math.abs(amb))),
            determination:   Math.max(1, Math.min(20, Math.abs(det))),
            loyalty:         Math.max(1, Math.min(20, Math.abs(loy))),
            pressure:        Math.max(1, Math.min(20, Math.abs(pre))),
            professionalism: Math.max(1, Math.min(20, Math.abs(pro))),
            sportsmanship:   Math.max(1, Math.min(20, Math.abs(spo))),
            temperament:     Math.max(1, Math.min(20, Math.abs(tem))),
            playerId: -1,
          });
        }
      }
    }

    this.log(`Parsed ${finalists.length} players, ${staffList.length} staff, ${clubsMap.size} clubs.`, 'success');
    return { players: finalists, staff: staffList, clubs: Array.from(clubsMap.values()), gameDate: this.gameDate, positionCounts };
  }

  // ── Private loaders ───────────────────────────────────────────

  private loadNames(r: CMBinaryReader, file: string): Map<number, string> {
    const block = this.blocks.get(file);
    const map   = new Map<number, string>();
    if (!block) return map;
    const count = Math.floor(block.size / 60);
    for (let i = 0; i < count; i++) {
      r.seek(block.position + i * 60);
      const name = r.readString(51);
      const id   = r.readInt32();
      map.set(id, name);
    }
    return map;
  }

  private loadNations(r: CMBinaryReader): Map<number, string> {
    const block = this.blocks.get('nation.dat');
    const map   = new Map<number, string>();
    if (!block) return map;
    const count = Math.floor(block.size / 290);
    for (let i = 0; i < count; i++) {
      r.seek(block.position + i * 290);
      const id   = r.readInt32();
      const name = r.readString(51);
      map.set(id, name);
    }
    return map;
  }

  private loadDivisions(r: CMBinaryReader): Map<number, string> {
    const block = this.blocks.get('club_comp.dat');
    const map   = new Map<number, string>();
    if (!block) return map;
    const count = Math.floor(block.size / 107);
    for (let i = 0; i < count; i++) {
      r.seek(block.position + i * 107);
      const id   = r.readInt32();
      const name = r.readString(51);
      map.set(id, name);
    }
    return map;
  }

  private loadClubs(
    r: CMBinaryReader,
    nations: Map<number, string>,
    divisions: Map<number, string>
  ): Map<number, Club> {
    const block = this.blocks.get('club.dat');
    const map   = new Map<number, Club>();
    if (!block) return map;
    const count = Math.floor(block.size / 581);
    for (let i = 0; i < count; i++) {
      r.seek(block.position + i * 581);
      const id         = r.readInt32();
      const name       = r.readString(51);
      r.skip(1);
      r.readString(26);
      r.skip(1);
      const nationId   = r.readInt32();
      const divisionId = r.readInt32();
      r.skip(4); r.skip(1); r.skip(4); r.skip(1);
      const cash       = r.readInt32();
      const stadiumId  = r.readInt32();
      r.skip(1); r.skip(4); r.skip(1);
      const attendance = r.readInt32();
      r.skip(4); r.skip(4);
      const training   = r.readSByte();
      const rep        = r.readInt16();
      map.set(id, {
        id, name, cash,
        reputation:   rep,
        training:     Math.max(0, training),
        nationName:   nations.get(nationId)     || '',
        divisionName: divisions.get(divisionId) || '',
        stadiumName:  `Stadium ${stadiumId}`,
        attendance,
      });
    }
    return map;
  }

  private loadRawPlayers(r: CMBinaryReader): Map<number, any> {
    const block = this.blocks.get('player.dat');
    const map   = new Map<number, any>();
    if (!block) return map;
    const count = Math.floor(block.size / 70);
    for (let i = 0; i < count; i++) {
      r.seek(block.position + i * 70);

      const id   = r.readInt32();
      r.skip(1);                  // SquadNumber
      const ca   = r.readInt16();
      const pa   = r.readInt16();
      const hRep = r.readInt16();
      const cRep = r.readInt16();
      const wRep = r.readInt16(); // 15 bytes total

      const gk = r.readSByte(); const sw = r.readSByte();
      const d  = r.readSByte(); const dm = r.readSByte();
      const m  = r.readSByte(); const am = r.readSByte();
      const at = r.readSByte(); const wb = r.readSByte();
      r.skip(1); r.skip(1); r.skip(1); r.skip(1); // RightSide/LeftSide/CentreSide/FreeRole

      // 43 attribute bytes — exact C# CMPlayer struct order
      const namedAttrs: Record<string, number> = {
        Acceleration:    r.readSByte(),
        Aggression:      r.readSByte(),
        Agility:         r.readSByte(),
        Anticipation:    r.readSByte(),
        Balance:         r.readSByte(),
        Bravery:         r.readSByte(),
        Consistency:     r.readSByte(),
        Corners:         r.readSByte(),
        Crossing:        r.readSByte(),
        Decisions:       r.readSByte(),
        Dirtiness:       r.readSByte(),
        Dribbling:       r.readSByte(),
        Finishing:       r.readSByte(),
        Flair:           r.readSByte(),
        SetPieces:       r.readSByte(),
        Handling:        r.readSByte(),
        Heading:         r.readSByte(),
        ImportantMatches:r.readSByte(),
        InjuryProneness: r.readSByte(),
        Jumping:         r.readSByte(),
        Influence:       r.readSByte(),
        LeftFoot:        r.readSByte(),
        LongShots:       r.readSByte(),
        Marking:         r.readSByte(),
        OffTheBall:      r.readSByte(),
        NaturalFitness:  r.readSByte(),
        OneOnOnes:       r.readSByte(),
        Pace:            r.readSByte(),
        Passing:         r.readSByte(),
        Penalties:       r.readSByte(),
        Positioning:     r.readSByte(),
        Reflexes:        r.readSByte(),
        RightFoot:       r.readSByte(),
        Stamina:         r.readSByte(),
        Strength:        r.readSByte(),
        Tackling:        r.readSByte(),
        Teamwork:        r.readSByte(),
        Technique:       r.readSByte(),
        ThrowIns:        r.readSByte(),
        Versatility:     r.readSByte(),
        Creativity:      r.readSByte(),
        WorkRate:        r.readSByte(),
      };
      r.readSByte(); // Morale

      map.set(id, { id, ca, pa, hRep, cRep, wRep, gk, sw, d, dm, m, am, at, wb, namedAttrs });
    }
    return map;
  }
}
