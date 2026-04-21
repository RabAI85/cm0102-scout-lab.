/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, 
  Download, 
  Database, 
  Users, 
  Trophy, 
  Globe, 
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import { CM0102Parser, Player } from './lib/CM0102Parser';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: string;
}

export default function App() {
  const [view, setView] = useState<'import' | 'scout-lab'>('import');
  const [players, setPlayers] = useState<Player[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stats, setStats] = useState({
    avgCA: 0,
    clubsFound: 0,
    latency: 0,
    totalRecords: 0,
    positions: { GK: 0, DEF: 0, MID: 0, FWD: 0 }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('currentAbility');
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('desc');
  const [importProgress, setImportProgress] = useState(0);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'name', 'flag', 'pos', 'age', 'clubName', 'value', 'wage', 'currentAbility', 'potentialAbility', 'injuryProne', 'impMatches', 'consistency'
  ]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 240,
    flag: 40,
    pos: 70,
    age: 55,
    clubName: 160,
    value: 100,
    wage: 100,
    currentAbility: 55,
    potentialAbility: 55,
    injuryProne: 55,
    impMatches: 55,
    consistency: 55,
  });
  const [filters, setFilters] = useState({
    categories: [] as string[],
    sides: [] as string[],
    minAge: 15,
    maxAge: 45,
    minCA: 0,
    maxCA: 200,
    minPA: 0,
    maxPA: 200,
    minValue: 0,
    maxValue: 50000000,
    minConsistency: 0,
    minImportantMatches: 0,
    minNaturalFitness: 0,
    maxInjuryProneness: 20,
  });
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (cat: string) => {
    setFilters(f => {
      const isGK = cat === 'GK';
      const exists = f.categories.includes(cat);
      let newCats = exists ? f.categories.filter(c => c !== cat) : [...f.categories, cat];
      
      // If we remove the category, we might want to keep the sides or clear them if no other multi-side cat is selected
      // But for simplicity, we just toggle.
      return { ...f, categories: newCats };
    });
  };

  const toggleSide = (side: string) => {
    setFilters(f => {
      const exists = f.sides.includes(side);
      return { ...f, sides: exists ? f.sides.filter(s => s !== side) : [...f.sides, side] };
    });
  };

  const itemsPerPage = 100;

  const NATION_ISO_MAP: Record<string, string> = {
    'England': 'gb', 'Scotland': 'gb', 'Wales': 'gb', 'Ireland': 'ie', 'Northern Ireland': 'gb',
    'France': 'fr', 'Germany': 'de', 'Italy': 'it', 'Spain': 'es', 'Portugal': 'pt', 'Netherlands': 'nl',
    'Belgium': 'be', 'Brazil': 'br', 'Argentina': 'ar', 'Sweden': 'se', 'Norway': 'no', 'Denmark': 'dk',
    'Finland': 'fi', 'Japan': 'jp', 'South Korea': 'kr', 
    'Australia': 'au', 'USA': 'us', 'Canada': 'ca', 'Mexico': 'mx', 'Nigeria': 'ng', 'Cameroon': 'cm',
    'Senegal': 'sn', 'Egypt': 'eg', 'Morocco': 'ma', 'South Africa': 'za', 'Russia': 'ru',
    'Croatia': 'hr', 'Serbia': 'rs', 'Turkey': 'tr', 'Greece': 'gr', 'Poland': 'pl',
    'Ukraine': 'ua', 'Switzerland': 'ch', 'Austria': 'at', 'Czech Republic': 'cz', 'Romania': 'ro',
    'Bulgaria': 'bg', 'Hungary': 'hu', 'Slovakia': 'sk', 'Slovenia': 'si', 'Iceland': 'is',
    'Israel': 'il', 'Saudi Arabia': 'sa', 'China': 'cn', 'Tunisia': 'tn', 'Uruguay': 'uy', 'Colombia': 'co',
    'Chile': 'cl', 'Paraguay': 'py', 'Peru': 'pe', 'Ecuador': 'ec', 'Bolivia': 'bo', 'Venezuela': 've'
  };

  const getFlagUrl = (nationality: string) => {
    const cc = NATION_ISO_MAP[nationality] || 'un';
    return `https://flagcdn.com/16x12/${cc.toLowerCase()}.png`;
  };

  const ALL_ATTRIBUTES = [
    'Acceleration', 'Aggression', 'Agility', 'Anticipation', 'Balance', 'Bravery', 'Consistency', 
    'Corners', 'Crossing', 'Decisions', 'Dirtiness', 'Dribbling', 'Finishing', 'Flair', 'Handling', 
    'Heading', 'Important Matches', 'Injury Proneness', 'Jumping', 'Influence', 'Left Foot', 
    'Right Foot', 'Long Shots', 'Marking', 'Natural Fitness', 'Off The Ball', 'One On Ones', 
    'Pace', 'Passing', 'Penalties', 'Positioning', 'Reflexes', 'Stamina', 'Strength', 'Tackling', 
    'Teamwork', 'Technique', 'Versatility', 'Creativity', 'Work Rate', 'Adaptability', 'Ambition', 
    'Determination', 'Loyalty', 'Pressure', 'Professionalism', 'Sportsmanship', 'Temperament'
  ];

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, colKey: string } | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev.slice(-100), {
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }]);
  };

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setImportProgress(0);
    setLogs([]);
    setPlayers([]);
    const startTime = performance.now();

    addLog(`Initializing parser for ${file.name}...`, 'info');
    
    const progressInterval = setInterval(() => {
      setImportProgress(prev => prev < 90 ? prev + (Math.random() * 10) : prev);
    }, 150);

    try {
      const buffer = await file.arrayBuffer();
      const parser = new CM0102Parser(buffer, (msg, type) => addLog(msg, type));
      
      const parsedPlayers = parser.getPlayers();
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      const avgCA = parsedPlayers.length > 0 
        ? parsedPlayers.reduce((acc, p) => acc + p.currentAbility, 0) / parsedPlayers.length 
        : 0;
      
      const uniqueClubs = new Set(parsedPlayers.map(p => p.clubName)).size;

      const posCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
      parsedPlayers.forEach(p => {
        if (p.positions["Goalkeeper"] > 10) posCounts.GK++;
        else if (p.positions["Attacker"] > 10) posCounts.FWD++;
        else if (p.positions["Defender"] > 10 || p.positions["Sweeper"] > 10) posCounts.DEF++;
        else posCounts.MID++;
      });

      setPlayers(parsedPlayers);
      setStats({
        avgCA: parseFloat(avgCA.toFixed(1)),
        clubsFound: uniqueClubs,
        latency,
        totalRecords: parsedPlayers.length,
        positions: posCounts
      });
      
      addLog(`Ready. Table view populated in ${latency}ms.`, 'success');
      setIsParsing(false);
    } catch (error) {
      clearInterval(progressInterval);
      addLog(error instanceof Error ? error.message : "Unknown error occurred during parsing", 'error');
      setIsParsing(false);
    }
  };

  const sortPlayers = (list: Player[]) => {
    if (!sortBy || !sortDir) return list;
    return [...list].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortBy.startsWith('attributes.')) {
        const attrKey = sortBy.split('.')[1];
        valA = a.attributes[attrKey] || 0;
        valB = b.attributes[attrKey] || 0;
      } else if (sortBy === 'name') {
        valA = `${a.firstName} ${a.lastName} ${a.commonName}`;
        valB = `${b.firstName} ${b.lastName} ${b.commonName}`;
      } else {
        valA = (a as any)[sortBy];
        valB = (b as any)[sortBy];
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filteredPlayers = sortPlayers(players.filter(p => {
    const matchesSearch = `${p.firstName} ${p.lastName} ${p.commonName} ${p.clubName} ${p.nationalityName}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPosition = filters.categories.length === 0 || filters.categories.some(cat => {
      let types: string[] = [];
      if (cat === 'GK') types = ['Goalkeeper'];
      if (cat === 'DEF') types = ['Defender', 'Sweeper'];
      if (cat === 'MID') types = ['DefensiveMidfielder', 'Midfielder', 'AttackingMidfielder'];
      if (cat === 'ATT') types = ['Attacker'];
      
      const hasType = types.some(t => (p.positions as any)[t] > 10);
      if (!hasType) return false;
      if (cat === 'GK') return true; // GK has no sides

      if (filters.sides.length === 0) return true;
      const sideMap: any = { 'Left': 'LeftSide', 'Right': 'RightSide', 'Centre': 'CentreSide' };
      return filters.sides.some(side => (p.positions as any)[sideMap[side]] > 10);
    });

    const matchesAge = p.age >= filters.minAge && p.age <= filters.maxAge;
    const matchesCA = p.currentAbility >= filters.minCA && p.currentAbility <= filters.maxCA;
    const matchesPA = p.potentialAbility >= filters.minPA && p.potentialAbility <= filters.maxPA;
    const matchesValue = p.value >= filters.minValue && p.value <= filters.maxValue;

    const matchesHidden = 
      (p.attributes['Consistency'] || 0) >= filters.minConsistency &&
      (p.attributes['ImportantMatches'] || 0) >= filters.minImportantMatches &&
      (p.attributes['NaturalFitness'] || 0) >= filters.minNaturalFitness &&
      (p.attributes['InjuryProneness'] || 0) <= filters.maxInjuryProneness;

    return matchesSearch && matchesPosition && matchesAge && matchesCA && matchesPA && matchesValue && matchesHidden;
  }));

  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const currentItems = filteredPlayers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportJson = () => {
    if (players.length === 0) return;
    const blob = new Blob([JSON.stringify(players, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `players_${fileName?.replace('.sav', '') || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `£${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `£${(val / 1000).toFixed(0)}k`;
    return `£${val}`;
  };

  const getAttributeColor = (val: number) => {
    if (val >= 18) return 'text-red-400 font-bold';
    if (val >= 15) return 'text-orange-400';
    if (val >= 10) return 'text-[#E6EDF3]';
    return 'text-[#8B949E]';
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      if (sortDir === 'desc') setSortDir('asc');
      else if (sortDir === 'asc') {
        setSortBy(null);
        setSortDir(null);
      }
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      sides: [],
      minAge: 15,
      maxAge: 45,
      minCA: 0,
      maxCA: 200,
      minPA: 0,
      maxPA: 200,
      minValue: 0,
      maxValue: 50000000,
      minConsistency: 0,
      minImportantMatches: 0,
      minNaturalFitness: 0,
      maxInjuryProneness: 20,
    });
    setSearchTerm('');
  };

  const removeCategory = (cat: string) => {
    setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== cat) }));
  };

  const removeSide = (side: string) => {
    setFilters(f => ({ ...f, sides: f.sides.filter(s => s !== side) }));
  };

  if (view === 'import') {
    return (
      <div className="bg-[#0E0E0E] text-[#E0E0E0] min-h-screen flex flex-col items-center py-20 font-sans overflow-auto">
        <div className="w-full max-w-[680px] space-y-[32px]">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-bebas text-[72px] text-white tracking-tight leading-none">SCOUT <span className="text-[#E8F000]">LAB</span></h1>
            <p className="font-sans text-[12px] tracking-[0.2em] font-medium text-[#888888] uppercase">
              CHAMPIONSHIP MANAGER 01/02 AI SCOUT
            </p>
          </div>

          {/* File Drop Zone Card */}
          <div className="space-y-[11px]">
            <label className="font-sans font-bold text-[11px] tracking-widest text-[#E8F000] uppercase block ml-1">
              LOAD SAVE FILE
            </label>
            <div className="bg-[#1C1B1B] p-10 rounded-2xl space-y-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2A2A2A] bg-[#1C1B1B] hover:bg-[#252424] transition-colors rounded-xl p-16 flex flex-col items-center justify-center gap-4 cursor-pointer group"
              >
                <FileUp size={48} className="text-[#888888] group-hover:text-[#E8F000] transition-colors" />
                <p className="font-sans text-sm text-[#888888] tracking-widest uppercase">Drop your .sav file here</p>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".sav" />
              </div>

              <button 
                onClick={() => { if (players.length > 0) setView('scout-lab'); }}
                disabled={isParsing || (!players.length && !fileName)}
                className="w-full py-4 rounded-full bg-[#E8F000] text-black font-bebas text-[20px] tracking-wider hover:bg-[#C8D000] disabled:opacity-10 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                ACCESS SCOUTING NETWORK →
              </button>
            </div>
          </div>

          {/* Progress Card */}
          {(isParsing || (players.length > 0 && importProgress < 100)) && (
            <div className="bg-[#1C1B1B] p-8 rounded-2xl space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E8F000] animate-pulse"></div>
                  <span className="font-bebas text-lg text-white tracking-widest uppercase">SCOUTING NETWORK</span>
                  <span className="bg-[#2A2A2A] text-[#8B949E] text-[10px] px-2 py-0.5 rounded font-bold ml-2">SCANNING ACTIVE</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="font-sans text-[11px] text-[#E8F000] font-bold uppercase tracking-wider">SCANNING 10,000 PLAYERS...</span>
                  <span className="font-bebas text-xl text-white">{Math.round(importProgress)}%</span>
                </div>
                <div className="w-full bg-[#2A2A2A] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#E8F000] h-full transition-all duration-300 ease-out" 
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="space-y-1">
                  <div className="font-sans text-[11px] text-[#888888] uppercase tracking-tighter">PLAYERS FOUND</div>
                  <div className="font-mono text-[11px] text-white">{players.length.toLocaleString()}</div>
                </div>
                <div className="space-y-1 text-center">
                  <div className="font-sans text-[11px] text-[#888888] uppercase tracking-tighter">SQUAD SIZE</div>
                  <div className="font-mono text-[11px] text-white">DETECTING...</div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="font-sans text-[11px] text-[#888888] uppercase tracking-tighter">LEAGUES LOADED</div>
                  <div className="font-mono text-[11px] text-white">42</div>
                </div>
              </div>
            </div>
          )}

          {/* Success Card */}
          {players.length > 0 && !isParsing && importProgress >= 100 && (
            <div className="bg-[#1C1B1B] p-10 rounded-2xl space-y-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 rounded-full border-2 border-[#E8F000] flex items-center justify-center text-[#E8F000]">
                <div className="w-8 h-8 flex items-center justify-center leading-none text-2xl font-bold">✓</div>
              </div>

              <div className="space-y-2">
                <div className="font-bebas text-[80px] leading-none text-white tracking-tight">
                  {stats.totalRecords.toLocaleString()} PLAYERS LOADED
                </div>
                <div className="font-sans text-[12px] tracking-[0.2em] text-[#888888] uppercase font-medium">
                  SQUAD DATABASE READY
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 w-full">
                {Object.entries(stats.positions).map(([pos, count]) => (
                  <div key={pos} className="bg-[#2A2A2A] p-4 rounded-xl space-y-1 group hover:bg-[#333333] transition-colors">
                    <div className="font-bebas text-3xl text-white tracking-widest">{count.toLocaleString()}</div>
                    <div className="font-sans text-[10px] text-[#888888] uppercase tracking-widest font-bold">{pos}</div>
                  </div>
                ))}
              </div>

              <div className="w-full flex justify-between items-center py-4 border-t border-[#2A2A2A]/30">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[10px] text-[#888888] uppercase tracking-widest font-bold">DATA INTEGRITY</span>
                  <span className="font-sans text-[10px] text-[#E8F000] font-bold">OPTIMISED FOR v3.9.68</span>
                </div>
                <Database size={16} className="text-[#888888]" />
              </div>

              <button 
                onClick={() => setView('scout-lab')}
                className="w-full py-4 rounded-full bg-[#E8F000] text-black font-bebas text-[20px] tracking-widest hover:bg-[#C8D000] transition-all flex items-center justify-center gap-2"
              >
                ENTER SCOUT LAB →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0E0E0E] text-[#E0E0E0] h-screen w-screen flex font-sans overflow-hidden">
      {/* 1. Narrow Left Nav */}
      <nav className={`${isNavCollapsed ? 'w-[64px]' : 'w-[100px]'} bg-[#0E0E0E] flex flex-col items-center py-6 shrink-0 border-r border-[#1C1B1B] transition-all duration-300 relative group`}>
        <button 
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          className="absolute -right-3 top-24 z-20 w-6 h-6 bg-[#1C1B1B] border border-[#2A2A2A] rounded-full flex items-center justify-center text-[#888888] hover:text-[#E8F000] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isNavCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div onClick={() => setView('import')} className={`font-bebas text-[#E8F000] cursor-pointer mb-10 flex flex-col items-center leading-none transition-all ${isNavCollapsed ? 'text-[20px]' : 'text-[28px]'}`}>
          <span>SCOUT</span>
          {!isNavCollapsed && <span>LAB</span>}
        </div>
        
        <div className="flex flex-col gap-6 w-full items-center">
          {[
            { icon: Database, label: 'DATA' },
            { icon: Search, label: 'SCOUT', active: true },
            { icon: Users, label: 'SQUAD' },
            { icon: Trophy, label: 'LEAGUE' },
            { icon: Globe, label: 'WORLD' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer w-full px-2">
              <div className={`p-2.5 rounded-xl transition-all ${item.active ? 'bg-[#E8F000] text-black shadow-[0_0_15px_rgba(232,240,0,0.3)]' : 'text-[#888888] hover:bg-[#1C1B1B] hover:text-white'}`}>
                <item.icon size={18} />
              </div>
              {!isNavCollapsed && <span className={`text-[8px] font-bold tracking-widest ${item.active ? 'text-[#E8F000]' : 'text-[#888888]'}`}>{item.label}</span>}
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <div className="p-2 text-[#888888] hover:text-white cursor-pointer mb-4">
            <Clock size={18} />
          </div>
        </div>
      </nav>

      {/* 2. Filter Sidebar */}
      <aside className={`${isFilterCollapsed ? 'w-0 opacity-0 px-0' : 'w-[280px] p-6 opacity-100'} bg-[#1C1B1B] flex flex-col shrink-0 overflow-y-auto scrollbar-hide shadow-2xl z-10 transition-all duration-300 relative group/sidebar`}>
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="font-bebas text-2xl text-white tracking-widest">FILTERS</h2>
            <button onClick={clearFilters} className="text-[#E8F000] text-[9px] font-bold tracking-widest uppercase hover:underline">CLEAR ALL</button>
          </div>

          <button 
            onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
            className={`absolute -right-3 top-[34px] z-50 w-6 h-6 rounded-full bg-white flex items-center justify-center transition-all duration-200 hover:bg-[#E8F000] group/toggle ${isFilterCollapsed ? '' : ''}`}
          >
            {isFilterCollapsed ? (
              <ChevronRight size={14} className="text-[#E8F000] group-hover/toggle:text-black transition-colors" />
            ) : (
              <ChevronLeft size={14} className="text-[#E8F000] group-hover/toggle:text-black transition-colors" />
            )}
          </button>

          {/* POSITION SECTION */}
          <section className="space-y-4 font-sans">
            <h3 className="text-[9px] font-black text-[#888888] tracking-[0.2em] uppercase">POSITION</h3>
            <div className="space-y-3">
              {/* Row 1: GK */}
              <button 
                onClick={() => toggleCategory('GK')}
                className={`w-full py-1.5 rounded text-[9px] font-bold transition-all ${
                  filters.categories.includes('GK') 
                    ? 'bg-[#E8F000] text-black' 
                    : 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                }`}
              >
                GK
              </button>

              {/* Row 2: DEF, MID, ATT */}
              <div className="grid grid-cols-3 gap-1.5">
                {['DEF', 'MID', 'ATT'].map(cat => (
                  <div key={cat} className="space-y-1.5">
                    <button 
                      onClick={() => toggleCategory(cat)}
                      className={`w-full py-1.5 rounded text-[9px] font-bold transition-all ${
                        filters.categories.includes(cat) 
                          ? 'bg-[#E8F000] text-black' 
                          : 'bg-[#2A2A2A] text-white hover:bg-[#333333]'
                      }`}
                    >
                      {cat}
                    </button>
                    <div className="grid grid-cols-3 gap-0.5">
                      {['Left', 'Centre', 'Right'].map(side => (
                        <button
                          key={side}
                          onClick={() => toggleSide(side)}
                          className={`w-full py-1 rounded text-[7px] font-bold transition-all ${
                            filters.sides.includes(side)
                              ? 'bg-[#E8F000] text-black'
                              : 'bg-[#2A2A2A] text-[#888888] hover:bg-[#333333]'
                          }`}
                        >
                          {side[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
            
          <section className="space-y-3 font-sans">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-[#888888] tracking-widest uppercase">AGE RANGE</label>
              <span className="text-[#E8F000] font-mono text-[11px]">{filters.minAge} — {filters.maxAge}</span>
            </div>
            <input 
              type="range" min="15" max="45" value={filters.maxAge}
              onChange={(e) => setFilters(f => ({ ...f, maxAge: parseInt(e.target.value) }))}
              className="w-full accent-[#E8F000] bg-[#2A2A2A] h-1 rounded-full cursor-pointer"
            />
          </section>

          {/* CONTRACT & VALUE */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-[#888888] tracking-[0.2em] uppercase">FINANCIAL</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#888888] tracking-widest uppercase">MAX VALUE</label>
                <span className="text-[#E8F000] font-mono text-[11px]">{formatCurrency(filters.maxValue)}</span>
              </div>
              <input 
                type="range" min="0" max="50000000" step="100000" value={filters.maxValue}
                onChange={(e) => setFilters(f => ({ ...f, maxValue: parseInt(e.target.value) }))}
                className="w-full accent-[#E8F000] bg-[#2A2A2A] h-1 rounded-full cursor-pointer"
              />
            </div>
          </section>

          {/* ABILITY MATRIX */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold text-[#888888] tracking-[0.2em] uppercase">ABILITY MATRIX</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#888888] tracking-widest uppercase">MIN CA</label>
                <span className="text-[#E8F000] font-mono text-[11px]">{filters.minCA}</span>
              </div>
              <input 
                type="range" min="0" max="200" value={filters.minCA}
                onChange={(e) => setFilters(f => ({ ...f, minCA: parseInt(e.target.value) }))}
                className="w-full accent-[#E8F000] bg-[#2A2A2A] h-1 rounded-full cursor-pointer"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#888888] tracking-widest uppercase">MIN PA</label>
                <span className="text-[#E8F000] font-mono text-[11px]">{filters.minPA}</span>
              </div>
              <input 
                type="range" min="0" max="200" value={filters.minPA}
                onChange={(e) => setFilters(f => ({ ...f, minPA: parseInt(e.target.value) }))}
                className="w-full accent-[#E8F000] bg-[#2A2A2A] h-1 rounded-full cursor-pointer"
              />
            </div>
          </section>

          {/* HIDDEN & PHYSICAL */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-bold text-[#888888] tracking-[0.2em] uppercase">HIDDEN & PHYSICAL</h3>
            {[
              { label: 'MIN CONSISTENCY', key: 'minConsistency' },
              { label: 'MIN BIG MATCHES', key: 'minImportantMatches' },
              { label: 'NATURAL FITNESS', key: 'minNaturalFitness' }
            ].map(attr => (
              <div key={attr.key} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-[#888888] tracking-widest uppercase">{attr.label}</label>
                  <span className="text-[#E8F000] font-mono text-[11px]">{(filters as any)[attr.key]}</span>
                </div>
                <input 
                  type="range" min="0" max="20" value={(filters as any)[attr.key]}
                  onChange={(e) => setFilters(f => ({ ...f, [attr.key]: parseInt(e.target.value) }))}
                  className="w-full accent-[#E8F000] bg-[#2A2A2A] h-1 rounded-full cursor-pointer"
                />
              </div>
            ))}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-[#888888] tracking-widest uppercase">MAX INJURY PRONE</label>
                <span className="text-[#E8F000] font-mono text-[11px]">{filters.maxInjuryProneness}</span>
              </div>
              <input 
                type="range" min="1" max="20" value={filters.maxInjuryProneness}
                onChange={(e) => setFilters(f => ({ ...f, maxInjuryProneness: parseInt(e.target.value) }))}
                className="w-full accent-[#E8F000] bg-[#2A2A2A] h-1 rounded-full cursor-pointer"
              />
            </div>
          </section>

          <button className="w-full py-4 rounded-full bg-[#E8F000] text-black font-bebas text-lg tracking-widest shadow-[0_0_20px_rgba(232,240,0,0.2)] hover:bg-[#C8D000] transition-all">
            ADVANCED ATTRIBUTE FILTERS
          </button>
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 flex flex-col bg-[#0E0E0E] overflow-hidden relative">
        <header className="px-8 pt-6 pb-4 flex flex-col gap-4 border-b border-[#1C1B1B]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-6">
              {isFilterCollapsed && (
                <button 
                  onClick={() => setIsFilterCollapsed(false)}
                  className="flex items-center justify-center text-white hover:text-[#E8F000]"
                >
                  <ChevronRight size={14} />
                </button>
              )}
              <div className="flex items-baseline gap-4">
                <h2 className="font-bebas text-[29px] text-white tracking-widest leading-none translate-y-[2px]">GLOBAL DATABASE</h2>
                <div className="font-sans text-[9px] tracking-[0.2em] font-bold text-[#888888] uppercase whitespace-nowrap">
                  {filteredPlayers.length.toLocaleString()} PLAYERS LOADED
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]" />
                <input 
                  type="text"
                  placeholder="SCAN SYSTEM..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="bg-[#1C1B1B] border-none rounded-lg pl-10 pr-4 py-2 text-[10px] font-mono text-white focus:ring-1 focus:ring-[#E8F000] w-64 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {searchTerm && (
              <div className="bg-[#E8F000] text-black px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
                Query: {searchTerm} <X size={12} className="cursor-pointer" onClick={() => setSearchTerm('')} />
              </div>
            )}
          </div>
        </header>

        {/* Database Table */}
        <div className="flex-1 overflow-hidden px-4 pb-4 mt-2 flex flex-col">
          <div className="flex-1 bg-[#1C1B1B] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-1 overflow-auto scrollbar-hide">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 z-10 w-full bg-[#1C1B1B]">
                  <tr className="bg-[#1C1B1B]/90 backdrop-blur-md text-white text-[13px] uppercase tracking-[0.1em] font-black w-full flex">
                    {columnOrder.map((colKey) => {
                      const columns: any = {
                        name: { label: 'PLAYER NAME', sortKey: 'name' },
                        flag: { label: '', sortKey: 'nationalityName' },
                        pos: { label: 'POS', textAlign: 'center', sortKey: 'pos' },
                        age: { label: 'AGE', textAlign: 'center', sortKey: 'age' },
                        clubName: { label: 'CLUB', sortKey: 'clubName' },
                        value: { label: 'VALUE', textAlign: 'right', sortKey: 'value' },
                        wage: { label: 'WAGES', textAlign: 'right', sortKey: 'wage' },
                        currentAbility: { label: 'CA', textAlign: 'center', sortKey: 'currentAbility' },
                        potentialAbility: { label: 'PA', textAlign: 'center', sortKey: 'potentialAbility' },
                        injuryProne: { label: 'INJ', textAlign: 'center', sortKey: 'injuryProne' },
                        impMatches: { label: 'IMP', textAlign: 'center', sortKey: 'impMatches' },
                        consistency: { label: 'CNS', textAlign: 'center', sortKey: 'consistency' },
                      };
                      ALL_ATTRIBUTES.forEach(attr => {
                        if (!columns[attr]) {
                          columns[attr] = { label: attr.substring(0, 3).toUpperCase(), textAlign: 'center', sortKey: `attributes.${attr}` };
                        }
                      });
                      
                      const col = columns[colKey] || { label: colKey.substring(0, 3).toUpperCase(), textAlign: 'center', sortKey: colKey };
                      if (!col) return null;

                      const onContextMenu = (e: React.MouseEvent) => {
                        e.preventDefault();
                        setContextMenu({ x: e.pageX, y: e.pageY, colKey });
                      };

                      const handleDragStart = (e: React.DragEvent) => {
                        e.dataTransfer.setData('colKey', colKey);
                      };

                      const handleDrop = (e: React.DragEvent) => {
                        const sourceKey = e.dataTransfer.getData('colKey');
                        if (sourceKey === colKey) return;
                        const newOrder = [...columnOrder];
                        const sourceIdx = newOrder.indexOf(sourceKey);
                        const targetIdx = newOrder.indexOf(colKey);
                        newOrder.splice(sourceIdx, 1);
                        newOrder.splice(targetIdx, 0, sourceKey);
                        setColumnOrder(newOrder);
                      };

                      const handleDragOver = (e: React.DragEvent) => e.preventDefault();

                      const handleResizeMouseDown = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const startX = e.pageX;
                        const startWidth = columnWidths[colKey];

                        const onMouseMove = (moveEvent: MouseEvent) => {
                          const delta = moveEvent.pageX - startX;
                          setColumnWidths(prev => ({
                            ...prev,
                            [colKey]: Math.max(40, startWidth + delta)
                          }));
                        };

                        const onMouseUp = () => {
                          document.removeEventListener('mousemove', onMouseMove);
                          document.removeEventListener('mouseup', onMouseUp);
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                      };

                      return (
                        <th 
                          key={colKey}
                          draggable
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onContextMenu={onContextMenu}
                          onClick={() => col.sortKey && handleSort(col.sortKey)}
                          className={`p-3 relative flex items-center group/header overflow-visible cursor-pointer hover:bg-white/5 transition-colors active:cursor-grabbing ${col.textAlign === 'center' ? 'justify-center text-center' : col.textAlign === 'right' ? 'justify-end text-right' : 'pl-6'}`}
                          style={{ width: `${columnWidths[colKey]}px`, flexShrink: 0 }}
                        >
                          <div className={`flex items-center gap-1 ${col.textAlign === 'center' ? 'justify-center' : col.textAlign === 'right' ? 'justify-end' : ''} truncate`}>
                            {col.label}
                            {sortBy === col.sortKey && (
                              <TrendingUp size={10} className={`text-[#E8F000] ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                          {/* Resize Handle */}
                          <div 
                            onMouseDown={handleResizeMouseDown}
                            className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#2A2A2A] hover:bg-[#E8F000] cursor-col-resize transition-colors z-20 active:bg-[#E8F000]"
                          />
                        </th>
                      );
                    })}
                    <th 
                      className="flex-1 min-w-[40px] p-3 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={(e) => {
                        setContextMenu({ x: e.pageX, y: e.pageY, colKey: columnOrder[columnOrder.length - 1] });
                      }}
                    >
                      <button className="text-white font-bebas text-2xl leading-none opacity-40 group-hover:opacity-100 group-hover:text-[#E8F000] transition-all">
                        +
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[14px] font-sans">
                  {currentItems.map((player) => {
                    const consistency = player.attributes['Consistency'] || 0;
                    const impMatches = player.attributes['ImportantMatches'] || 0;
                    const injuryProne = player.attributes['InjuryProneness'] || 0;

                    const isPosActive = (pos: string) => filters.categories.some(cat => {
                       let types: string[] = [];
                       if (cat === 'GK') types = ['Goalkeeper'];
                       if (cat === 'DEF') types = ['Defender', 'Sweeper'];
                       if (cat === 'MID') types = ['DefensiveMidfielder', 'Midfielder', 'AttackingMidfielder'];
                       if (cat === 'ATT') types = ['Attacker'];
                       return types.includes(pos);
                    });

                    return (
                      <tr 
                        key={player.id} 
                        onClick={() => setSelectedPlayer(player)}
                        className="hover:bg-[#2A2A2A] text-[#E0E0E0] transition-colors cursor-pointer group flex w-full"
                      >
                        {columnOrder.map(colKey => {
                          const width = `${columnWidths[colKey]}px`;
                          switch (colKey) {
                            case 'name':
                              return (
                                <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] pl-6 overflow-hidden flex items-center">
                                  <div className="font-sans text-[14px] text-white uppercase tracking-tighter group-hover:text-[#E8F000] transition-colors truncate font-medium flex items-center overflow-hidden whitespace-nowrap">{player.firstName} {player.lastName}</div>
                                </td>
                              );
                            case 'flag':
                              return (
                                <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center flex items-center justify-center">
                                  <img 
                                    src={getFlagUrl(player.nationalityName)} 
                                    alt={player.nationalityName} 
                                    className="w-[16px] h-[12px] opacity-90 shadow-sm"
                                    referrerPolicy="no-referrer"
                                  />
                                </td>
                              );
                            case 'pos':
                              const getPrimaryPos = () => {
                                const vals = [
                                  { label: 'GK', val: (player.positions as any)['Goalkeeper'] || 0 },
                                  { label: 'D', val: (player.positions as any)['Defender'] || (player.positions as any)['D'] || 0 },
                                  { label: 'M', val: (player.positions as any)['Midfielder'] || (player.positions as any)['M'] || 0 },
                                  { label: 'AT', val: (player.positions as any)['Attacker'] || (player.positions as any)['S'] || 0 }
                                ];
                                return vals.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), vals[0]).label;
                              };
                              const displayPos = getPrimaryPos();
                              return (
                                <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] flex items-center justify-center">
                                  <div className={`px-1 py-0.5 rounded-[3px] text-[10px] font-black border border-white/5 whitespace-nowrap ${isPosActive(displayPos) ? 'bg-[#E8F000] text-black' : 'bg-[#2A2A2A] text-white'}`}>
                                    {displayPos}
                                  </div>
                                </td>
                              );
                            case 'age':
                              return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-mono flex items-center justify-center opacity-80">{player.age}</td>;
                            case 'clubName':
                              return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-[14px] text-white uppercase tracking-tighter truncate font-medium flex items-center overflow-hidden whitespace-nowrap">{player.clubName}</td>;
                            case 'value':
                              return (
                                <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-right font-mono font-bold text-white tracking-tighter flex items-center justify-end">
                                  {formatCurrency(player.value)}
                                </td>
                              );
                            case 'wage':
                              return (
                                <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-right font-mono font-bold text-white tracking-tighter opacity-70 flex items-center justify-end">
                                  {formatCurrency(player.wage).replace('.00', '').replace('M', 'K')}/W
                                </td>
                              );
                            case 'currentAbility':
                              return (
                                <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-mono font-black text-[#E8F000] flex items-center justify-center">
                                  {player.currentAbility}
                                </td>
                              );
                            case 'potentialAbility':
                              return (
                                <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-mono font-black text-[#E8F000] flex items-center justify-center">
                                  {player.potentialAbility}
                                </td>
                              );
                            case 'injuryProne':
                              return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-mono font-bold text-white flex items-center justify-center">{injuryProne}</td>;
                            case 'impMatches':
                              return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-mono font-bold text-white flex items-center justify-center">{impMatches}</td>;
                            case 'consistency':
                              return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-mono font-bold text-white flex items-center justify-center">{consistency}</td>;
                            default:
                              return null;
                          }
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination UI */}
            <div className="p-4 bg-[#1C1B1B] border-t border-[#2A2A2A]/50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 text-white hover:text-[#E8F000] disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 text-white hover:text-[#E8F000] disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="text-[10px] font-sans font-bold text-[#888888] uppercase tracking-widest">
                  SHOWING {(currentPage - 1) * itemsPerPage + 1} — {Math.min(currentPage * itemsPerPage, filteredPlayers.length)} OF {filteredPlayers.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-[#1C1B1B] shadow-2xl py-2 min-w-[200px] max-h-[400px] overflow-y-auto scrollbar-hide border border-[#2A2A2A]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.colKey !== 'name' && contextMenu.colKey !== 'flag' && (
            <button 
              onClick={() => {
                setColumnOrder(prev => prev.filter(k => k !== contextMenu.colKey));
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 text-[11px] font-bold text-red-500 hover:bg-[#2A2A2A] uppercase tracking-widest border-b border-[#2A2A2A]"
            >
              Remove Column
            </button>
          )}
          <div className="px-4 py-2 text-[9px] font-black text-[#888888] tracking-widest uppercase mb-1">Add Attribute</div>
          {ALL_ATTRIBUTES.filter(attr => !columnOrder.includes(attr)).map(attr => (
            <button
              key={attr}
              onClick={() => {
                const idx = columnOrder.indexOf(contextMenu.colKey);
                const newOrder = [...columnOrder];
                newOrder.splice(idx + 1, 0, attr);
                setColumnOrder(newOrder);
                setColumnWidths(prev => ({ ...prev, [attr]: 70 }));
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-1.5 text-[11px] text-white hover:bg-[#E8F000] hover:text-black uppercase tracking-widest transition-colors font-medium font-sans"
            >
              {attr}
            </button>
          ))}
        </div>
      )}

      {/* Player Viewing Panel */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPlayer(null)}>
          <div 
            className="bg-[#1C1B1B] w-full max-w-4xl rounded-t-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-8 bg-[#2A2A2A] relative shrink-0">
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 bg-[#1C1B1B] rounded-xl flex items-center justify-center text-[#E8F000]">
                  <Users size={32} />
                </div>
                <div>
                  <h3 className="font-bebas text-4xl text-white tracking-widest leading-none">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-sans text-[10px] text-[#E8F000] font-bold uppercase tracking-widest">{selectedPlayer.clubName}</span>
                    <span className="text-white/20">|</span>
                    <span className="font-sans text-[10px] text-[#888888] uppercase tracking-widest">{selectedPlayer.nationalityName}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-8 pt-4 grid grid-cols-12 gap-8 scrollbar-hide">
                <div className="col-span-4 space-y-8">
                    {/* Position Map (Simplified) */}
                    <div className="bg-[#121111] rounded-[24px] p-8 space-y-6">
                        <h4 className="text-[10px] text-[#888888] uppercase font-bold tracking-widest flex items-center gap-2">
                           <MapPin size={12} className="text-[#E8F000]" /> POSITIONING
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(selectedPlayer.positions)
                                .filter(([_, v]) => (v as number) > 10)
                                .map(([p, v]) => (
                                    <div key={p} className="px-4 py-2 bg-[#2A2A2A] text-[#E8F000] text-xs font-bold rounded-lg border border-[#E8F000]/20 shadow-inner">
                                        {p}
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="bg-[#121111] rounded-[24px] p-8 space-y-6">
                      <h4 className="text-[10px] text-[#888888] uppercase font-bold tracking-widest">ABILITY POTENTIAL</h4>
                      <div className="flex justify-between items-end gap-4">
                        <div className="flex-1 space-y-2">
                             <div className="text-[9px] text-[#888888] font-bold tracking-widest uppercase">CURRENT</div>
                             <div className="font-bebas text-6xl text-[#E8F000] leading-none">{selectedPlayer.currentAbility}</div>
                        </div>
                        <div className="flex-1 space-y-2 text-right">
                             <div className="text-[9px] text-[#888888] font-bold tracking-widest uppercase text-right">MAX CAP</div>
                             <div className="font-bebas text-6xl text-white leading-none opacity-40">{selectedPlayer.potentialAbility}</div>
                        </div>
                      </div>
                      <div className="w-full bg-[#1C1B1B] h-1 rounded-full relative">
                         <div className="absolute left-0 bg-[#E8F000] h-full rounded-full shadow-[0_0_10px_#E8F000]" style={{ width: `${(selectedPlayer.currentAbility/200)*100}%` }}></div>
                         <div className="absolute left-0 bg-white opacity-10 h-full rounded-full" style={{ width: `${(selectedPlayer.potentialAbility/200)*100}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-[#E8F000] rounded-[32px] p-10 text-black shadow-[0_20px_50px_rgba(232,240,0,0.15)] flex flex-col items-center text-center">
                        <div className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 opacity-50">MARKET EVALUATION</div>
                        <div className="font-bebas text-[72px] leading-none tracking-tight">{formatCurrency(selectedPlayer.value)}</div>
                        <div className="mt-4 font-mono text-sm font-bold opacity-70">SQUAD MAINTENANCE: {formatCurrency(selectedPlayer.wage)}/WK</div>
                    </div>
                </div>

                <div className="col-span-8 bg-[#121111] rounded-[32px] p-10 flex flex-col shadow-inner">
                    <h4 className="text-[10px] text-[#888888] uppercase font-bold tracking-widest mb-10 text-center opacity-60">BIOMETRIC ATTRIBUTE ARRAY</h4>
                    <div className="grid grid-cols-3 gap-x-12 gap-y-1">
                        {Object.entries(selectedPlayer.attributes)
                            .filter(([key]) => !["GK", "SW", "D", "DM", "M", "AM", "F", "S"].includes(key))
                            .sort((a,b) => a[0].localeCompare(b[0]))
                            .map(([attr, val]) => (
                                <div key={attr} className="flex justify-between items-center border-b border-white/5 py-2 hover:bg-white/5 px-2 rounded transition-colors group">
                                    <span className="text-[10px] text-[#888888] font-bold tracking-tighter uppercase group-hover:text-white">{attr}</span>
                                    <span className={`text-base font-bebas tracking-widest ${getAttributeColor(val as number)}`}>
                                        {val as number || '-'}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
              </div>
              
              <div className="px-10 py-6 bg-[#0E0E0E] text-[10px] text-[#888888] font-mono flex justify-between items-center uppercase tracking-[0.4em] opacity-40">
                <span>SECTOR ID: {selectedPlayer.id}</span>
                <span>SECURE ARCHIVE INTERFACE • {fileName || "RAW SECTOR"}</span>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
