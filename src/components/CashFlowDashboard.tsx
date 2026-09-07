import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet2, Target, Check, Edit2 } from 'lucide-react';
import { CashFlowSummary } from '@/src/types/finance';
import { formatRupiah } from '@/src/utils/formatters';

interface CashFlowDashboardProps {
  summary: CashFlowSummary;
  onUpdateTarget: (target: number) => Promise<void>;
}

export const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({ summary, onUpdateTarget }) => {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(summary.targetSavings.toString());
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTarget = async () => {
    const val = parseFloat(targetInput);
    if (isNaN(val) || val < 0) return;
    setIsSaving(true);
    try {
      await onUpdateTarget(val);
      setIsEditingTarget(false);
    } finally {
      setIsSaving(false);
    }
  };

  const isNetPositive = summary.netCashFlow >= 0;

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Ringkasan Arus Kas (Bulan Ini)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Visibilitas pergerakan uang riil untuk memastikan tidak ada defisit tersembunyi
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/70">
          <Wallet2 className="w-4 h-4 text-stone-600" />
          <span className="text-xs text-stone-500 font-medium">Total Saldo Semua Pos:</span>
          <span className="text-xs font-bold text-stone-900">{formatRupiah(summary.totalBalance)}</span>
        </div>
      </div>

      {/* Grid Kartu Arus Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
        {/* Pemasukan */}
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-800">Total Pemasukan</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-emerald-900 tracking-tight">
              {formatRupiah(summary.totalIncome)}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Semua pos penerimaan</p>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-800">Total Pengeluaran</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-rose-900 tracking-tight">
              {formatRupiah(summary.totalExpense)}
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5">Termasuk belanja & pos jajan</p>
          </div>
        </div>

        {/* Arus Kas Bersih */}
        <div className={`border rounded-xl p-4 flex flex-col justify-between ${
          isNetPositive 
            ? 'bg-stone-50 border-stone-200' 
            : 'bg-amber-50/80 border-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-700">Sisa Arus Kas Bersih</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isNetPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isNetPositive ? 'SURPLUS' : 'DEFISIT'}
            </span>
          </div>
          <div>
            <p className={`text-xl font-extrabold tracking-tight ${
              isNetPositive ? 'text-stone-900' : 'text-rose-700'
            }`}>
              {formatRupiah(summary.netCashFlow)}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {isNetPositive ? 'Dapat dialokasikan ke tabungan' : 'Peringatan pengeluaran melebihi arus masuk'}
            </p>
          </div>
        </div>
      </div>

      {/* Target Tabungan Bulanan */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-stone-800">Target Tabungan Bulanan:</span>
            {isEditingTarget ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-32 px-2 py-1 text-xs border border-stone-300 rounded bg-white font-medium"
                  placeholder="3000000"
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveTarget}
                  disabled={isSaving}
                  className="p-1 rounded bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"
                  title="Simpan Target"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900">
                  {formatRupiah(summary.targetSavings)}
                </span>
                <button
                  onClick={() => setIsEditingTarget(true)}
                  className="text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
                  title="Ubah Target"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-stone-600">
            Pencapaian: <span className="text-emerald-700 font-bold">{summary.savingsProgressPercent}%</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, summary.savingsProgressPercent)}%` }}
          />
        </div>
      </div>
    </section>
  );
};
