
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
  dob: Date;
  nationalityName: string;
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
  history?: any[];
  transferStatus?: boolean;
  loanStatus?: boolean;
}

export class CM0102Parser {
  private view: DataView;
  private buffer: ArrayBuffer;
  private offset: number = 0;
  private log: (msg: string, type?: 'info' | 'success' | 'error') => void;

  private blocks: Map<string, { position: number; size: number }> = new Map();

  constructor(buffer: ArrayBuffer, logger?: (msg: string, type?: 'info' | 'success' | 'error') => void) {
    this.buffer = buffer;
    this.view = new DataView(buffer);
    this.log = logger || ((msg) => console.log(msg));
  }

  private readInt32(): number {
    const val = this.view.getInt32(this.offset, true);
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

  private readString(length: number): string {
    const bytes = new Uint8Array(this.buffer, this.offset, length);
    this.offset += length;
    let end = bytes.indexOf(0);
    if (end === -1) end = length;
    return new TextDecoder('windows-1252').decode(bytes.slice(0, end));
  }

  private readDate(): Date {
    const day = this.readInt16();
    const year = this.readInt16();
    const isLeapYear = this.readInt32(); // Not used in simple JS Date calc
    const date = new Date(year, 0, 1);
    date.setDate(date.getDate() + day);
    return date;
  }

  public parseHeader() {
    this.offset = 0;
    const compressionFlag = this.readInt32();
    if (compressionFlag === 4) {
      throw new Error("Compressed saves are not supported — please save with compression off in game settings.");
    }
    this.readInt32(); // skip 4 bytes
    const numBlocks = this.readInt32();
    this.log(`Found ${numBlocks} blocks.`, 'success');

    for (let i = 0; i < numBlocks; i++) {
      const position = this.readInt32();
      const size = this.readInt32();
      const name = this.readString(260);
      this.blocks.set(name.toLowerCase(), { position, size });
    }
  }

  private getBlock(name: string) {
    const block = this.blocks.get(name.toLowerCase());
    if (!block) return null;
    return block;
  }

  public getPlayers(): Player[] {
    this.parseHeader();

    const generalBlock = this.getBlock("general.dat");
    let gameDate = new Date(2001, 0, 1); // Default CM0102 start date
    if (generalBlock) {
      const oldOffset = this.offset;
      this.offset = generalBlock.position + 3944;
      gameDate = this.readDate();
      this.offset = oldOffset;
      this.log(`System date identified: ${gameDate.toLocaleDateString()}`, 'info');
    }

    const nationBlock = this.getBlock("nation.dat");
    const clubBlock = this.getBlock("club.dat");
    const firstNameBlock = this.getBlock("first_names.dat");
    const secondNameBlock = this.getBlock("second_names.dat");
    const commonNameBlock = this.getBlock("common_names.dat");
    const playerBlock = this.getBlock("player.dat");
    const staffBlock = this.getBlock("staff.dat");

    if (!playerBlock || !staffBlock) {
      throw new Error("Required blocks (player.dat or staff.dat) not found.");
    }

    const nations = this.parseNations(nationBlock);
    const firstNames = this.parseNames(firstNameBlock);
    const secondNames = this.parseNames(secondNameBlock);
    const commonNames = this.parseNames(commonNameBlock);
    const clubs = this.parseClubs(clubBlock);
    const staffMap = this.parseStaff(staffBlock, firstNames, secondNames, commonNames, nations, clubs, gameDate);
    
    return this.parsePlayers(playerBlock, staffMap);
  }

  private parseNations(block: any): Map<number, string> {
    if (!block) return new Map();
    const map = new Map<number, string>();
    const count = block.size / 290;
    this.log(`nation: ${count} records`, 'info');
    for (let i = 0; i < count; i++) {
      this.offset = block.position + i * 290;
      const id = this.readInt32();
      const name = this.readString(51);
      map.set(id, name);
    }
    return map;
  }

  private parseNames(block: any): Map<number, string> {
    if (!block) return new Map();
    const map = new Map<number, string>();
    const count = block.size / 60;
    const nameType = block.name || "names";
    this.log(`${nameType}: ${count} records`, 'info');
    for (let i = 0; i < count; i++) {
      this.offset = block.position + i * 60;
      const name = this.readString(51);
      const id = this.readInt32();
      map.set(id, name);
    }
    return map;
  }

  private parseClubs(block: any): Map<number, string> {
    if (!block) return new Map();
    const map = new Map<number, string>();
    const count = block.size / 581;
    this.log(`club: ${count} records`, 'info');
    for (let i = 0; i < count; i++) {
      this.offset = block.position + i * 581;
      const id = this.readInt32();
      const name = this.readString(51);
      map.set(id, name);
    }
    return map;
  }

  private normalizeAttr(val: number): number {
    // CM 01/02 storage of attributes:
    // Interpret as unsigned 0-255 to handle tags and mapping consistently.
    const uVal = val < 0 ? val + 256 : val;
    
    // Negative values in signed Int8 (-1 to -20) represent random tags.
    // In unsigned byte terms: 255 is -1, 236 is -20.
    if (uVal >= 236 && uVal <= 255) {
      return 256 - uVal; // maps 255 -> 1, 236 -> 20.
    }
    
    // Value 0 is usually unset/random in CM, map to 1 for display.
    if (uVal === 0) return 1;

    // Most attributes are 1-20.
    if (uVal <= 20) return uVal;
    
    // For values > 20, they might be uncapped attributes or on a 1-100/1-200 scale.
    // We clamp to 20 to respect the user's 1-20 requirement for consistent scouting.
    return 20;
  }

  private parseStaff(
    block: any,
    firstNames: Map<number, string>,
    secondNames: Map<number, string>,
    commonNames: Map<number, string>,
    nations: Map<number, string>,
    clubs: Map<number, string>,
    gameDate: Date
  ): Map<number, Partial<Player>> {
    const map = new Map<number, Partial<Player>>();
    const count = block.size / 110;
    this.log(`staff: ${count} records`, 'info');

    for (let i = 0; i < count; i++) {
      this.offset = block.position + i * 110;
      const id = this.readInt32(); // 0-3
      const firstNameId = this.readInt32(); // 4-7
      const secondNameId = this.readInt32(); // 8-11
      const commonNameId = this.readInt32(); // 12-15
      const dob = this.readDate(); // 16-23 (8 bytes)
      this.readInt16(); // skip yearOfBirth (24-25)
      
      const firstNationId = this.readInt32(); // 26-29
      const secondNationId = this.readInt32(); // 30-33
      
      this.offset += 2; // skip intApps (34), intGoals (35)
      this.offset += 4; // skip nationalJobId (36-39)
      this.offset += 1; // skip jobForNation (40)
      this.offset += 8; // skip dateJoinedNation (41-48)
      this.offset += 8; // skip dateExpiresNation (49-56)
      
      const clubJobId = this.readInt32(); // 57-60
      this.offset += 1; // skip jobForClub (61)
      this.offset += 8; // skip dateJoinedClub (62-69)
      this.offset += 8; // skip dateExpiresClub (70-77)
      
      const wage = this.readInt32(); // 78-81
      const value = this.readInt32(); // 82-85
      
      const readStaffAttr = () => this.normalizeAttr(this.readInt8());
      
      // Mental attributes (86-96)
      const mentalAttributes: Record<string, number> = {
        "Adaptability": readStaffAttr(),
        "Ambition": readStaffAttr(),
        "Determination": readStaffAttr(),
        "Loyalty": readStaffAttr(),
        "Pressure": readStaffAttr(),
        "Professionalism": readStaffAttr(),
        "Sportsmanship": readStaffAttr(),
        "Temperament": readStaffAttr(),
        "Playing Squad": readStaffAttr(),
        "Classification": readStaffAttr(),
        "Club Valuation": readStaffAttr()
      };
      
      const playerId = this.readInt32(); // 97-100
      
      let age = gameDate.getFullYear() - dob.getFullYear();
      if (gameDate.getMonth() < dob.getMonth() || (gameDate.getMonth() === dob.getMonth() && gameDate.getDate() < dob.getDate())) {
        age--;
      }

      map.set(playerId, {
        firstName: firstNames.get(firstNameId) || "",
        lastName: secondNames.get(secondNameId) || "",
        commonName: commonNames.get(commonNameId) || "",
        nationalityName: nations.get(firstNationId) || "",
        clubName: clubs.get(clubJobId) || "Free Agent",
        age,
        dob,
        wage,
        value,
        attributes: mentalAttributes
      });
    }
    return map;
  }

  private parsePlayers(block: any, staffMap: Map<number, Partial<Player>>): Player[] {
    const players: Player[] = [];
    const count = block.size / 70;
    this.log(`player: ${count} records`, 'info');

    for (let i = 0; i < count; i++) {
      const recordStart = block.position + i * 70;
      
      const id = this.view.getInt32(recordStart + 0, true);
      const squadNumber = this.view.getUint8(recordStart + 4);
      const currentAbility = this.view.getInt16(recordStart + 5, true);
      const potentialAbility = this.view.getInt16(recordStart + 7, true);
      const homeRep = this.view.getInt16(recordStart + 9, true);
      const currentRep = this.view.getInt16(recordStart + 11, true);
      const worldRep = this.view.getInt16(recordStart + 13, true);

      const readAt = (offset: number) => {
        const val = this.view.getInt8(recordStart + offset);
        return this.normalizeAttr(val);
      };

      const positions: Record<string, number> = {
        "Goalkeeper": readAt(15),
        "Sweeper": readAt(16),
        "Defender": readAt(17),
        "DefensiveMidfielder": readAt(18),
        "Midfielder": readAt(19),
        "AttackingMidfielder": readAt(20),
        "Attacker": readAt(21),
        "WingBack": readAt(22),
        "FreeRole": readAt(23),
        "LeftSide": readAt(24),
        "RightSide": readAt(25),
        "CentreSide": readAt(26)
      };

      const playerAttrs: Record<string, number> = {
        "Acceleration": readAt(27),
        "Aggression": readAt(28),
        "Agility": readAt(29),
        "Anticipation": readAt(30),
        "Balance": readAt(31),
        "Bravery": readAt(32),
        "Corners": readAt(33),
        "Crossing": readAt(34),
        "Decisions": readAt(35),
        "Dirtiness": readAt(36),
        "Dribbling": readAt(37),
        "Finishing": readAt(38),
        "Flair": readAt(39),
        "SetPieces": readAt(40),
        "Handling": readAt(41),
        "Heading": readAt(42),
        "ImportantMatches": readAt(43),
        "InjuryProneness": readAt(44),
        "Jumping": readAt(45),
        "Influence": readAt(46),
        "LeftFoot": readAt(47),
        "LongShots": readAt(48),
        "Marking": readAt(49),
        "NaturalFitness": readAt(50),
        "OffTheBall": readAt(51),
        "OneOnOnes": readAt(52),
        "Pace": readAt(53),
        "Passing": readAt(54),
        "Penalties": readAt(55),
        "Positioning": readAt(56),
        "Reflexes": readAt(57),
        "RightFoot": readAt(58),
        "Stamina": readAt(59),
        "Strength": readAt(60),
        "Tackling": readAt(61),
        "Teamwork": readAt(62),
        "Technique": readAt(63),
        "ThrowIns": readAt(64),
        "Versatility": readAt(65),
        "WorkRate": readAt(66),
        "Creativity": readAt(67),
        "Consistency": readAt(68),
        "Determination": readAt(69)
      };

      const staffData = staffMap.get(id);
      if (staffData) {
        players.push({
          id,
          firstName: staffData.firstName || "",
          lastName: staffData.lastName || "",
          commonName: staffData.commonName || "",
          age: staffData.age || 0,
          dob: staffData.dob || new Date(1900, 0, 1),
          nationalityName: staffData.nationalityName || "",
          clubName: staffData.clubName || "",
          wage: staffData.wage || 0,
          value: staffData.value || 0,
          currentAbility,
          potentialAbility,
          reputation: {
            home: homeRep,
            current: currentRep,
            world: worldRep
          },
          attributes: { ...playerAttrs, ...staffData.attributes },
          positions
        });
      }
    }
    return players;
  }
}
