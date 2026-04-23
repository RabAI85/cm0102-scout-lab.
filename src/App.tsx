
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { 
  Database, 
  Search,
  Bookmark,
  GitCompare,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import { CM0102Parser, Player } from './lib/CM0102Parser';
import { ALL_ATTRIBUTES } from './lib/constants';
import { mockPlayerData } from './lib/mockData';
import ScoutLab from './components/ScoutLab';
import PlayerProfile from './components/PlayerProfile';
import ImportView from './components/ImportView';

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: string;
}

function MainLayout({ 
  children, 
  isNavCollapsed, 
  setIsNavCollapsed, 
  setView 
}: { 
  children: React.ReactNode; 
  isNavCollapsed: boolean; 
  setIsNavCollapsed: (b: boolean) => void;
  setView: (v: 'import') => void;
}) {
  const navigate = useNavigate();

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

        <div onClick={() => { setView('import'); navigate('/'); }} className={`font-bebas text-[#E8F000] cursor-pointer mb-10 flex flex-col items-center leading-none transition-all ${isNavCollapsed ? 'text-[20px]' : 'text-[28px]'}`}>
          <span>SCOUT</span>
          {!isNavCollapsed && <span>LAB</span>}
        </div>
        
        <div className="flex flex-col gap-6 w-full items-center">
          {[
            { icon: Database, label: 'DATA', id: 'data' },
            { icon: Search, label: 'PLAYER', active: true, id: 'player' },
            { icon: Bookmark, label: 'SHORTLIST', id: 'shortlist' },
            { icon: GitCompare, label: 'COMPARE', id: 'compare' },
            { icon: Briefcase, label: 'STAFF', id: 'staff' },
            { icon: Building2, label: 'CLUB', id: 'club' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer w-full px-2">
              <div className={`p-2.5 rounded-xl transition-all ${item.active ? 'bg-scout-yellow text-black shadow-[0_0_15px_rgba(205,255,0,0.3)]' : 'text-[#444444] hover:bg-[#1C1B1B] hover:text-white'}`}>
                <item.icon size={18} />
              </div>
              {!isNavCollapsed && <span className={`text-[8px] font-bold tracking-widest ${item.active ? 'text-scout-yellow' : 'text-[#888888]'}`}>{item.label}</span>}
            </div>
          ))}
        </div>
      </nav>

      {children}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'import' | 'scout-lab'>('scout-lab');
  const [players, setPlayers] = useState<Player[]>(mockPlayerData as unknown as Player[]);
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
  
  // Shared Scouting States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>('currentAbility');
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('desc');
  const [importProgress, setImportProgress] = useState(0);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'name', 'flag', 'pos', 'age', 'clubName', 'value', 'wage', 'currentAbility', 'potentialAbility', 'injuryProne', 'impMatches', 'consistency'
  ]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    name: 240, flag: 40, pos: 70, age: 55, clubName: 160, value: 100, wage: 100, currentAbility: 55, potentialAbility: 55, injuryProne: 55, impMatches: 55, consistency: 55,
  });
  const [filters, setFilters] = useState({
    categories: [] as string[],
    sides: [] as string[],
    minAge: 15, maxAge: 45, minCA: 0, maxCA: 200, minPA: 0, maxPA: 200, minValue: 0, maxValue: 50000000, minConsistency: 0, minImportantMatches: 0, minNaturalFitness: 0, maxInjuryProneness: 20,
    attributes: {} as Record<string, number>,
    enabledAttributes: [] as string[]
  });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, colKey: string } | null>(null);

  const itemsPerPage = 100;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev.slice(-100), {
      message, type, timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }]);
  };

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
        avgCA: 0, // Simplified
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

  const filteredPlayers = players.filter(p => {
    // 1. Search
    const searchString = `${p.firstName} ${p.lastName} ${p.commonName} ${p.clubName} ${p.nationalityName}`.toLowerCase();
    if (searchTerm && !searchString.includes(searchTerm.toLowerCase())) return false;

    // 2. Position Filter
    const matchesPosition = filters.categories.length === 0 || filters.categories.some((cat: string) => {
      let types: string[] = [];
      if (cat === 'GK') types = ['Goalkeeper'];
      if (cat === 'DEF') types = ['Defender', 'Sweeper'];
      if (cat === 'MID') types = ['DefensiveMidfielder', 'Midfielder', 'AttackingMidfielder'];
      if (cat === 'ATT') types = ['Attacker'];
      const hasType = types.some(t => (p.positions as any)[t] > 10);
      if (!hasType) return false;
      if (cat === 'GK') return true;
      if (filters.sides.length === 0) return true;
      const sideMap: any = { 'Left': 'LeftSide', 'Right': 'RightSide', 'Centre': 'CentreSide' };
      return filters.sides.some(side => (p.positions as any)[sideMap[side]] > 10);
    });
    if (!matchesPosition) return false;

    // 3. Range Filters
    if (p.age < filters.minAge || p.age > filters.maxAge) return false;
    if (p.currentAbility < filters.minCA || p.currentAbility > filters.maxCA) return false;
    if (p.potentialAbility < filters.minPA || p.potentialAbility > filters.maxPA) return false;
    if (p.value < filters.minValue || p.value > filters.maxValue) return false;

    // 4. Enabled Attribute Filters
    for (const attr of filters.enabledAttributes) {
      if ((p.attributes[attr] || 0) < (filters.attributes[attr] || 0)) return false;
    }

    return true;
  });

  const sortedList = sortPlayers(filteredPlayers);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      if (sortDir === 'desc') setSortDir('asc');
      else if (sortDir === 'asc') { setSortBy(null); setSortDir(null); }
    } else { setSortBy(field); setSortDir('desc'); }
  };

  const totalPages = Math.ceil(sortedList.length / itemsPerPage);
  const currentItems = sortedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleCategory = (cat: string) => {
    setFilters(f => ({ ...f, categories: f.categories.includes(cat) ? f.categories.filter(c => c !== cat) : [...f.categories, cat] }));
  };

  const toggleSide = (side: string) => {
    setFilters(f => ({ ...f, sides: f.sides.includes(side) ? f.sides.filter(s => s !== side) : [...f.sides, side] }));
  };

  const toggleAttributeEnabled = (attr: string) => {
    setFilters(f => ({
      ...f,
      enabledAttributes: f.enabledAttributes.includes(attr)
        ? f.enabledAttributes.filter(a => a !== attr)
        : [...f.enabledAttributes, attr]
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [], sides: [], minAge: 15, maxAge: 45, minCA: 0, maxCA: 200, minPA: 0, maxPA: 200, minValue: 0, maxValue: 50000000, minConsistency: 0, minImportantMatches: 0, minNaturalFitness: 0, maxInjuryProneness: 20,
      attributes: {},
      enabledAttributes: []
    });
    setSearchTerm('');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Import View */}
        <Route path="/" element={
          players.length === 0 || view === 'import' ? (
            <ImportView 
              fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} isParsing={isParsing}
              players={players} fileName={fileName} importProgress={importProgress} stats={stats} setView={setView}
            />
          ) : (
            <Navigate to="/scout-lab" />
          )
        } />

        {/* Database View */}
        <Route path="/scout-lab" element={
          <MainLayout isNavCollapsed={isNavCollapsed} setIsNavCollapsed={setIsNavCollapsed} setView={setView}>
            <aside className={`${isFilterCollapsed ? 'w-0 opacity-0 px-0' : 'w-[280px] opacity-100'} bg-[#0E0E0E] flex flex-col shrink-0 border-r border-[#1C1B1B] transition-all duration-300 relative group/sidebar`}>
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-[#1C1B1B] flex justify-between items-end shrink-0">
                  <h2 className="font-bebas text-2xl text-white tracking-widest">FILTERS</h2>
                  <button onClick={clearFilters} className="text-scout-yellow text-[9px] font-bold tracking-widest uppercase hover:underline">CLEAR ALL</button>
                </div>
                
                <button 
                  onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                  className="absolute -right-3 top-[34px] z-50 w-6 h-6 rounded-full bg-white flex items-center justify-center transition-all duration-200 hover:bg-scout-yellow group/toggle shadow-lg"
                >
                  <ChevronLeft size={14} className="text-scout-yellow group-hover/toggle:text-black transition-colors" />
                </button>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  <div className="space-y-4">
                    {[...ALL_ATTRIBUTES].sort().map(attr => (
                      <div key={attr} className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleAttributeEnabled(attr)}
                              className={`w-3.5 h-3.5 rounded-sm border transition-colors flex items-center justify-center ${filters.enabledAttributes.includes(attr) ? 'bg-scout-yellow border-scout-yellow' : 'bg-[#1C1B1B] border-[#2A2A2A]'}`}
                            >
                              {filters.enabledAttributes.includes(attr) && <Check size={10} className="text-black stroke-[4px]" />}
                            </button>
                            <label className="text-[10px] font-black text-[#888888] tracking-[0.1em] uppercase">{attr}</label>
                          </div>
                          <span className={`font-sans text-[10px] font-bold ${filters.enabledAttributes.includes(attr) ? 'text-scout-yellow' : 'text-[#444444]'}`}>
                            {filters.attributes[attr] || 0}
                          </span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="20"
                          disabled={!filters.enabledAttributes.includes(attr)}
                          value={filters.attributes[attr] || 0}
                          onChange={(e) => setFilters(f => ({
                            ...f,
                            attributes: { ...f.attributes, [attr]: parseInt(e.target.value) }
                          }))}
                          className={`w-full accent-scout-yellow ${!filters.enabledAttributes.includes(attr) ? 'opacity-20 cursor-not-allowed' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
            <ScoutLab 
              players={players} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              sortedPlayers={sortedList} currentItems={currentItems} currentPage={currentPage}
              setCurrentPage={setCurrentPage} totalPages={totalPages} itemsPerPage={itemsPerPage}
              sortBy={sortBy} sortDir={sortDir} handleSort={handleSort} columnOrder={columnOrder} setColumnOrder={setColumnOrder}
              columnWidths={columnWidths} setColumnWidths={setColumnWidths} isFilterCollapsed={isFilterCollapsed} setIsFilterCollapsed={setIsFilterCollapsed}
              contextMenu={contextMenu} setContextMenu={setContextMenu} filters={filters} ALL_ATTRIBUTES={ALL_ATTRIBUTES}
            />
          </MainLayout>
        } />

        {/* Player Profile View */}
        <Route path="/player/:id" element={
          <MainLayout isNavCollapsed={isNavCollapsed} setIsNavCollapsed={setIsNavCollapsed} setView={setView}>
            <PlayerProfile players={players} />
          </MainLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}
