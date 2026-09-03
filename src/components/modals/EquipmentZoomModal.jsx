import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, Info } from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';

export const EquipmentZoomModal = ({ isOpen, onClose, imageUrl, title = 'Equipment & Device Diagram', caption = '', partsGuide = [] }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-4xl">
      <div className="space-y-4">
        
        {/* CONTROLS HEADER */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Apparatus Inspector • Zoom: {Math.round(zoomLevel * 100)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.75}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* IMAGE CANVAS AREA */}
        <div className="relative overflow-hidden max-h-[60vh] min-h-[300px] rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-4">
          <img
            src={imageUrl}
            alt={title}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-[55vh] w-auto object-contain transition-transform duration-200 ease-out select-none shadow-2xl rounded-xl"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/pharmdverse-logo.png';
            }}
          />
        </div>

        {/* CAPTION & LABELED PARTS GUIDE */}
        {(caption || (partsGuide && partsGuide.length > 0)) && (
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
              <Info className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Apparatus Description & Labeled Parts Guide</span>
            </div>
            
            {caption && (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {caption}
              </p>
            )}

            {partsGuide && partsGuide.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1.5">
                  Labeled Components:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {partsGuide.map((part, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{part}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
