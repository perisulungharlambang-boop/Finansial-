import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Debt } from '@/src/types/finance';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    platform_name: string;
    total_amount: number;
    remaining_amount: number;
    monthly_installment: number;
    due_day: number;
    remaining_tenor_months: number;
    notes?: string;
  }) => Promise<void>;
  initialData?: Debt | null;
}

const PRESET_PLATFORMS = [
  'Shopee PayLater',
  'SPinjam',
  'GoPay Later',
  'GoPay Pinjam',
  'Kredivo',
  'Akulaku',
  'DANA Cicil',
  'Indodana',
  'KPR Bank',
];

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [platformName, setPlatformName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [remainingTenor, setRemainingTenor] = useState('3');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setPlatformName(initialData.platform_name);
        setTotalAmount(initialData.total_amount.toString());
        setRemainingAmount(initialData.remaining_amount.toString());
        setMonthlyInstallment(initialData.monthly_installment.toString());
        setDueDay(initialData.due_day.toString());
        setRemainingTenor(initialData.remaining_tenor_months.toString());
        setNotes(initialData.notes || '');
      } else {
        setPlatformName('');
        setTotalAmount('');
        setRemainingAmount('');
        setMonthlyInstallment('');
        setDueDay('10');
        setRemainingTenor('3');
        setNotes('');
      }
      setErrorMsg('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!platformName.trim()) {
      setErrorMsg('Nama platform pinjaman wajib diisi');
      return;
    }

    const total = Number(totalAmount.replace(/\D/g, ''));
    const remaining = Number(remainingAmount.replace(/\D/g, '')) || total;
    const installment = Number(monthlyInstallment.replace(/\D/g, ''));
    const day = Number(dueDay);
    const tenor = Number(remainingTenor);

    if (!total || total <= 0) {
      setErrorMsg('Total pokok hutang harus lebih dari 0');
      return;
    }
    if (!installment || installment <= 0) {
      setErrorMsg('Cicilan per bulan harus lebih dari 0');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        platform_name: platformName.trim(),
        total_amount: total,
        remaining_amount: remaining,
        monthly_installment: installment,
        due_day: day || 10,
        remaining_tenor_months: tenor || 1,
        notes,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data hutang');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                {initialData ? 'Ubah Data Hutang' : 'Catat Hutang Digital / Cicilan'}
              </h3>
              <p className="text-[11px] text-stone-500">
                Pencatatan manual untuk memantau sisa kewajiban cicilan bulanan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Preset Platform */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
              Pilih Platform Populer (Opsional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PLATFORMS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPlatformName(p)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                    platformName === p
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Nama Platform Input */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Nama Platform / Jenis Pinjaman *
            </label>
            <input
              type="text"
              required
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="Contoh: Shopee PayLater, Kredivo, SPinjam"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs"
            />
          </div>

          {/* Pokok & Sisa Hutang */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Total Pinjaman Awal (Rp) *
              </label>
              <input
                type="number"
                required
                min="1000"
                value={totalAmount}
                onChange={(e) => {
                  setTotalAmount(e.target.value);
                  if (!remainingAmount) setRemainingAmount(e.target.value);
                }}
                placeholder="1000000"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Sisa Hutang Saat Ini (Rp) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={remainingAmount}
                onChange={(e) => setRemainingAmount(e.target.value)}
                placeholder="800000"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs"
              />
            </div>
          </div>

          {/* Cicilan & Jatuh Tempo */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Cicilan / Bln (Rp) *
              </label>
              <input
                type="number"
                required
                min="1000"
                value={monthlyInstallment}
                onChange={(e) => setMonthlyInstallment(e.target.value)}
                placeholder="250000"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                Tgl Tempo
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                Sisa Tenor
              </label>
              <input
                type="number"
                min="1"
                required
                value={remainingTenor}
                onChange={(e) => setRemainingTenor(e.target.value)}
                placeholder="Bulan"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Catatan / Keperluan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pembelian mesin cuci / keperluan darurat"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : initialData ? 'Perbarui Data' : 'Simpan Hutang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
