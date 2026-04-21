
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
      
      // Mental attributes (86-96)
      const mentalAttributes: Record<string, number> = {
        "Adaptability": this.readUint8(),
        "Ambition": this.readUint8(),
        "Determination": this.readUint8(),
        "Loyalty": this.readUint8(),
        "Pressure": this.readUint8(),
        "Professionalism": this.readUint8(),
        "Sportsmanship": this.readUint8(),
        "Temperament": this.readUint8(),
        "Playing Squad": this.readUint8(),
        "Classification": this.readUint8(),
        "Club Valuation": this.readUint8()
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

    const technicalAttrs = [
      "Acceleration", "Aggression", "Agility", "Anticipation", "Balance", "Bravery", "Consistency", 
      "Corners", "Crossing", "Decisions", "Dirtiness", "Dribbling", "Finishing", 
      "Flair", "SetPieces", "Handling", "Heading", "ImportantMatches", "InjuryProneness", "Jumping", "Influence", "LeftFoot", 
      "LongShots", "Marking", "OffTheBall", "NaturalFitness", "OneOnOnes", "Pace", "Passing", "Penalties", 
      "Positioning", "Reflexes", "RightFoot", "Stamina", "Strength", "Tackling", "Teamwork", 
      "Technique", "ThrowIns", "Versatility", "Creativity", "WorkRate"
    ];

    const posNames = [
      "GK", "SW", "D", "DM", "M", "AM", "F", "S",
      "Left", "Right", "Centre"
    ];

    for (let i = 0; i < count; i++) {
      this.offset = block.position + i * 70;
      const id = this.readInt32(); // 0-3
      const squadNumber = this.readUint8(); // 4
      const currentAbility = this.readInt16(); // 5-6
      const potentialAbility = this.readInt16(); // 7-8
      const homeRep = this.readInt16(); // 9-10
      const currentRep = this.readInt16(); // 11-12
      const worldRep = this.readInt16(); // 13-14
      
      const positions: Record<string, number> = {
        "Goalkeeper": this.readUint8(),
        "Sweeper": this.readUint8(),
        "Defender": this.readUint8(),
        "DefensiveMidfielder": this.readUint8(),
        "Midfielder": this.readUint8(),
        "AttackingMidfielder": this.readUint8(),
        "Attacker": this.readUint8(),
        "WingBack": this.readUint8(),
        "RightSide": this.readUint8(),
        "LeftSide": this.readUint8(),
        "CentreSide": this.readUint8(),
        "FreeRole": this.readUint8()
      };

      const playerAttrs: Record<string, number> = {
        "Acceleration": this.readUint8(),
        "Aggression": this.readUint8(),
        "Agility": this.readUint8(),
        "Anticipation": this.readUint8(),
        "Balance": this.readUint8(),
        "Bravery": this.readUint8(),
        "Consistency": this.readUint8(),
        "Corners": this.readUint8(),
        "Crossing": this.readUint8(),
        "Decisions": this.readUint8(),
        "Dirtiness": this.readUint8(),
        "Dribbling": this.readUint8(),
        "Finishing": this.readUint8(),
        "Flair": this.readUint8(),
        "SetPieces": this.readUint8(),
        "Handling": this.readUint8(),
        "Heading": this.readUint8(),
        "ImportantMatches": this.readUint8(),
        "InjuryProneness": this.readUint8(),
        "Jumping": this.readUint8(),
        "Influence": this.readUint8(),
        "LeftFoot": this.readUint8(),
        "LongShots": this.readUint8(),
        "Marking": this.readUint8(),
        "OffTheBall": this.readUint8(),
        "NaturalFitness": this.readUint8(),
        "OneOnOnes": this.readUint8(),
        "Pace": this.readUint8(),
        "Passing": this.readUint8(),
        "Penalties": this.readUint8(),
        "Positioning": this.readUint8(),
        "Reflexes": this.readUint8(),
        "RightFoot": this.readUint8(),
        "Stamina": this.readUint8(),
        "Strength": this.readUint8(),
        "Tackling": this.readUint8(),
        "Teamwork": this.readUint8(),
        "Technique": this.readUint8(),
        "ThrowIns": this.readUint8(),
        "Versatility": this.readUint8(),
        "Creativity": this.readUint8(),
        "WorkRate": this.readUint8(),
        "Morale": this.readUint8()
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
