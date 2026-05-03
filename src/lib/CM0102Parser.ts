// ============================================================
// CM0102Parser.ts
// Ported from CMScoutIntrinsic C# Source
// Verified decompression and attribute mapping logic.
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

  // RLE state
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

    if (b <= 128) {
      return b;
    } else {
      this.rleRunCount = (b - 128) - 1;
      this.rleByte = this.view.getUint8(this.pos++);
      return this.rleByte;
    }
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

// ── Parser Main Class ──────────────────────────────────────────

export class CM0102Parser {
  private buffer: ArrayBuffer;
  private log: (msg: string, type?: 'info' | 'success' | 'error') => void;
  private blocks: Map<string, { position: number; size: number }> = new Map();
  private gameDate: Date | null = null;
  private isCompressed: boolean = false;

  constructor(buffer: ArrayBuffer, logger?: (msg: string, type?: 'info' | 'success' | 'error') => void) {
    this.buffer = buffer;
    this.log = logger || (() => {});
  }

  private readCMDate(reader: CMBinaryReader): Date | null {
    const day = reader.readInt16();
    const year = reader.readInt16();
    reader.readInt32(); // isLeapYear
    if (day === 0 && year === 0) return null;
    const date = new Date(year, 0, 1);
    date.setDate(date.getDate() + day);
    return date;
  }

  private highConvert(ca: number, val: number): number {
    const d = (val / 10.0) + (ca / 20.0) + 10;
    let r = Math.floor((d * d / 30.0) + (d / 3.0) + 0.5);
    return Math.max(1, Math.min(20, r));
  }

