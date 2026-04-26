import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronDown, 
  TrendingUp, 
  Trophy, 
  MapPin,
  Clock,
  Shield,
  Activity,
  Zap,
  Target,
  UserPlus,
  LayoutGrid,
  Users
} from 'lucide-react';
import { Player } from '../lib/CM0102Parser';
import { getFlagUrl, formatCurrency, ALL_ATTRIBUTES } from '../lib/constants';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface ComparePlayersProps {
  players: Player[];
  compareSlots: { slot1: number | null; slot2: number | null };
  removeFromCompare: (slot: 1 | 2) => void;
  shortlist: number[];
  toggleShortlist: (id: number) => void;
  addToCompare: (id: number, slot: 1 | 2) => void;
}

export default function ComparePlayers({ 
  players, 
  compareSlots, 
  removeFromCompare,
  shortlist,
  toggleShortlist,
  addToCompare
}: ComparePlayersProps) {
  const navigate = useNavigate();
  const [activeActions, setActiveActions] = useState<number | null>(null);

  const playerA = players.find(p => p.id === compareSlots.slot1);
  const playerB = players.find(p => p.id === compareSlots.slot2);

  if (!playerA && !playerB) return (
    <div className="flex-1 bg-[#0E0E0E] flex flex-col items-center justify-center text-white">
      <p className="font-bebas text-4xl mb-4 tracking-widest uppercase">SELECT PLAYERS TO COMPARE</p>
      <button onClick={() => navigate('/scout-lab')} className="text-scout-yellow font-bold text-xs tracking-widest uppercase hover:underline text-[10px]">
        RETURN TO DATABASE
      </button>
    </div>
  );

  const getAttrColor = (val: number) => {
    if (val >= 15) return 'text-[#00FF85]';
    if (val >= 10) return 'text-scout-yellow';
    return 'text-[#FF4B4B]';
  };

  const categories = [
    { name: 'ATTACKING', attributes: ['finishing', 'offTheBall', 'longShots', 'composure'] },
    { name: 'TECHNICAL', attributes: ['technique', 'dribbling', 'passing', 'freeKicks', 'corners'] },
    { name: 'PHYSICAL', attributes: ['acceleration', 'pace', 'stamina', 'strength', 'agility', 'jumping'] },
    { name: 'MENTAL', attributes: ['determination', 'workRate', 'creativity', 'bravery', 'decisions', 'aggression', 'positioning'] },
    { name: 'DEFENDING', attributes: ['tackling', 'marking', 'heading'] },
    { name: 'GOALKEEPING', attributes: ['handling', 'reflexes', 'oneOnOnes'] }
  ];

  // Radar Data
  const radarData = [
    { 
      subject: 'ATT', 
      A: playerA ? (playerA.attributes.finishing + playerA.attributes.offTheBall) / 2 : 0, 
      B: playerB ? (playerB.attributes.finishing + playerB.attributes.offTheBall) / 2 : 0 
    },
    { 
      subject: 'TECH', 
      A: playerA ? (playerA.attributes.technique + playerA.attributes.passing) / 2 : 0, 
      B: playerB ? (playerB.attributes.technique + playerB.attributes.passing) / 2 : 0 
    },
    { 
      subject: 'PHYS', 
      A: playerA ? (playerA.attributes.acceleration + playerA.attributes.pace) / 2 : 0, 
      B: playerB ? (playerB.attributes.acceleration + playerB.attributes.pace) / 2 : 0 
    },
    { 
      subject: 'MENT', 
      A: playerA ? (playerA.attributes.determination + playerA.attributes.creativity) / 2 : 0, 
      B: playerB ? (playerB.attributes.determination + playerB.attributes.creativity) / 2 : 0 
    },
    { 
      subject: 'DEFEN', 
      A: playerA ? (playerA.attributes.tackling + playerA.attributes.marking) / 2 : 0, 
      B: playerB ? (playerB.attributes.tackling + playerB.attributes.marking) / 2 : 0 
    },
  ];

  const renderActions = (playerId: number, slot: 1 | 2) => (
    <div className="relative">
      <button 
        onClick={() => setActiveActions(activeActions === playerId ? null : playerId)}
        className="flex items-center gap-2 px-3 py-1 bg-[#1C1B1B] rounded text-[10px] text-[#888888] font-bold tracking-widest hover:text-white transition-colors"
      >
        ACTIONS <ChevronDown size={12} />
      </button>
      {activeActions === playerId && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-[#1C1B1B] border border-[#2A2A2A] rounded shadow-2xl z-50 overflow-hidden">
          {[
            { 
              label: shortlist.includes(playerId) ? 'REMOVE FROM SHORTLIST' : 'ADD TO SHORTLIST', 
              icon: UserPlus,
              onClick: () => toggleShortlist(playerId)
            },
            { 
              label: `REMOVE FROM SLOT ${slot}`, 
              icon: LayoutGrid,
              onClick: () => removeFromCompare(slot)
            },
            { label: 'ADD TO XI', icon: Users, onClick: () => {} }
          ].map((act, i) => (
            <button 
              key={i} 
              onClick={() => { act.onClick(); setActiveActions(null); }}
              className="w-full px-4 py-2 text-left text-[10px] font-bold tracking-widest text-[#888888] hover:bg-[#E8F000] hover:text-black flex items-center gap-3 transition-colors"
            >
              <act.icon size={12} />
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0E0E0E] overflow-hidden">
      {/* Header Row */}
      <header className="h-[120px] shrink-0 border-b border-[#1C1B1B] bg-[#0E0E0E] flex flex-col items-center justify-center relative px-8">
        <button 
          onClick={() => navigate(-1)}
          className="absolute left-8 top-1/2 -translate-y-1/2 p-2 hover:bg-[#1C1B1B] rounded-full transition-colors group"
        >
          <ArrowLeft className="text-[#444444] group-hover:text-white" size={24} />
        </button>

        <div className="flex items-center gap-16 w-full max-w-4xl justify-center">
          {/* Player A Header */}
          <div className={`flex flex-col items-center flex-1 ${!playerA ? 'opacity-20' : ''}`}>
             <div className="flex items-center gap-2 mb-1">
               <span className="bg-scout-yellow text-black text-[10px] font-black px-1.5 py-0.5 rounded italic">STC</span>
               <h1 className="font-bebas text-2xl text-white tracking-widest uppercase truncate max-w-[200px]">
                 {playerA ? `${playerA.firstName} ${playerA.lastName}` : 'EMPTY SLOT 1'}
               </h1>
             </div>
             {playerA && renderActions(playerA.id, 1)}
          </div>

          <div className="font-bebas text-4xl text-[#1C1B1B] italic">VS</div>

          {/* Player B Header */}
          <div className={`flex flex-col items-center flex-1 ${!playerB ? 'opacity-20' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-bebas text-2xl text-white tracking-widest uppercase truncate max-w-[200px]">
                {playerB ? `${playerB.firstName} ${playerB.lastName}` : 'EMPTY SLOT 2'}
              </h1>
              <span className="bg-white/10 text-[#888888] text-[10px] font-black px-1.5 py-0.5 rounded italic">STC</span>
            </div>
            {playerB && renderActions(playerB.id, 2)}
          </div>
        </div>
      </header>

      {/* Main Comparison Body */}
      <div className="flex-1 overflow-y-auto px-8 py-10 flex flex-col items-center">
        <div className="w-full max-w-5xl grid grid-cols-[1fr_2fr_1fr] gap-8">
          
          {/* Attributes Duel */}
          <div className="flex flex-col gap-10">
            {categories.slice(0, 3).map(cat => (
              <div key={cat.name} className="flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-scout-yellow" />
                  <h3 className="font-bebas text-[14px] text-white tracking-widest">{cat.name}</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {cat.attributes.map(attrKey => {
                    const valA = playerA ? (playerA.attributes as any)[attrKey] || 0 : 0;
                    const valB = playerB ? (playerB.attributes as any)[attrKey] || 0 : 0;
                    const isWinnerA = playerA && playerB && valA > valB;
                    const isWinnerB = playerA && playerB && valB > valA;
                    
                    return (
                      <div key={attrKey} className="grid grid-cols-[40px_1fr_40px] items-center text-[11px] font-bold tracking-wider">
                        <div className={`text-right ${playerA ? getAttrColor(valA) : 'text-[#222]'} ${isWinnerA ? 'ring-1 ring-scout-yellow/50 bg-scout-yellow/5 px-1 rounded shadow-[0_0_10px_rgba(205,255,0,0.1)]' : ''}`}>{playerA ? valA : '-'}</div>
                        <div className="text-center text-[#CCCCCC] uppercase px-4 whitespace-nowrap">{attrKey.replace(/([A-Z])/g, ' $1')}</div>
                        <div className={`text-left ${playerB ? getAttrColor(valB) : 'text-[#222]'} ${isWinnerB ? 'ring-1 ring-white/20 bg-white/5 px-1 rounded shadow-[0_0_10px_rgba(255,255,255,0.05)]' : ''}`}>{playerB ? valB : '-'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Central Visual Block */}
          <div className="flex flex-col items-center gap-8">
            {/* Superimposed Radar Chart */}
            <div className="w-full aspect-square bg-[#0E0E0E] relative p-4 group">
               <div className="absolute inset-0 border border-[#1C1B1B] rounded-full scale-90 pointer-events-none opacity-20"></div>
               <div className="absolute inset-0 border border-[#1C1B1B] rounded-full scale-75 pointer-events-none opacity-10"></div>
               
               <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#1C1B1B" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 10, fontWeight: 900 }} />
                  {/* Player A Overlay (Yellow) */}
                  {playerA && (
                    <Radar
                      name={playerA.commonName}
                      dataKey="A"
                      stroke="#CDFF00"
                      fill="#CDFF00"
                      fillOpacity={0.3}
                    />
                  )}
                  {/* Player B Overlay (Cyan/White) */}
                  {playerB && (
                    <Radar
                      name={playerB.commonName}
                      dataKey="B"
                      stroke="#00FFFF"
                      fill="#00FFFF"
                      fillOpacity={0.15}
                    />
                  )}
                </RadarChart>
              </ResponsiveContainer>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                {playerA && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-scout-yellow"></div>
                    <span className="text-[10px] font-black text-white">{playerA.commonName?.toUpperCase() || (playerA.firstName + ' ' + playerA.lastName).toUpperCase()}</span>
                  </div>
                )}
                {playerB && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00FFFF]"></div>
                    <span className="text-[10px] font-black text-[#888888]">{playerB.commonName?.toUpperCase() || (playerB.firstName + ' ' + playerB.lastName).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sparse Data Blocks */}
            <div className="w-full flex flex-col gap-4 mt-8">
              {[
                { label: 'CLUB', valA: playerA?.clubName, valB: playerB?.clubName },
                { label: 'NATION', valA: playerA?.nationalityName, valB: playerB?.nationalityName },
                { label: 'VALUE', valA: playerA ? formatCurrency(playerA.value) : null, valB: playerB ? formatCurrency(playerB.value) : null },
                { label: 'AGE', valA: playerA?.age, valB: playerB?.age },
                { label: 'CA / PA', valA: playerA ? `${playerA.currentAbility} / ${playerA.potentialAbility}` : null, valB: playerB ? `${playerB.currentAbility} / ${playerB.potentialAbility}` : null }
              ].map(row => (
                <div key={row.label} className="bg-[#1C1B1B]/30 rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-scout-yellow opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-[8px] font-black text-[#888888] tracking-[0.3em] mb-2">{row.label}</div>
                  <div className="flex items-center gap-4 w-full justify-center">
                    <div className="flex-1 text-right font-sans font-bold text-[12px] text-white truncate">{row.valA || '-'}</div>
                    <div className="text-[#444444] text-[10px] font-black italic">VS</div>
                    <div className="flex-1 text-left font-sans font-bold text-[12px] text-[#888888] truncate">{row.valB || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attributes Duel (Columns 4-6) */}
          <div className="flex flex-col gap-10">
            {categories.slice(3).map(cat => (
              <div key={cat.name} className="flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-scout-yellow" />
                  <h3 className="font-bebas text-[14px] text-white tracking-widest">{cat.name}</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {cat.attributes.map(attrKey => {
                    const valA = playerA ? (playerA.attributes as any)[attrKey] || 0 : 0;
                    const valB = playerB ? (playerB.attributes as any)[attrKey] || 0 : 0;
                    const isWinnerA = playerA && playerB && valA > valB;
                    const isWinnerB = playerA && playerB && valB > valA;
                    
                    return (
                      <div key={attrKey} className="grid grid-cols-[40px_1fr_40px] items-center text-[11px] font-bold tracking-wider">
                        <div className={`text-right ${playerA ? getAttrColor(valA) : 'text-[#222]'} ${isWinnerA ? 'ring-1 ring-scout-yellow/50 bg-scout-yellow/5 px-1 rounded shadow-[0_0_10px_rgba(205,255,0,0.1)]' : ''}`}>{playerA ? valA : '-'}</div>
                        <div className="text-center text-[#CCCCCC] uppercase px-4 whitespace-nowrap">{attrKey.replace(/([A-Z])/g, ' $1')}</div>
                        <div className={`text-left ${playerB ? getAttrColor(valB) : 'text-[#222]'} ${isWinnerB ? 'ring-1 ring-white/20 bg-white/5 px-1 rounded shadow-[0_0_10px_rgba(255,255,255,0.05)]' : ''}`}>{playerB ? valB : '-'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
