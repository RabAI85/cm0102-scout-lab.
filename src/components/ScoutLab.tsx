
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  TrendingUp,
  Star
} from 'lucide-react';
import { Player } from '../lib/CM0102Parser';
import { getFlagUrl, formatCurrency } from '../lib/constants';

interface ScoutLabProps {
  players: Player[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  sortedPlayers: Player[];
  currentItems: Player[];
  currentPage: number;
  setCurrentPage: (p: number | ((prev: number) => number)) => void;
  totalPages: number;
  itemsPerPage: number;
  sortBy: string | null;
  sortDir: 'asc' | 'desc' | null;
  handleSort: (field: string) => void;
  columnOrder: string[];
  setColumnOrder: (o: string[] | ((prev: string[]) => string[])) => void;
  columnWidths: Record<string, number>;
  setColumnWidths: (w: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  isFilterCollapsed: boolean;
  setIsFilterCollapsed: (b: boolean) => void;
  contextMenu: { x: number, y: number, colKey: string } | null;
  setContextMenu: (m: { x: number, y: number, colKey: string } | null) => void;
  filters: any;
  ALL_ATTRIBUTES: string[];
  title?: string;
  shortlist: number[];
  toggleShortlist: (id: number) => void;
  hasSearched?: boolean;
}

export default function ScoutLab({
  searchTerm,
  setSearchTerm,
  sortedPlayers,
  currentItems,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  sortBy,
  sortDir,
  handleSort,
  columnOrder,
  setColumnOrder,
  columnWidths,
  setColumnWidths,
  isFilterCollapsed,
  setIsFilterCollapsed,
  setContextMenu,
  filters,
  ALL_ATTRIBUTES,
  title = "GLOBAL PLAYER DATABASE",
  shortlist,
  toggleShortlist,
  hasSearched = true
}: ScoutLabProps) {
  const navigate = useNavigate();

  // Whether the primary position display should be highlighted given active filters
  const isPosActive = (pos: string) => filters.categories.length === 0 || filters.categories.some((cat: string) => {
    if (cat === 'GK')  return pos === 'GK';
    if (cat === 'DEF') return pos === 'D' || pos === 'SW' || pos === 'WB';
    if (cat === 'MID') return pos === 'M' || pos === 'DM' || pos === 'AM';
    if (cat === 'ATT') return pos === 'AT';
    return false;
  });

  return (
    <main className="flex-1 flex flex-col bg-[#0E0E0E] overflow-hidden relative">
      {/* Search Header */}
      <header className="h-[48px] px-6 flex items-center justify-between border-b border-[#1C1B1B] shrink-0 bg-[#0E0E0E] z-20">
        <div className="flex items-center gap-8">
          {isFilterCollapsed && (
            <button 
              onClick={() => setIsFilterCollapsed(false)}
              className="text-[#888888] hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          )}
          <div className="flex items-baseline gap-3">
            <h2 className="font-bebas text-[16px] text-scout-yellow tracking-widest leading-none translate-y-[1px]">{title}</h2>
            <div className="font-sans text-[10px] tracking-[0.2em] font-bold text-white uppercase whitespace-nowrap">
              {hasSearched ? sortedPlayers.length.toLocaleString() : '0'} {title.includes('SHORTLIST') ? 'SAVED' : 'PLAYERS LOADED'}
            </div>
          </div>

          {hasSearched && (
            <div className="flex items-center gap-4 border-l border-[#1C1B1B] pl-8 h-4">
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 text-white hover:text-scout-yellow disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 text-white hover:text-scout-yellow disabled:opacity-20 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="text-[10px] font-sans font-bold text-white uppercase tracking-widest whitespace-nowrap">
                SHOWING {(sortedPlayers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0)} — {Math.min(currentPage * itemsPerPage, sortedPlayers.length)} OF {sortedPlayers.length}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input 
              type="text"
              placeholder="SEARCH DATABASE"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-[#1C1B1B] border-none rounded-md pl-9 pr-3 py-1.5 text-[10px] font-sans text-white focus:ring-1 focus:ring-scout-yellow w-56 outline-none transition-all"
            />
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-[#888888] hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Database Table */}
      <div className="flex-1 overflow-hidden px-4 pb-4 mt-2 flex flex-col">
        {!hasSearched ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#444] bg-[#1C1B1B] rounded-2xl border border-[#2A2A2A] border-dashed">
            <Search size={48} className="mb-4 opacity-10" />
            <p className="text-[14px] font-black tracking-widest uppercase opacity-40">Select filters and click the search icon to load players.</p>
          </div>
        ) : (
          <div className="flex-1 bg-[#1C1B1B] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex-1 overflow-auto scrollbar-hide">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 z-10 w-full bg-[#1C1B1B]">
                <tr className="bg-[#1C1B1B]/90 backdrop-blur-md text-white text-[13px] uppercase tracking-[0.1em] font-black w-full flex">
                  {columnOrder.map((colKey) => {
                    const columns: any = {
                      save:             { label: '',        textAlign: 'center', sortKey: null },
                      name:             { label: 'PLAYER NAME',                 sortKey: 'name' },
                      flag:             { label: '',        textAlign: 'center', sortKey: 'nationalityName' },
                      pos:              { label: 'POS',     textAlign: 'center', sortKey: 'pos' },
                      age:              { label: 'AGE',     textAlign: 'center', sortKey: 'age' },
                      clubName:         { label: 'CLUB',                        sortKey: 'clubName' },
                      value:            { label: 'VALUE',   textAlign: 'right',  sortKey: 'value' },
                      wage:             { label: 'WAGES',   textAlign: 'right',  sortKey: 'wage' },
                      currentAbility:   { label: 'CA',      textAlign: 'center', sortKey: 'currentAbility' },
                      potentialAbility: { label: 'PA',      textAlign: 'center', sortKey: 'potentialAbility' },
                      scoutRating:      { label: 'SR',      textAlign: 'center', sortKey: 'scoutRating' },
                      injuryProne:      { label: 'INJ',     textAlign: 'center', sortKey: 'injuryProne' },
                      impMatches:       { label: 'IMP',     textAlign: 'center', sortKey: 'impMatches' },
                      consistency:      { label: 'CNS',     textAlign: 'center', sortKey: 'consistency' },
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
                            <TrendingUp size={10} className={`text-scout-yellow ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                          )}
                        </div>
                        <div 
                          onMouseDown={handleResizeMouseDown}
                          className="absolute right-0 top-1/4 h-1/2 w-[2px] bg-[#2A2A2A] hover:bg-scout-yellow cursor-col-resize transition-colors z-20 active:bg-scout-yellow"
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
                    <button className="text-white font-bebas text-2xl leading-none opacity-40 group-hover:opacity-100 group-hover:text-[#E8F000] transition-all">+</button>
                  </th>
                </tr>
              </thead>
              <tbody className="text-[14px] font-sans">
                {currentItems.map((player) => {
                  const consistency  = player.attributes['Consistency']     || 0;
                  const impMatches   = player.attributes['ImportantMatches'] || 0;
                  const injuryProne  = player.attributes['InjuryProneness']  || 0;

                  return (
                    <tr 
                      key={player.id} 
                      className="hover:bg-[#2A2A2A] text-[#E0E0E0] transition-colors cursor-pointer group flex w-full"
                    >
                      {columnOrder.map(colKey => {
                        const width = `${columnWidths[colKey]}px`;
                        switch (colKey) {
                          case 'save': {
                            const isSaved = shortlist.includes(player.id);
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center flex items-center justify-center">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleShortlist(player.id); }}
                                  className={`transition-all ${isSaved ? 'text-scout-yellow fill-scout-yellow scale-110' : 'text-[#444444] hover:text-white'}`}
                                >
                                  <Star size={14} />
                                </button>
                              </td>
                            );
                          }
                          case 'name':
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} onClick={() => navigate(`/player/${player.id}`)} className="p-[6px] pl-6 overflow-hidden flex items-center">
                                <div className="font-sans text-[14px] text-white uppercase tracking-tighter group-hover:text-scout-yellow transition-colors truncate font-medium flex items-center overflow-hidden whitespace-nowrap">
                                  {player.commonName || `${player.firstName} ${player.lastName}`}
                                </div>
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
                          case 'pos': {
                            const getPrimaryPos = () => {
                              const vals = [
                                { label: 'GK', val: (player.positions as any)['GK'] || 0 },
                                { label: 'D',  val: Math.max(
                                    (player.positions as any)['D']  || 0,
                                    (player.positions as any)['SW'] || 0,
                                    (player.positions as any)['WB'] || 0
                                  ) },
                                { label: 'M',  val: Math.max(
                                    (player.positions as any)['M']  || 0,
                                    (player.positions as any)['DM'] || 0,
                                    (player.positions as any)['AM'] || 0
                                  ) },
                                { label: 'AT', val: (player.positions as any)['AT'] || 0 }
                              ];
                              return vals.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), vals[0]).label;
                            };
                            const displayPos = getPrimaryPos();
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] flex items-center justify-center">
                                <div className={`px-1 py-0.5 rounded-[3px] text-[10px] font-black border border-white/5 whitespace-nowrap ${isPosActive(displayPos) ? 'bg-scout-yellow text-black' : 'bg-[#2A2A2A] text-white'}`}>
                                  {displayPos}
                                </div>
                              </td>
                            );
                          }
                          case 'age':
                            return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-outfit text-white/90 flex items-center justify-center">{player.age}</td>;
                          case 'clubName':
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] flex flex-col justify-center overflow-hidden">
                                <div className="text-[13px] text-white uppercase tracking-tighter truncate font-medium whitespace-nowrap">{player.clubName}</div>
                                {player.divisionName && <div className="text-[9px] text-[#666] truncate whitespace-nowrap tracking-tight">{player.divisionName}</div>}
                              </td>
                            );
                          case 'value':
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-right font-outfit font-bold text-white tracking-tighter flex items-center justify-end">
                                {formatCurrency(player.value)}
                              </td>
                            );
                          case 'wage':
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-right font-outfit font-bold text-scout-yellow tracking-tighter flex items-center justify-end">
                                {formatCurrency(player.wage)}/W
                              </td>
                            );
                          case 'currentAbility':
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-outfit font-black text-scout-yellow flex items-center justify-center">
                                {player.currentAbility}
                              </td>
                            );
                          case 'potentialAbility':
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-outfit font-black text-scout-yellow flex items-center justify-center">
                                {player.potentialAbility}
                              </td>
                            );
                          case 'scoutRating':
                            const sr = Math.floor((player.currentAbility / 200) * 100);
                            return (
                              <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-outfit font-black text-scout-yellow flex items-center justify-center">
                                {sr}
                              </td>
                            );
                          case 'injuryProne':
                            return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-outfit font-bold text-white/70 flex items-center justify-center">{injuryProne}</td>;
                          case 'impMatches':
                            return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-outfit font-bold text-white/70 flex items-center justify-center">{impMatches}</td>;
                          case 'consistency':
                            return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-outfit font-bold text-white/70 flex items-center justify-center">{consistency}</td>;
                          default:
                            if (colKey.startsWith('attributes.')) {
                              const attr = colKey.split('.')[1];
                              const val = player.attributes[attr] || 0;
                              return <td key={colKey} style={{ width, flexShrink: 0 }} className="p-[6px] text-center font-outfit font-bold text-white flex items-center justify-center opacity-70">{val}</td>;
                            }
                            return null;
                        }
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </main>
  );
}
