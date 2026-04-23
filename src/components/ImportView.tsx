
import React from 'react';
import { FileUp, Database } from 'lucide-react';
import { Player } from '../lib/CM0102Parser';

interface ImportViewProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isParsing: boolean;
  players: Player[];
  fileName: string | null;
  importProgress: number;
  stats: any;
  setView: (v: 'scout-lab') => void;
}

export default function ImportView({
  fileInputRef,
  handleFileUpload,
  isParsing,
  players,
  fileName,
  importProgress,
  stats,
  setView
}: ImportViewProps) {
  const isLoaded = players.length > 0 && !isParsing && importProgress >= 100;

  return (
    <div className="bg-[#0E0E0E] text-[#E0E0E0] min-h-screen flex-1 flex flex-col items-center py-20 font-sans overflow-auto">
      <div className="w-full max-w-[960px] space-y-8 px-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-4">
          <h1 className="font-bebas text-[72px] text-white tracking-tight leading-none">SCOUT <span className="text-scout-yellow">LAB</span></h1>
          <p className="font-sans text-[12px] tracking-[0.2em] font-medium text-[#888888] uppercase">
            CHAMPIONSHIP MANAGER 01/02 AI SCOUT
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left Column: File Drop Zone */}
          <div className="flex flex-col h-full space-y-[11px]">
            <label className="font-sans font-bold text-[11px] tracking-widest text-scout-yellow uppercase block ml-1">
              LOAD SAVE FILE
            </label>
            <div className="bg-[#1C1B1B] p-8 rounded-2xl flex-1 flex flex-col">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2A2A2A] bg-[#1C1B1B] hover:bg-[#252424] transition-colors rounded-xl flex-1 flex flex-col items-center justify-center gap-4 cursor-pointer group min-h-[320px]"
              >
                <FileUp size={48} className="text-[#888888] group-hover:text-scout-yellow transition-colors" />
                <p className="font-sans text-sm text-[#888888] tracking-widest uppercase text-center px-4">Drop your .sav file here</p>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".sav" />
              </div>
            </div>
          </div>

          {/* Right Column: Status / Success */}
          <div className="flex flex-col h-full space-y-[11px]">
            <span className="h-[16px]"></span> {/* Alignment spacer */}
            <div className="bg-[#1C1B1B] p-8 rounded-2xl flex-1 flex flex-col items-center justify-center transition-all duration-300">
              {!isLoaded ? (
                <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                  <Database size={64} className="text-[#2A2A2A]" />
                  <p className="font-sans text-sm text-[#888888] tracking-widest uppercase italic">Awaiting save file...</p>
                  
                  {isParsing && (
                    <div className="w-48 space-y-2 mt-4 text-center">
                       <div className="font-bebas text-lg text-scout-yellow tracking-widest">{Math.round(importProgress)}%</div>
                       <div className="w-full bg-[#2A2A2A] h-1 rounded-full overflow-hidden">
                          <div className="bg-scout-yellow h-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-12 h-12 rounded-full border-2 border-scout-yellow flex items-center justify-center text-scout-yellow mb-6">
                    <div className="w-6 h-6 flex items-center justify-center leading-none text-xl font-black">✓</div>
                  </div>

                  <div className="space-y-1 mb-8">
                    <div className="font-bebas text-[72px] leading-none text-white tracking-tight font-bold">
                      <span className="font-sans">{stats.totalRecords.toLocaleString()}</span> PLAYERS LOADED
                    </div>
                    <div className="font-sans text-[12px] tracking-[0.2em] text-[#888888] uppercase font-medium">
                      SQUAD DATABASE READY
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 w-full mb-10">
                    {Object.entries(stats.positions).map(([pos, count]: [string, any]) => (
                      <div key={pos} className="bg-[#2A2A2A] p-3 rounded-lg space-y-1">
                        <div className="font-sans text-2xl text-white tracking-wider font-bold">{count.toLocaleString()}</div>
                        <div className="font-sans text-[9px] text-[#888888] uppercase tracking-widest font-bold">{pos}</div>
                      </div>
                    ))}
                  </div>

                  <div className="w-full flex justify-between items-center py-4 border-t border-[#2A2A2A]/30 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-[10px] text-[#888888] uppercase tracking-widest font-bold">DATA INTEGRITY</span>
                      <span className="text-[#888888] mx-1">·</span>
                      <span className="font-sans text-[10px] text-scout-yellow font-bold">OPTIMISED FOR v3.9.68</span>
                    </div>
                    <Database size={16} className="text-[#888888]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cta Button */}
        <div className="pt-4">
          <button 
            onClick={() => { if (isLoaded) setView('scout-lab'); }}
            disabled={!isLoaded}
            className={`w-full py-5 rounded-full font-bebas text-[20px] tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoaded 
                ? 'bg-scout-yellow text-black hover:bg-[#C8D000] cursor-pointer shadow-[0_10px_30px_rgba(205, 255, 0, 0.15)]' 
                : 'bg-[#1C1B1B] text-[#444444] cursor-not-allowed border border-[#2A2A2A]'
            }`}
          >
            ENTER SCOUT LAB →
          </button>
        </div>
      </div>
    </div>
  );
}