  private lowConvert(ca: number, val: number): number {
    const d = (val / 10.0) + (ca / 200.0) + 10;
    let r = Math.floor((d * d / 30.0) + (d / 3.0) + 0.5);
    return Math.max(1, Math.min(20, r));
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
    const numBlocksRequested = headerView.getInt32(8, true);
    
    // We scan for markers because file layout can vary
    const reader = new CMBinaryReader(this.buffer, false); // Block dir is NEVER compressed
    reader.seek(12);
    
    for (let i = 0; i < numBlocksRequested; i++) {
        const pos = headerView.getInt32(12 + i * 268, true);
        const size = headerView.getInt32(16 + i * 268, true);
        const nameBytes = new Uint8Array(this.buffer, 20 + i * 268, 260);
        let end = nameBytes.indexOf(0);
        if (end === -1) end = 260;
        const name = new TextDecoder('windows-1252').decode(nameBytes.slice(0, end)).toLowerCase().split('\\').pop() || '';
        this.blocks.set(name, { position: pos, size: size });
    }

    const cmReader = new CMBinaryReader(this.buffer, this.isCompressed);

    // 1. Game Date (general.dat)
    const genBlock = this.blocks.get('general.dat');
    if (genBlock) {
        cmReader.seek(genBlock.position);
        cmReader.skip(3944);
        this.gameDate = this.readCMDate(cmReader);
        this.log(`Game Date Detected: ${this.gameDate?.toDateString()}`, 'success');
    }

    // 2. Load Metadata
    const nationsMap = this.loadNations(cmReader);
    const clubsMap = this.loadClubs(cmReader, nationsMap);
    const firstNames = this.loadNames(cmReader, 'first_names.dat');
    const secondNames = this.loadNames(cmReader, 'second_names.dat');
    const commonNames = this.loadNames(cmReader, 'common_names.dat');

    // 3. Load Raw Player Bodies
    const rawPlayerMap = this.loadRawPlayers(cmReader);

    // 4. Load Staff & Link
    const finalists: Player[] = [];
    const staffList: Staff[] = [];
    const positionCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    
    const staffBlock = this.blocks.get('staff.dat');
    if (staffBlock) {
        const count = Math.floor(staffBlock.size / 110);
        this.log(`Linking ${count} staff records...`, 'info');
        for (let i = 0; i < count; i++) {
            cmReader.seek(staffBlock.position + i * 110);
            const id = cmReader.readInt32();
            const fNameId = cmReader.readInt32();
            const sNameId = cmReader.readInt32();
            const cNameId = cmReader.readInt32();
            const dob = this.readCMDate(cmReader);
            cmReader.readInt16(); // yearOfBirth
            const fNationId = cmReader.readInt32();
            const sNationId = cmReader.readInt32();
            cmReader.skip(27); // intApps -> jobForClub
            const clubJobId = cmReader.readInt32();
            cmReader.skip(17); // jobForClub(part2) -> value
            const wage = cmReader.readInt32();
            const value = cmReader.readInt32();
            
            const adapt = cmReader.readSByte();
            const amb = cmReader.readSByte();
            const det = cmReader.readSByte();
            const loy = cmReader.readSByte();
            const pre = cmReader.readSByte();
            const pro = cmReader.readSByte();
            const spo = cmReader.readSByte();
            const tem = cmReader.readSByte();
            
            cmReader.skip(3);
            const playerId = cmReader.readInt32();
            
            const fName = firstNames.get(fNameId) || '';
            const sName = secondNames.get(sNameId) || '';
            const cName = commonNames.get(cNameId) || '';

            const age = dob && this.gameDate ? (this.gameDate.getFullYear() - dob.getFullYear()) : 0;
            const club = clubsMap.get(clubJobId);

            if (playerId >= 0) {
                const rp = rawPlayerMap.get(playerId);
                if (rp) {
                    const isGK = rp.gk > 14;
                    const ca = rp.ca;
                    const attrs: Record<string, number> = {};
                    
                    // The 40 attributes from player.dat offset 30
                    const rawAttr = rp.rawAttributes;
                    const names = [
                        'Acceleration', 'Aggression', 'Agility', 'Anticipation', 'Balance', 'Bravery', 'Consistency',
                        'Corners', 'Crossing', 'Decisions', 'Dirtiness', 'Dribbling', 'Handling', 'Heading',
                        'ImportantMatches', 'InjuryProneness', 'Jumping', 'Influence', 'LeftFoot', 'LongShots',
                        'Marking', 'OffTheBall', 'NaturalFitness', 'OneOnOnes', 'Pace', 'Passing', 'Penalties',
                        'Positioning', 'Reflexes', 'RightFoot', 'Stamina', 'Strength', 'Tackling', 'Teamwork',
                        'Technique', 'ThrowIns', 'Versatility', 'Finishing', 'Flair', 'SetPieces'
                    ];

                    names.forEach((name, idx) => {
                        let isHigh = true;
                        // GK logic: Handling(12), 1-on-1s(23), Reflexes(28)
                        if (idx === 12 || idx === 23 || idx === 28) isHigh = isGK;
                        else if ([1, 8, 11, 13, 20, 21, 26].includes(idx)) isHigh = !isGK; // crossing, marking etc
                        
                        attrs[name] = this.highConvert(ca, Math.abs(rawAttr[idx]));
                    });

                    // Add Floating Mentals
                    attrs['Creativity'] = this.highConvert(ca, Math.abs(rp.creativity));
                    attrs['WorkRate'] = this.highConvert(ca, Math.abs(rp.workRate));
                    
                    // Add Staff Hidden
                    attrs['Adaptability'] = Math.abs(adapt);
                    attrs['Ambition'] = Math.abs(amb);
                    attrs['Determination'] = Math.abs(det);
                    attrs['Loyalty'] = Math.abs(loy);
                    attrs['Pressure'] = Math.abs(pre);
                    attrs['Professionalism'] = Math.abs(pro);
                    attrs['Sportsmanship'] = Math.abs(spo);
                    attrs['Temperament'] = Math.abs(tem);

                    const pos: Record<string, number> = {};
                    if (isGK) { pos['GK'] = 20; positionCounts.GK++; }
                    if (rp.sw > 14) pos['SW'] = 20;
                    if (rp.d > 14) pos['D'] = 20;
                    if (rp.dm > 14) pos['DM'] = 20;
                    if (rp.m > 14) pos['M'] = 20;
                    if (rp.am > 14) pos['AM'] = 20;
                    if (rp.f > 14) pos['F'] = 20;
                    
                    if (!isGK) {
                        if (rp.d > 14) positionCounts.DEF++;
                        else if (rp.m > 14 || rp.dm > 14 || rp.am > 14) positionCounts.MID++;
                        else if (rp.f > 14) positionCounts.FWD++;
                    }

                    finalists.push({
                        id: staffIdToPlayerIdLink(id, playerId),
                        firstName: fName, lastName: sName, commonName: cName,
                        age, dob,
                        nationalityName: nationsMap.get(fNationId) || 'Unknown',
                        secondNationalityName: nationsMap.get(sNationId) || '',
                        clubName: club?.name || 'Free Agent',
                        wage, value,
                        currentAbility: ca, potentialAbility: rp.pa,
                        reputation: { home: rp.hRep, current: rp.cRep, world: rp.wRep },
                        attributes: attrs, positions: pos,
                        preferredFoot: rp.rf > rp.lf ? 'Right' : (rp.lf > rp.rf ? 'Left' : 'Either')
                    });
                }
            } else {
                staffList.push({
                    id, firstName: fName, lastName: sName, commonName: cName,
                    dob, nationality: nationsMap.get(fNationId) || 'Unknown',
                    clubName: club?.name || 'Unemployed',
                    job: 'Staff', wage, value,
                    adaptability: Math.abs(adapt),
                    ambition: Math.abs(amb),
                    determination: Math.abs(det),
                    loyalty: Math.abs(loy),
                    pressure: Math.abs(pre),
                    professionalism: Math.abs(pro),
                    sportsmanship: Math.abs(spo),
                    temperament: Math.abs(tem),
                    playerId: -1
                });
            }
        }
    }

    return {
        players: finalists,
        staff: staffList,
        clubs: Array.from(clubsMap.values()),
        gameDate: this.gameDate,
        positionCounts
    };
  }

