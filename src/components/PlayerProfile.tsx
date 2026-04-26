
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, LayoutGrid, ChevronDown, MoreHorizontal, Check } from 'lucide-react';
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
  compareSlots: { slot1: number | null, slot2: number | null };
  addToCompare: (id: number, slot: 1 | 2) => void;
  removeFromCompare: (slot: 1 | 2) => void;
  shortlist: number[];
  toggleShortlist: (id: number) => void;
}

export default function PlayerProfile({ 
  players, 
  compareSlots, 
  addToCompare, 
  removeFromCompare, 
  shortlist, 
  toggleShortlist 
}: PlayerProfileProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const playerId = parseInt(id || '');
  const player = players.find(p => p.id === playerId);

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
    return pos; // The new parser already provides labels like GK, DR, MC etc.
  };
 
  const primaryPosition = Object.entries(player.positions)
    .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
 
  const headerPos = primaryPosition ? primaryPosition[0] : "";
 
  const attr = player.attributes;
 
  const radarData = [
    { subject: 'ATTACK', A: ((attr['Finishing'] || 0) + (attr['Dribbling'] || 0) + (attr['OffTheBall'] || 0) + (attr['LongShots'] || 0)) / 4 },
    { subject: 'VISION', A: ((attr['Creativity'] || 0) + (attr['Passing'] || 0) + (attr['Decisions'] || 0) + (attr['Anticipation'] || 0)) / 4 },
    { subject: 'PHYSICAL', A: ((attr['Pace'] || 0) + (attr['Acceleration'] || 0) + (attr['Agility'] || 0) + (attr['Balance'] || 0) + (attr['Jumping'] || 0)) / 5 },
    { subject: 'DEFENCE', A: ((attr['Tackling'] || 0) + (attr['Marking'] || 0) + (attr['Positioning'] || 0) + (attr['Heading'] || 0)) / 4 },
    { subject: 'MENTALITY', A: ((attr['Bravery'] || 0) + (attr['Determination'] || 0) + (attr['WorkRate'] || 0) + (attr['Teamwork'] || 0)) / 4 },
    { subject: 'PACE', A: ((attr['Pace'] || 0) + (attr['Acceleration'] || 0) + (attr['Agility'] || 0) + (attr['Balance'] || 0)) / 4 },
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
          <div className="bg-scout-yellow px-4 py-1.5 rounded text-black font-bebas text-2xl tracking-tighter shadow-lg">
            {headerPos}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <h1 className="font-bebas text-[24px] leading-none text-white tracking-widest uppercase">
                {player.firstName} {player.lastName}
              </h1>
              
              <div className="relative">
                <button 
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className="bg-[#2A2A2A] hover:bg-[#333333] text-scout-yellow px-3 py-1 rounded text-[10px] font-bold tracking-widest border border-[#3A3A3A] flex items-center gap-2 transition-all"
                >
                  ACTIONS <ChevronDown size={14} />
                </button>
                
                {isActionsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-[#1C1B1B] border border-[#2A2A2A] rounded shadow-2xl z-50 overflow-hidden">
                    {[
                      { 
                        label: shortlist.includes(playerId) ? 'REMOVE FROM SHORTLIST' : 'ADD TO SHORTLIST', 
                        icon: UserPlus,
                        onClick: () => toggleShortlist(playerId)
                      },
                      { 
                        label: compareSlots.slot1 === playerId ? 'REMOVE FROM SLOT 1' : 'ADD TO COMPARE SLOT 1', 
                        icon: LayoutGrid,
                        onClick: () => compareSlots.slot1 === playerId ? removeFromCompare(1) : addToCompare(playerId, 1)
                      },
                      { 
                        label: compareSlots.slot2 === playerId ? 'REMOVE FROM SLOT 2' : 'ADD TO COMPARE SLOT 2', 
                        icon: LayoutGrid,
                        onClick: () => compareSlots.slot2 === playerId ? removeFromCompare(2) : addToCompare(playerId, 2)
                      },
                      { label: 'ADD TO XI', icon: Users, onClick: () => {} }
                    ].map((act, i) => (
                      <button 
                        key={i} 
                        onClick={() => { act.onClick(); setIsActionsOpen(false); }}
                        className="w-full px-4 py-2 text-left text-[10px] font-bold tracking-widest text-[#888888] hover:bg-[#E8F000] hover:text-black flex items-center gap-3 transition-colors"
                      >
                        <act.icon size={12} />
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[#888888] text-[11px] font-medium tracking-tight mt-1">
              Born {player.dob?.toLocaleDateString('de-DE') || 'Unknown'} (Age {player.age}) · {player.nationalityName} · 12 Caps
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4 opacity-40">
           {/* Placeholder for secondary info or breadcrumbs if needed */}
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
                    className={`h-[32px] px-3 flex justify-between items-center transition-colors ${rowIdx % 2 === 0 ? 'bg-[#1C1B1B]' : 'bg-[#202020]'}`}
                  >
                    <span className="text-[#888888] text-[13px] font-medium tracking-tight truncate pr-1">
                      {formatAttrName(attrName)}
                    </span>
                    <span className={`font-outfit text-[14px] font-bold ${getAttributeColor(attr[attrName] || 0)}`}>
                      {attr[attrName] || '-'}
                    </span>
                  </div>
                ))}
                {colIdx === 2 && (
                  <>
                    <div className={`h-[32px] px-3 flex justify-between items-center bg-[#202020]`}>
                      <span className="text-[#888888] text-[13px] font-medium tracking-tight">Preferred Foot</span>
                      <span className="font-outfit text-[14px] font-bold text-scout-yellow">{preferredFoot()}</span>
                    </div>
                    
                    {/* Inline Radar Chart - Proportional Size */}
                    <div className="mt-4 bg-[#1C1B1B] rounded-xl p-3 flex flex-col items-center border border-[#2A2A2A]">
                      <span className="text-[#888888] text-[11px] font-bold tracking-[0.2em] mb-2 uppercase">SPREAD</span>
                      <div className="h-[180px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <RadarChart cx="50%" cy="50%" outerRadius="65" data={radarData}>
                            <PolarGrid stroke="#2A2A2A" />
                            <PolarAngleAxis 
                              dataKey="subject" 
                              tick={{ fill: '#888888', fontSize: 7, fontWeight: 700, letterSpacing: '0.1em' }} 
                            />
                            <Radar
                              name="Player"
                              dataKey="A"
                              stroke="#E8F000"
                              fill="#E8F000"
                              fillOpacity={0.1}
                              strokeWidth={1.5}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Hidden Attributes Section */}
          <div className="pt-4">
             <h3 className="text-scout-yellow text-[12px] font-bold tracking-[0.2em] uppercase mb-[16px]">HIDDEN ATTRIBUTES</h3>
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
                          className={`h-[32px] px-3 flex justify-between items-center transition-colors ${rowIdx % 2 === 0 ? 'bg-[#1C1B1B]' : 'bg-[#202020]'}`}
                        >
                          <span className="text-[#888888] text-[13px] font-medium tracking-tight truncate pr-1">
                            {formatAttrName(attrName)}
                          </span>
                          <span className={`font-outfit text-[14px] font-bold ${getAttributeColor(attr[attrName] || 0)}`}>
                            {attr[attrName] || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Player History Section */}
          <div className="pt-8">
            <h3 className="text-scout-yellow text-[11px] font-bold tracking-[0.2em] uppercase mb-[16px]">PLAYING CAREER</h3>
            <div className="bg-[#1C1B1B] rounded-lg overflow-hidden border border-[#2A2A2A]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#2A2A2A] text-scout-yellow text-[9px] font-black tracking-widest uppercase">
                    <th className="px-3 py-2">Season</th>
                    <th className="px-3 py-2">Club</th>
                    <th className="px-3 py-2 text-center">Apps</th>
                    <th className="px-3 py-2 text-center">Gls</th>
                    <th className="px-3 py-2 text-center">Asts</th>
                    <th className="px-3 py-2 text-center">MoM</th>
                    <th className="px-3 py-2 text-center">Pass</th>
                    <th className="px-3 py-2 text-center">Tck</th>
                    <th className="px-3 py-2 text-center">Drb</th>
                    <th className="px-3 py-2 text-center">Sh Tar</th>
                    <th className="px-3 py-2 text-center">Av R</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-medium text-white">
                  {(player.history || []).map((h: any, i: number) => (
                    <tr key={i} className={`border-t border-[#2A2A2A] ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#202020]'}`}>
                      <td className="px-3 py-1.5 text-[#888888]">{h.season}</td>
                      <td className="px-3 py-1.5">{h.club}</td>
                      <td className="px-3 py-1.5 text-center text-scout-yellow font-outfit font-bold">{h.apps}</td>
                      <td className="px-3 py-1.5 text-center text-scout-yellow font-outfit font-bold">{h.gls}</td>
                      <td className="px-3 py-1.5 text-center text-scout-yellow font-outfit font-bold">{h.asts}</td>
                      <td className="px-3 py-1.5 text-center text-scout-yellow font-outfit font-bold">{h.mom}</td>
                      <td className="px-3 py-1.5 text-center text-[#888888] font-outfit">{h.passPct}</td>
                      <td className="px-3 py-1.5 text-center text-[#888888] font-outfit">{h.tck}</td>
                      <td className="px-3 py-1.5 text-center text-[#888888] font-outfit">{h.drb}</td>
                      <td className="px-3 py-1.5 text-center text-[#888888] font-outfit">{h.shTar}</td>
                      <td className={`px-3 py-1.5 text-center font-bold font-outfit ${parseFloat(h.avR) >= 7.5 ? 'text-scout-yellow' : 'text-[#888888]'}`}>{h.avR}</td>
                    </tr>
                  ))}
                  {(!player.history || player.history.length === 0) && (
                    <tr>
                      <td colSpan={11} className="px-3 py-8 text-center text-[#444444] uppercase tracking-widest italic font-bold">No History Data Available</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                <div className="text-white font-bebas text-[15px] tracking-widest leading-none flex items-center h-full">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Card 3: Positions */}
          <div className="bg-[#1C1B1B] p-[20px] rounded-xl flex flex-col">
            <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase mb-[16px]">POSITIONS</h3>
            <div className="space-y-1">
               {Object.entries(player.positions)
                .sort((a,b) => (b[1] as number) - (a[1] as number))
                .map(([p, v]) => (
                  <div key={p} className="flex justify-between items-center h-[24px]">
                    <span className="text-white text-[12px] font-bold tracking-widest uppercase">{p}</span>
                    <span className="text-scout-yellow font-outfit text-[13px] font-bold">{v as number}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Card 4: Transfer Status */}
          <div className="bg-[#1C1B1B] p-[20px] rounded-xl flex flex-col">
            <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase mb-[16px]">TRANSFER STATUS</h3>
            <div className="space-y-4">
              {[
                { label: "TRANSFER LISTED", value: player.transferStatus },
                { label: "LOAN LISTED", value: player.loanStatus }
              ].map((status, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-white text-[12px] font-bold tracking-widest uppercase">{status.label}</span>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${status.value ? 'bg-scout-yellow border-scout-yellow' : 'border-[#2A2A2A] bg-[#141414]'}`}>
                    {status.value && <Check size={14} className="text-black" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
