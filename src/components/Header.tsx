import React, { useState } from 'react';
import { PlusCircle, ShieldCheck, Moon, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onOpenQuickEntry: () => void;
  onOpenTransfer: () => void;
  onClearData: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenQuickEntry, 
  onOpenTransfer,
  onClearData,
}) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleConfirmClear = async () => {
    const ok = window.confirm(
      'Apakah Anda yakin ingin mengosongkan seluruh data transaksi, hutang platform, dan mereset saldo pos rekening ke Rp 0? Tindakan ini akan mengembalikan data ke kondisi awal bersih.'
    );
    if (!ok) return;

    setIsClearing(true);
    try {
      await onClearData();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            Rp
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-stone-900 leading-none">
                Finance Tracker
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <ShieldCheck className="w-3 h-3" />
                Offline Dexie
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
              <Moon className="w-3 h-3 text-amber-500" />
              Ritual Arus Kas 15 Menit Malam Hari
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-clear-all-data"
            onClick={handleConfirmClear}
            disabled={isClearing}
            className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Kosongkan seluruh data transaksi, hutang, dan saldo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isClearing ? 'Mengosongkan...' : 'Kosongkan Data'}
            </span>
          </button>
          <button
            id="btn-open-transfer"
            onClick={onOpenTransfer}
            className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 active:scale-95 transition-all rounded-lg cursor-pointer flex items-center gap-1.5"
          >
            Pindah Pos
          </button>
          <button
            id="btn-open-quick-entry"
            onClick={onOpenQuickEntry}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 transition-all rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Transaksi
          </button>
        </div>
      </div>
    </header>
  );
};
