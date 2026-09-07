import React, { useState } from 'react';
import { 
  CreditCard, 
  PlusCircle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  ArrowUpRight 
} from 'lucide-react';
import { Debt } from '@/src/types/finance';
import { formatRupiah } from '@/src/utils/formatters';

interface DebtTrackerProps {
  debts: Debt[];
  monthlyIncome: number;
  onOpenAddModal: () => void;
  onOpenEditModal: (debt: Debt) => void;
  onOpenPayModal: (debt: Debt) => void;
  onDeleteDebt: (id: number) => Promise<void>;
}

export const DebtTracker: React.FC<DebtTrackerProps> = ({
  debts,
  monthlyIncome,
  onOpenAddModal,
  onOpenEditModal,
  onOpenPayModal,
  onDeleteDebt,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const activeDebts = debts.filter((d) => d.status === 'active' && d.remaining_amount > 0);
  const paidDebts = debts.filter((d) => d.status === 'paid_off' || d.remaining_amount === 0);

  const totalRemainingDebt = activeDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
  const totalMonthlyObligation = activeDebts.reduce((sum, d) => sum + d.monthly_installment, 0);

  // Rasio cicilan terhadap gaji (Debt Service Ratio)
  const debtServiceRatio = monthlyIncome > 0 
    ? Math.round((totalMonthlyObligation / monthlyIncome) * 100) 
    : 0;

  const handleDelete = async (debt: Debt) => {
    if (!debt.id) return;
    const confirm = window.confirm(`Hapus catatan hutang platform "${debt.platform_name}"?`);
    if (confirm) {
      setDeletingId(debt.id);
      try {
        await onDeleteDebt(debt.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900">
              Pelacak Hutang & Cicilan Digital
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Pantau beban pinjaman platform digital (PayLater, Pinjol, dll.) secara aman tanpa koneksi pihak ketiga
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:scale-95 transition-all rounded-lg cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Tambah Data Hutang
        </button>
      </div>

      {/* Ringkasan Metrik Hutang */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
          <p className="text-[11px] font-semibold text-stone-500">Total Sisa Pokok Hutang</p>
          <p className="text-lg font-extrabold text-stone-900 mt-0.5">
            {formatRupiah(totalRemainingDebt)}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Dari {activeDebts.length} pinjaman platform aktif
          </p>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
          <p className="text-[11px] font-semibold text-rose-700">Beban Cicilan Bulanan</p>
          <p className="text-lg font-extrabold text-rose-800 mt-0.5">
            {formatRupiah(totalMonthlyObligation)}
            <span className="text-xs font-medium text-rose-600"> /bln</span>
          </p>
          <p className="text-[11px] text-rose-600/90 mt-1">
            Wajib dibayar tiap bulan
          </p>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-stone-500">Beban Terhadap Gaji</p>
            {debtServiceRatio > 35 && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                <ShieldAlert className="w-2.5 h-2.5" /> Waspada
              </span>
            )}
          </div>
          <p className="text-lg font-extrabold text-stone-900 mt-0.5">
            {debtServiceRatio}%
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Batas ideal cicilan maks 30% dari penghasilan
          </p>
        </div>
      </div>

      {/* List Hutang */}
      {debts.length === 0 ? (
        <div className="py-10 text-center text-stone-500 text-xs border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
          <CreditCard className="w-8 h-8 mx-auto text-stone-300 mb-2" />
          <p className="font-semibold text-stone-700">Belum ada data hutang digital tercatat</p>
          <p className="text-[11px] text-stone-400 mt-0.5 max-w-sm mx-auto">
            Klik tombol &quot;Tambah Data Hutang&quot; untuk mencatat pinjaman platform (seperti PayLater, Pinjol, atau cicilan barang).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeDebts.map((debt) => {
            const paidAmount = debt.total_amount - debt.remaining_amount;
            const progressPercent = Math.min(100, Math.round((paidAmount / debt.total_amount) * 100));

            return (
              <div
                key={debt.id}
                className="p-4 rounded-xl border border-stone-200 hover:border-stone-300 bg-white transition-all text-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        {debt.platform_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                        Sisa {debt.remaining_tenor_months} Bln
                      </span>
                    </div>
                    {debt.notes && (
                      <p className="text-[11px] text-stone-500 mt-0.5 italic">
                        &quot;{debt.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenPayModal(debt)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Bayar Cicilan
                    </button>
                    <button
                      onClick={() => onOpenEditModal(debt)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
                      title="Ubah Data"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(debt)}
                      disabled={deletingId === debt.id}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors disabled:opacity-30"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Pelunasan */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1 text-stone-600">
                    <span>
                      Sisa: <strong className="text-stone-900">{formatRupiah(debt.remaining_amount)}</strong>
                    </span>
                    <span>
                      Total Pokok: <strong>{formatRupiah(debt.total_amount)}</strong>
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                    <span>Terbayar {progressPercent}%</span>
                    <span className="flex items-center gap-1 text-stone-600 font-medium">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      Jatuh tempo tiap tgl {debt.due_day}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    Angsuran: <strong className="text-rose-700">{formatRupiah(debt.monthly_installment)}/bln</strong>
                  </span>
                </div>
              </div>
            );
          })}

          {/* Daftar Hutang yang Sudah Lunas */}
          {paidDebts.length > 0 && (
            <div className="pt-3 border-t border-stone-100">
              <p className="text-[11px] font-bold text-stone-500 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Hutang Platform Yang Telah Lunas ({paidDebts.length})
              </p>
              <div className="space-y-1.5">
                {paidDebts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100/60 flex items-center justify-between text-xs opacity-80"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-800 line-through">
                        {p.platform_name}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        LUNAS
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-stone-500 text-[11px]">
                        Total {formatRupiah(p.total_amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Hapus riwayat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
