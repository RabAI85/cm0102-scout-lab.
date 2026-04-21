
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, LayoutGrid } from 'lucide-react';
import { Player } from '../lib/CM0102Parser';
import { formatCurrency, getAttributeColor } from '../lib/constants';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';

interface PlayerProfileProps {
  players: Player[];
}

export default function PlayerProfile({ players }: PlayerProfileProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  const player = players.find(p => p.id === parseInt(id || ''));

  if (!player) {
    return (
      <div className="flex-1 bg-[#0E0E0E] flex flex-col items-center justify-center text-white">
        <p className="font-bebas text-4xl mb-4 tracking-widest">PLAYER NOT FOUND</p>
        <button onClick={() => navigate('/')} className="text-[#E8F000] font-bold text-xs tracking-widest uppercase hover:underline">
          RETURN TO DATABASE
        </button>
      </div>
    );
  }

  const getPositionAbbr = (pos: string) => {
    const map: any = {
      "Goalkeeper": "GK",
      "Sweeper": "SW",
      "Defender": "D",
      "DefensiveMidfielder": "DM",
      "Midfielder": "M",
      "AttackingMidfielder": "AM",
      "Attacker": "ST",
      "WingBack": "WB"
    };
    let base = map[pos] || pos;
    if (["GK", "SW", "ST"].includes(base)) return base;
    
    // Side logic
    const sides = [
      { key: "LeftSide", label: "L", val: player.positions["LeftSide"] },
      { key: "RightSide", label: "R", val: player.positions["RightSide"] },
      { key: "CentreSide", label: "C", val: player.positions["CentreSide"] },
    ].sort((a,b) => (b.val as number) - (a.val as number));

    if (sides[0].val > 10) {
      return base + sides[0].label;
    }
    return base;
  };

  const primaryPosition = Object.entries(player.positions)
    .filter(([k, v]) => k !== "LeftSide" && k !== "RightSide" && k !== "CentreSide" && (v as number) >= 10)
    .sort((a, b) => (b[1] as number) - (a[1] as number))[0];

  const headerPos = primaryPosition ? getPositionAbbr(primaryPosition[0]) : "";

  const attr = player.attributes;

  const radarData = [
    { subject: 'ATTACK', A: (attr['Finishing'] + attr['Dribbling'] + attr['OffTheBall'] + attr['LongShots']) / 4 },
    { subject: 'VISION', A: (attr['Creativity'] + attr['Passing'] + attr['Decisions'] + attr['Anticipation']) / 4 },
    { subject: 'PHYSICAL', A: (attr['Pace'] + attr['Acceleration'] + attr['Stamina'] + attr['Strength'] + attr['Jumping']) / 5 },
    { subject: 'DEFENCE', A: (attr['Tackling'] + attr['Marking'] + attr['Positioning'] + attr['Heading']) / 4 },
    { subject: 'MENTALITY', A: (attr['Bravery'] + attr['Determination'] + attr['WorkRate'] + attr['Teamwork']) / 4 },
    { subject: 'PACE', A: (attr['Pace'] + attr['Acceleration'] + attr['Agility'] + attr['Balance']) / 4 },
  ];

  const mainColumns = [
    ["Acceleration", "Aggression", "Agility", "Anticipation", "Balance", "Bravery", "Creativity", "Crossing", "Decisions", "Determination", "Dribbling", "Finishing"],
    ["Flair", "Handling", "Heading", "Influence", "Jumping", "LongShots", "Marking", "OffTheBall", "Pace", "Passing", "Positioning", "Reflexes"],
    ["SetPieces", "Stamina", "Strength", "Tackling", "Teamwork", "Technique", "WorkRate"]
  ];

  const hiddenAttrs = [
    "Consistency", "Dirtiness", "ImportantMatches", "InjuryProneness", "NaturalFitness", "Versatility", 
    "Adaptability", "Ambition", "Determination", "Loyalty", "Pressure", "Professionalism", "Sportsmanship", "Temperament"
  ];

  const formatAttrName = (name: string) => {
    const map: any = {
      LongShots: "Long Shots",
      OffTheBall: "Off The Ball",
      SetPieces: "Set Pieces",
      WorkRate: "Work Rate",
      NaturalFitness: "Natural Fitness",
      InjuryProneness: "Injury Proneness",
      ImportantMatches: "Important Matches",
      OneOnOnes: "One On Ones",
    };
    return map[name] || name;
  };

  const preferredFoot = () => {
    const rf = attr['RightFoot'] || 0;
    const lf = attr['LeftFoot'] || 0;
    if (rf > lf + 3) return "Right";
    if (lf > rf + 3) return "Left";
    return "Either";
  };

  return (
    <div className="flex-1 bg-[#0E0E0E] flex flex-col overflow-hidden font-sans">
      {/* Top Header Strip */}
      <header className="bg-[#1C1B1B] w-full h-[100px] flex items-center px-8 border-b border-[#2A2A2A] shrink-0">
        <button 
          onClick={() => navigate('/')}
          className="mr-8 text-white hover:text-[#E8F000] transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-6">
          <div className="bg-[#E8F000] px-4 py-1.5 rounded text-black font-bebas text-2xl tracking-tighter shadow-lg">
            {headerPos}
          </div>
          <div>
            <h1 className="font-bebas text-[42px] leading-none text-white tracking-widest uppercase">
              {player.firstName} {player.lastName}
            </h1>
            <p className="text-[#888888] text-[13px] font-medium tracking-tight mt-1">
              Born {player.dob.toLocaleDateString('de-DE')} (Age {player.age}) · {player.nationalityName} · 12 Caps
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button className="sweep-btn border border-[#E8F000] text-[#E8F000] px-6 py-2 rounded-full font-bebas text-lg tracking-widest">
            ADD TO SHORTLIST
          </button>
          <button className="sweep-btn border border-[#E8F000] text-[#E8F000] px-6 py-2 rounded-full font-bebas text-lg tracking-widest">
            COMPARE
          </button>
          <button className="sweep-btn border border-[#E8F000] text-[#E8F000] px-6 py-2 rounded-full font-bebas text-lg tracking-widest">
            ADD TO XI
          </button>
        </div>
      </header>

      {/* Main Content Areas Side by Side */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-10 flex gap-[24px]">
        {/* Left Side (60%) */}
        <div className="w-[60%] space-y-[16px]">
          {/* Main Attribute Grid */}
          <div className="grid grid-cols-3 gap-x-12">
            {mainColumns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col">
                {col.map((attrName, rowIdx) => (
                  <div 
                    key={attrName} 
                    className={`h-[28px] px-2 flex justify-between items-center transition-colors ${rowIdx % 2 === 0 ? 'bg-[#1C1B1B]' : 'bg-[#202020]'}`}
                  >
                    <span className="text-[#888888] text-[12px] font-medium tracking-tight truncate pr-1">
                      {formatAttrName(attrName)}
                    </span>
                    <span className={`font-mono text-[13px] font-bold ${getAttributeColor(attr[attrName] || 0)}`}>
                      {attr[attrName] || '-'}
                    </span>
                  </div>
                ))}
                {colIdx === 2 && (
                  <div className={`h-[28px] px-2 flex justify-between items-center bg-[#202020]`}>
                    <span className="text-[#888888] text-[12px] font-medium tracking-tight">Preferred Foot</span>
                    <span className="font-mono text-[13px] font-bold text-[#E8F000]">{preferredFoot()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hidden Attributes Section */}
          <div className="pt-4">
             <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase mb-[16px]">HIDDEN ATTRIBUTES</h3>
             <div className="grid grid-cols-3 gap-x-12">
                {[0, 1, 2].map((colIdx) => {
                  const itemsPerCol = Math.ceil(hiddenAttrs.length / 3);
                  const startIndex = colIdx * itemsPerCol;
                  const colItems = hiddenAttrs.slice(startIndex, startIndex + itemsPerCol);
                  
                  return (
                    <div key={colIdx} className="flex flex-col">
                      {colItems.map((attrName, rowIdx) => (
                        <div 
                          key={attrName} 
                          className={`h-[28px] px-2 flex justify-between items-center transition-colors ${rowIdx % 2 === 0 ? 'bg-[#1C1B1B]' : 'bg-[#202020]'}`}
                        >
                          <span className="text-[#888888] text-[12px] font-medium tracking-tight truncate pr-1">
                            {formatAttrName(attrName)}
                          </span>
                          <span className={`font-mono text-[13px] font-bold ${getAttributeColor(attr[attrName] || 0)}`}>
                            {attr[attrName] || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Right Side (40%) */}
        <div className="w-[40%] flex flex-col gap-[16px]">
          {/* Card 1: Player Details */}
          <div className="bg-[#1C1B1B] p-[20px] rounded-xl flex flex-col">
            {[
              { label: "CLUB", value: player.clubName || "FREE AGENT" },
              { label: "VALUE", value: formatCurrency(player.value) },
              { label: "WAGES", value: formatCurrency(player.wage) + "/W" },
              { label: "CONTRACT", value: "2006" }
            ].map((stat, i) => (
              <div key={i} className={`flex justify-between items-center ${i !== 3 ? 'mb-[16px]' : ''}`}>
                <div className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase">{stat.label}</div>
                <div className="text-white font-bebas text-[18px] tracking-widest leading-none flex items-center h-full">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Card 2: Positions */}
          <div className="bg-[#1C1B1B] p-[20px] rounded-xl flex flex-col">
            <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase mb-[16px]">POSITIONS</h3>
            <div className="space-y-1">
               {Object.entries(player.positions)
                .filter(([k, v]) => k !== "LeftSide" && k !== "RightSide" && k !== "CentreSide" && (v as number) >= 10)
                .sort((a,b) => (b[1] as number) - (a[1] as number))
                .map(([p, v]) => (
                  <div key={p} className="flex justify-between items-center h-[24px]">
                    <span className="text-white text-[12px] font-bold tracking-widest uppercase">{getPositionAbbr(p)}</span>
                    <span className="text-[#E8F000] font-mono text-[13px] font-bold">{v as number}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Card 3: Attribute Spread Radar */}
          <div className="bg-[#1C1B1B] p-[20px] rounded-xl flex flex-col items-center">
            <div className="w-full">
              <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase mb-[16px]">ATTRIBUTE SPREAD</h3>
            </div>
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#2A2A2A" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#888888', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em' }} 
                  />
                  <Radar
                    name="Player"
                    dataKey="A"
                    stroke="#E8F000"
                    fill="#E8F000"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
