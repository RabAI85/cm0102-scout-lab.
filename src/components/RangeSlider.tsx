import React from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  disabled?: boolean;
}

export default function RangeSlider({ min, max, value, onChange, disabled }: RangeSliderProps) {
  const minVal = value[0];
  const maxVal = value[1];

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Math.min(parseInt(e.target.value), maxVal);
    onChange([newVal, maxVal]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Math.max(parseInt(e.target.value), minVal);
    onChange([minVal, newVal]);
  };

  const minPos = ((minVal - min) / (max - min)) * 100;
  const maxPos = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className={`relative h-6 flex items-center ${disabled ? 'opacity-20 translate-y-0.5' : ''}`}>
      <div className="absolute w-full h-[3px] bg-[#1C1B1B] rounded-full" />
      <div 
        className="absolute h-[3px] bg-[#00C853] rounded-full"
        style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        disabled={disabled}
        onChange={handleMinChange}
        className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-scout-yellow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-scout-yellow [&::-moz-range-thumb]:cursor-pointer"
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        disabled={disabled}
        onChange={handleMaxChange}
        className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-scout-yellow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-scout-yellow [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  );
}
