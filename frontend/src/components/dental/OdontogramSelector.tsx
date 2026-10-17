import React, { useState } from 'react';
import { TOOTH_METADATA, TOOTH_GROUPS } from './dentalData';

interface OdontogramSelectorProps {
  selectedTeeth: number[];
  onChange: (teeth: number[]) => void;
}

export const OdontogramSelector: React.FC<OdontogramSelectorProps> = ({
  selectedTeeth,
  onChange,
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  const selectedSet = new Set(selectedTeeth);

  const toggleTooth = (num: number) => {
    const next = new Set(selectedSet);
    if (next.has(num)) {
      next.delete(num);
    } else {
      next.add(num);
    }
    onChange(Array.from(next).sort((a, b) => a - b));
  };

  const selectGroup = (teeth: number[]) => {
    const allSelected = teeth.every((t) => selectedSet.has(t));
    const next = new Set(selectedSet);
    if (allSelected) {
      teeth.forEach((t) => next.delete(t));
    } else {
      teeth.forEach((t) => next.add(t));
    }
    onChange(Array.from(next).sort((a, b) => a - b));
  };

  const clearAll = () => onChange([]);

  // Tooth button renderer
  const renderToothButton = (num: number, isMilk: boolean) => {
    const isSelected = selectedSet.has(num);
    const meta = TOOTH_METADATA[num];

    return (
      <button
        key={num}
        type="button"
        onClick={() => toggleTooth(num)}
        onMouseEnter={() => setHoveredTooth(num)}
        onMouseLeave={() => setHoveredTooth(null)}
        title={meta?.name || `Tooth #${num}`}
        className={`flex items-center justify-center font-mono font-bold transition-all select-none rounded border ${
          isMilk
            ? 'w-7 h-7 sm:w-8 sm:h-8 text-[11px]'
            : 'w-8 h-8 sm:w-9 sm:h-9 text-xs shadow-2xs'
        } ${
          isSelected
            ? isMilk
              ? 'bg-amber-600 text-white border-amber-700 shadow-sm scale-105'
              : 'bg-blue-600 text-white border-blue-700 shadow-sm scale-105'
            : isMilk
            ? 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border-amber-200 hover:border-amber-400'
            : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-300 hover:border-blue-400'
        }`}
      >
        {num}
      </button>
    );
  };

  // Spacer for deciduous rows to align with anterior/premolar regions
  const renderEmptySpacer = (key: string) => (
    <div key={key} className="w-7 h-7 sm:w-8 sm:h-8 invisible" />
  );

  return (
    <div className="space-y-4">
      {/* Quick Arch / Batch Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-slate-200 text-xs">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => selectGroup(TOOTH_GROUPS.upperPermanent)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            Upper Adult
          </button>
          <button
            type="button"
            onClick={() => selectGroup(TOOTH_GROUPS.lowerPermanent)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            Lower Adult
          </button>
          <button
            type="button"
            onClick={() => selectGroup(TOOTH_GROUPS.allMilk)}
            className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium"
          >
            All Milk Teeth
          </button>
          <button
            type="button"
            onClick={() => selectGroup(TOOTH_GROUPS.allPermanent)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
          >
            All Adult Teeth
          </button>
        </div>

        {selectedTeeth.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold"
          >
            Clear Selection ({selectedTeeth.length})
          </button>
        )}
      </div>

      {/* Anatomical Orientation Banner
      <div className="flex justify-between items-center px-4 py-1 bg-slate-100/70 rounded border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>◀ PATIENT RIGHT (Doctor Left)</span>
        <span className="text-blue-600 font-mono">MIDLINE</span>
        <span>PATIENT LEFT (Doctor Right) ▶</span>
      </div> */}

      {/* Main Grid Viewport (Scrollable on small mobile screens) */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-155 bg-slate-50/40 p-4 rounded-xl border border-slate-200 space-y-3">
          {/* ================================================================ */}
          {/* ROW 1: Maxillary Deciduous (Milk) [Q5 | Q6]                       */}
          {/* ================================================================ */}
          <div className="flex items-center justify-center">
            {/* Quadrant 5: Inset by 3 spacers */}
            <div className="flex items-center justify-end gap-1 pr-3">
              <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-tight mr-1">
                Q5 (Milk)
              </span>
              {[1, 2, 3].map((i) => renderEmptySpacer(`q5-sp-${i}`))}
              {[55, 54, 53, 52, 51].map((n) => renderToothButton(n, true))}
            </div>

            {/* Midline Divider */}
            <div className="w-[2px] h-8 bg-slate-400 mx-1 rounded-full" />

            {/* Quadrant 6: Inset by 3 spacers at end */}
            <div className="flex items-center justify-start gap-1 pl-3">
              {[61, 62, 63, 64, 65].map((n) => renderToothButton(n, true))}
              {[1, 2, 3].map((i) => renderEmptySpacer(`q6-sp-${i}`))}
              <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-tight ml-1">
                Q6 (Milk)
              </span>
            </div>
          </div>

          {/* ================================================================ */}
          {/* ROW 2: Maxillary Permanent (Adult) [Q1 | Q2]                      */}
          {/* ================================================================ */}
          <div className="flex items-center justify-center">
            {/* Quadrant 1 */}
            <div className="flex items-center justify-end gap-1 pr-3">
              <button
                type="button"
                onClick={() => selectGroup(TOOTH_GROUPS.q1)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tight mr-1 cursor-pointer"
                title="Select Quadrant 1"
              >
                Q1 ↗
              </button>
              {[18, 17, 16, 15, 14, 13, 12, 11].map((n) => renderToothButton(n, false))}
            </div>

            {/* Midline Divider */}
            <div className="w-[2px] h-10 bg-slate-500 mx-1 rounded-full" />

            {/* Quadrant 2 */}
            <div className="flex items-center justify-start gap-1 pl-3">
              {[21, 22, 23, 24, 25, 26, 27, 28].map((n) => renderToothButton(n, false))}
              <button
                type="button"
                onClick={() => selectGroup(TOOTH_GROUPS.q2)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tight ml-1 cursor-pointer"
                title="Select Quadrant 2"
              >
                ↖ Q2
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* HORIZONTAL ARCH GAP / OCCLUSAL PLANE DIVIDER                     */}
          {/* ================================================================ */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-slate-300" />
            <span className="absolute bg-white px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 rounded-full">
              Occlusal Plane / Arch Gap
            </span>
          </div>

          {/* ================================================================ */}
          {/* ROW 3: Mandibular Permanent (Adult) [Q4 | Q3]                      */}
          {/* ================================================================ */}
          <div className="flex items-center justify-center">
            {/* Quadrant 4 */}
            <div className="flex items-center justify-end gap-1 pr-3">
              <button
                type="button"
                onClick={() => selectGroup(TOOTH_GROUPS.q4)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tight mr-1 cursor-pointer"
                title="Select Quadrant 4"
              >
                Q4 ↘
              </button>
              {[48, 47, 46, 45, 44, 43, 42, 41].map((n) => renderToothButton(n, false))}
            </div>

            {/* Midline Divider */}
            <div className="w-[2px] h-10 bg-slate-500 mx-1 rounded-full" />

            {/* Quadrant 3 */}
            <div className="flex items-center justify-start gap-1 pl-3">
              {[31, 32, 33, 34, 35, 36, 37, 38].map((n) => renderToothButton(n, false))}
              <button
                type="button"
                onClick={() => selectGroup(TOOTH_GROUPS.q3)}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tight ml-1 cursor-pointer"
                title="Select Quadrant 3"
              >
                ↙ Q3
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* ROW 4: Mandibular Deciduous (Milk) [Q8 | Q7]                       */}
          {/* ================================================================ */}
          <div className="flex items-center justify-center">
            {/* Quadrant 8: Inset by 3 spacers */}
            <div className="flex items-center justify-end gap-1 pr-3">
              <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-tight mr-1">
                Q8 (Milk)
              </span>
              {[1, 2, 3].map((i) => renderEmptySpacer(`q8-sp-${i}`))}
              {[85, 84, 83, 82, 81].map((n) => renderToothButton(n, true))}
            </div>

            {/* Midline Divider */}
            <div className="w-[2px] h-8 bg-slate-400 mx-1 rounded-full" />

            {/* Quadrant 7: Inset by 3 spacers at end */}
            <div className="flex items-center justify-start gap-1 pl-3">
              {[71, 72, 73, 74, 75].map((n) => renderToothButton(n, true))}
              {[1, 2, 3].map((i) => renderEmptySpacer(`q7-sp-${i}`))}
              <span className="text-[10px] font-bold text-amber-700/60 uppercase tracking-tight ml-1">
                Q7 (Milk)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip & Active Selection Bar */}
      <div className="min-h-[32px] flex items-center justify-between text-xs px-3 py-1.5 bg-slate-100 rounded border border-slate-200">
        <div>
          {hoveredTooth ? (
            <span className="text-slate-800">
              <strong className="text-blue-600 font-mono mr-1">#{hoveredTooth}:</strong>
              {TOOTH_METADATA[hoveredTooth]?.name}
            </span>
          ) : (
            <span className="text-slate-400 italic">
              Hover over a tooth to view its clinical anatomy
            </span>
          )}
        </div>

        {/* <div className="flex items-center gap-1 font-mono">
          <span className="text-slate-500 font-sans text-[11px]">Selected:</span>
          {selectedTeeth.length > 0 ? (
            <span className="font-bold text-blue-700">
              {selectedTeeth.join(', ')}
            </span>
          ) : (
            <span className="text-slate-400 italic font-sans">None (Full-Arch / General)</span>
          )}
        </div> */}
      </div>
    </div>
  );
};