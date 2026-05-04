
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users, LayoutGrid, ChevronDown } from 'lucide-react';
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

const ATTR_LABEL: Record<string, string> = {
  LongShots: 'Long Shots', OffTheBall: 'Off The Ball', SetPieces: 'Set Pieces',
  WorkRate: 'Work Rate', NaturalFitness: 'Natural Fitness',
  InjuryProneness: 'Injury Proneness', ImportantMatches: 'Important Matches',
  OneOnOnes: 'One On Ones', LeftFoot: 'Left Foot', RightFoot: 'Right Foot',
};
const fmt = (name: string) => ATTR_LABEL[name] || name;

export default function PlayerProfile({ 
  players, compareSlots, addToCompare, removeFromCompare, shortlist, toggleShortlist 
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
        <button onClick={() => navigate('/scout-lab')} className="text-[#E8F000] font-bold text-xs tracking-widest uppercase hover:underline">
          RETURN TO DATABASE
        </button>
      </div>
    );
  }

  const primaryPosition = Object.entries(player.positions)
    .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
  const headerPos = primaryPosition ? primaryPosition[0] : '';

  const attr = player.attributes;

  const radarData = [
    { subject: 'ATT',  A: ((attr['Finishing']    || 0) + (attr['OffTheBall']  || 0) + (attr['Anticipation'] || 0) + (attr['Decisions'] || 0)) / 4 },
    { subject: 'TECH', A: ((attr['Technique']    || 0) + (attr['Passing']     || 0) + (attr['Dribbling']   || 0) + (attr['Crossing']  || 0)) / 4 },
    { subject: 'PHYS', A: ((attr['Acceleration'] || 0) + (attr['Pace']        || 0) + (attr['Stamina']     || 0) + (attr['Strength']  || 0) + (attr['Agility'] || 0)) / 5 },
    { subject: 'DEF',  A: ((attr['Tackling']     || 0) + (attr['Marking']     || 0) + (attr['Positioning'] || 0) + (attr['Heading']   || 0)) / 4 },
    { subject: 'MENT', A: ((attr['Bravery']      || 0) + (attr['Determination']|| 0) + (attr['WorkRate']   || 0) + (attr['Teamwork']  || 0)) / 4 },
  ];

  const mainColumns: string[][] = [
    ['Acceleration','Aggression','Agility','Anticipation','Balance','Bravery','Corners','Creativity','Crossing','Decisions','Dribbling','Finishing'],
    ['Flair','Handling','Heading','Influence','Jumping','LongShots','Marking','OffTheBall','OneOnOnes','Pace','Passing','Penalties'],
    ['Positioning','Reflexes','SetPieces','Stamina','Strength','Tackling','Teamwork','Technique','ThrowIns','WorkRate','LeftFoot','RightFoot'],
  ];

  const hiddenAttrs: string[] = [
    'Consistency','Dirtiness','ImportantMatches','InjuryProneness','NaturalFitness','Versatility',
    'Adaptability','Ambition','Determination','Loyalty','Pressure','Professionalism','Sportsmanship','Temperament',
  ];

  return (
    <div className="flex-1 bg-[#0E0E0E] flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-[#1C1B1B] w-full h-[100px] flex items-center px-8 border-b border-[#2A2A2A] shrink-0">
        <button onClick={() => navigate('/scout-lab')} className="mr-8 text-white hover:text-[#E8F000] transition-colors">
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-6">
          <div className="bg-scout-yellow px-4 py-1.5 rounded text-black font-bebas text-2xl tracking-tighter shadow-lg">
            {headerPos}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <h1 className="font-bebas text-[24px] leading-none text-white tracking-widest uppercase">
                {player.commonName || `${player.firstName} ${player.lastName}`}
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
              Born {player.dob?.toLocaleDateString('de-DE') || 'Unknown'} &middot; Age {player.age} &middot; {player.nationalityName}
            </p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-10 flex gap-[24px]">
        {/* Left 60% — attribute grid */}
        <div className="w-[60%] space-y-[16px]">
          <div className="grid grid-cols-3 gap-x-12">
            {mainColumns.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col">
                {col.map((attrName, rowIdx) => (
                  <div 
                    key={attrName} 
                    className={`h-[32px] px-3 flex justify-between items-center transition-colors ${rowIdx % 2 === 0 ? 'bg-[#1C1B1B]' : 'bg-[#202020]'}`}
                  >
                    <span className="text-[#888888] text-[13px] font-medium tracking-tight truncate pr-1">{fmt(attrName)}</span>
                    <span className={`font-outfit text-[14px] font-bold ${getAttributeColor(attr[attrName] || 0, attrName)}`}>
                      {attr[attrName] ?? '-'}
                    </span>
                  </div>
                ))}
                {colIdx === 2 && (
                  <div className="mt-4 bg-[#1C1B1B] rounded-xl p-3 flex flex-col items-center border border-[#2A2A2A]">
                    <span className="text-[#888888] text-[11px] font-bold tracking-[0.2em] mb-2 uppercase">SPREAD</span>
                    <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <RadarChart cx="50%" cy="50%" outerRadius="65" data={radarData}>
                          <PolarGrid stroke="#2A2A2A" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 7, fontWeight: 700, letterSpacing: '0.1em' }} />
                          <Radar name="Player" dataKey="A" stroke="#E8F000" fill="#E8F000" fillOpacity={0.1} strokeWidth={1.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hidden Attributes */}
          <div className="pt-4">
            <h3 className="text-scout-yellow text-[12px] font-bold tracking-[0.2em] uppercase mb-[16px]">HIDDEN ATTRIBUTES</h3>
            <div className="grid grid-cols-3 gap-x-12">
              {[0, 1, 2].map((colIdx) => {
                const perCol = Math.ceil(hiddenAttrs.length / 3);
                return (
                  <div key={colIdx} className="flex flex-col">
                    {hiddenAttrs.slice(colIdx * perCol, colIdx * perCol + perCol).map((attrName, rowIdx) => (
                      <div key={attrName} className={`h-[32px] px-3 flex justify-between items-center ${rowIdx % 2 === 0 ? 'bg-[#1C1B1B]' : 'bg-[#202020]'}`}>
                        <span className="text-[#888888] text-[13px] font-medium tracking-tight truncate pr-1">{fmt(attrName)}</span>
                        <span className={`font-outfit text-[14px] font-bold ${getAttributeColor(attr[attrName] || 0, attrName)}`}>
                          {attr[attrName] ?? '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 40% — info cards */}
        <div className="w-[40%] flex flex-col gap-[16px]">
          {/* Contract & Value */}
          <div className="bg-[#1C1B1B] p-[20px] rounded-xl">
            {[
              { label: 'CLUB',   value: player.clubName  || 'FREE AGENT' },
              { label: 'LEAGUE', value: player.divisionName || '—' },
              { label: 'VALUE',  value: formatCurrency(player.value) },
              { label: 'WAGES',  value: formatCurrency(player.wage) + '/W' },
            ].map((stat, i, arr) => (
              <div key={i} className={`flex justify-between items-center ${i !== arr.length - 1 ? 'mb-[16px]' : ''}`}>
                <div className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase">{stat.label}</div>
                <div className="text-white font-bebas text-[15px] tracking-widest">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Positions */}
          <div className="bg-[#1C1B1B] p-[20px] rounded-xl">
            <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase mb-[16px]">POSITIONS</h3>
            <div className="space-y-1">
              {Object.entries(player.positions)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([p, v]) => (
                  <div key={p} className="flex justify-between items-center h-[24px]">
                    <span className="text-white text-[12px] font-bold tracking-widest uppercase">{p}</span>
                    <span className="text-scout-yellow font-outfit text-[13px] font-bold">{v as number}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Scouting Info */}
          <div className="bg-[#1C1B1B] p-[20px] rounded-xl">
            <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.2em] uppercase mb-[16px]">SCOUTING INFO</h3>
            <div className="space-y-3">
              {[
                { label: 'HOME REP',    value: player.reputation.home },
                { label: 'CURRENT REP', value: player.reputation.current },
                { label: 'WORLD REP',   value: player.reputation.world },
                { label: 'PREF. FOOT',  value: player.preferredFoot },
                { label: 'NATIONALITY', value: player.nationalityName },
                ...(player.secondNationalityName ? [{ label: '2ND NATION', value: player.secondNationalityName }] : []),
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[#666] text-[10px] font-bold tracking-[0.15em] uppercase">{row.label}</span>
                  <span className="text-white text-[11px] font-bold tracking-wider">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