  private loadNames(reader: CMBinaryReader, file: string): Map<number, string> {
    const block = this.blocks.get(file);
    const map = new Map<number, string>();
    if (block) {
        const count = Math.floor(block.size / 60);
        for (let i = 0; i < count; i++) {
            reader.seek(block.position + i * 60);
            const name = reader.readString(51);
            const id = reader.readInt32();
            map.set(id, name);
        }
    }
    return map;
  }

  private loadNations(reader: CMBinaryReader): Map<number, string> {
    const block = this.blocks.get('nation.dat');
    const map = new Map<number, string>();
    if (block) {
        const count = Math.floor(block.size / 290);
        for (let i = 0; i < count; i++) {
            reader.seek(block.position + i * 290);
            const id = reader.readInt32();
            const name = reader.readString(51);
            map.set(id, name);
        }
    }
    return map;
  }

  private loadClubs(reader: CMBinaryReader, nations: Map<number, string>): Map<number, Club> {
      const block = this.blocks.get('club.dat');
      const map = new Map<number, Club>();
      if (block) {
          const count = Math.floor(block.size / 581);
          for (let i = 0; i < count; i++) {
              reader.seek(block.position + i * 581);
              const id = reader.readInt32();
              const name = reader.readString(51);
              reader.skip(27); // gender -> shortName
              reader.skip(26); // shortName
              reader.skip(1);  // gender
              const nationId = reader.readInt32();
              const divId = reader.readInt32();
              reader.skip(9);  // lastDiv -> profStatus
              const cash = reader.readInt32();
              const stadiumId = reader.readInt32();
              reader.skip(23); // ownStadium -> training
              const training = reader.readByte();
              const rep = reader.readInt16();
              
              map.set(id, {
                  id, name, cash, reputation: rep, training,
                  nationName: nations.get(nationId) || '',
                  divisionName: '', // Would need club_comp.dat
                  stadiumName: `Stadium ${stadiumId}`,
                  attendance: 0
              });
          }
      }
      return map;
  }

  private loadRawPlayers(reader: CMBinaryReader): Map<number, any> {
      const block = this.blocks.get('player.dat');
      const map = new Map<number, any>();
      if (block) {
          const count = Math.floor(block.size / 70);
          for (let i = 0; i < count; i++) {
              reader.seek(block.position + i * 70);
              const id = reader.readInt32();
              reader.skip(1); // squadNum
              const ca = reader.readInt16();
              const pa = reader.readInt16();
              const hRep = reader.readInt16();
              const cRep = reader.readInt16();
              const wRep = reader.readInt16();
              
              const gk = reader.readSByte();
              const sw = reader.readSByte();
              const d  = reader.readSByte();
              const dm = reader.readSByte();
              const m  = reader.readSByte();
              const am = reader.readSByte();
              const f  = reader.readSByte();
              const wb = reader.readSByte();
              const rs = reader.readSByte();
              const ls = reader.readSByte();
              const cs = reader.readSByte();
              const fr = reader.readSByte();

              const cre = reader.readSByte();
              const wr  = reader.readSByte();
              const mor = reader.readSByte();

              const attrs = [];
              for (let j = 0; j < 40; j++) attrs.push(reader.readSByte());

              map.set(id, {
                  id, ca, pa, hRep, cRep, wRep,
                  gk, sw, d, dm, m, am, f, wb, rs, ls, cs, fr,
                  creativity: cre, workRate: wr, morale: mor,
                  rawAttributes: attrs,
                  lf: Math.abs(ls), rf: Math.abs(rs) // rough mapping for foot
              });
          }
      }
      return map;
  }
}

function staffIdToPlayerIdLink(staffId: number, playerId: number): number {
    return staffId; // In CM, the staff record index is the primary handle
}
