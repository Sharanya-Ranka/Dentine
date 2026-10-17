import React, { useState } from 'react';
import { OdontogramSelector } from './OdontogramSelector';

interface ToothPickerModalProps {
  initialTeeth: number[];
  procedureName?: string;
  onConfirm: (teeth: number[]) => void;
  onClose: () => void;
}

export const ToothPickerModal: React.FC<ToothPickerModalProps> = ({
  initialTeeth,
  procedureName,
  onConfirm,
  onClose,
}) => {
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>(initialTeeth);

  const handleSave = () => {
    onConfirm(selectedTeeth);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🦷 Odontogram Tooth Selector</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                FDI Two-Digit
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {procedureName ? (
                <>Targeting for: <strong className="text-slate-800">{procedureName}</strong></>
              ) : (
                'Select individual teeth, quadrants, or arches for this clinical step.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {/* Visual Odontogram */}
        <OdontogramSelector
          selectedTeeth={selectedTeeth}
          onChange={setSelectedTeeth}
        />

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedTeeth([])}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Clear / Set General
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs"
            >
              Apply Selection ({selectedTeeth.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};