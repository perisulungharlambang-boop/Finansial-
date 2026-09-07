import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight, Wallet as WalletIcon } from 'lucide-react';
import { Debt, Wallet } from '@/src/types/finance';
import { formatRupiah } from '@/src/utils/formatters';

interface PayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  wallets: Wallet[];
  onPay: (debtId: number, walletId: number, amount: number, notes?: string) => Promise<void>;
}

export const PayDebtModal: React.FC<PayDebtModalProps> = ({
  isOpen,
  onClose,
  debt,
  wallets,
  onPay,
}) => {
  const [selectedWalletId, setSelectedWalletId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && debt) {
      // Default amount ke monthly installment atau sisa hutang (mana yang lebih kecil)
      const defaultPay = Math.min(debt.monthly_installment, debt.remaining_amount);
      setAmount(defaultPay.toString());
      setNotes(`Cicilan ${debt.platform_name}`);
      setErrorMsg('');

      // Pilih dompet pertama dengan saldo mencukupi jika ada
      if (wallets.length > 0) {
        const eligibleWallet = wallets.find((w) => w.balance >= defaultPay) || wallets[0];
        setSelectedWalletId(eligibleWallet.id || '');
      }
    }
  }, [isOpen, debt, wallets]);

  if (!isOpen || !debt) return null;

  const selectedWallet = wallets.find((w) => w.id === Number(selectedWalletId));
  const payAmountNumber = Number(amount.replace(/\D/g, '')) || 0;
  const projectedRemaining = Math.max(0, debt.remaining_amount - payAmountNumber);
  const projectedTenor = Math.max(0, debt.remaining_tenor_months - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedWalletId) {
      setErrorMsg('Pilih pos rekening sumber pembayaran');
      return;
    }

    if (payAmountNumber <= 0) {
      setErrorMsg('Nominal pembayaran harus lebih dari 0');
      return;
    }

    if (selectedWallet && selectedWallet.balance < payAmountNumber) {
      setErrorMsg(`Saldo pada ${selectedWallet.name} tidak mencukupi`);
      return;
    }

    setIsLoading(true);
    try {
      if (debt.id) {
        await onPay(debt.id, Number(selectedWalletId), payAmountNumber, notes);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses pembayaran cicilan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Bayar Angsuran / Cicilan
              </h3>
              <p className="text-[11px] text-stone-500">
                {debt.platform_name} • Sisa {formatRupiah(debt.remaining_amount)}
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Pilih Pos Rekening */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Sumber Pembayaran (Pos Rekening) *
            </label>
            <div className="space-y-1.5">
              {wallets.map((w) => {
                const isSelected = selectedWalletId === w.id;
                const isEnough = w.balance >= payAmountNumber;
                return (
                  <label
                    key={w.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="walletSelect"
                        checked={isSelected}
                        onChange={() => setSelectedWalletId(w.id || '')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <WalletIcon className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-semibold text-stone-800">{w.name}</span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isEnough ? 'text-stone-700' : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(w.balance)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Nominal Pembayaran */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-stone-600">
                Nominal Yang Dibayar (Rp) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(debt.remaining_amount.toString())}
                className="text-[10px] text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Lunasi Semua ({formatRupiah(debt.remaining_amount)})
              </button>
            </div>
            <input
              type="number"
              required
              min="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs font-bold text-stone-900"
            />
          </div>

          {/* Catatan Transaksi */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 mb-1">
              Keterangan Pengeluaran
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Cicilan ke-2"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden text-xs"
            />
          </div>

          {/* Preview Dampak Pelunasan */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-stone-600">
              <span>Sisa pokok hutang setelah bayar:</span>
              <span className="font-bold text-stone-900 flex items-center gap-1">
                {formatRupiah(debt.remaining_amount)}
                <ArrowRight className="w-3 h-3 text-stone-400" />
                <span className={projectedRemaining === 0 ? 'text-emerald-700' : 'text-stone-900'}>
                  {projectedRemaining === 0 ? 'LUNAS 🎉' : formatRupiah(projectedRemaining)}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Sisa tenor waktu:</span>
              <span className="font-semibold text-stone-800">
                {projectedTenor} bulan lagi
              </span>
            </div>
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
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? 'Memproses...' : 'Konfirmasi Bayar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
