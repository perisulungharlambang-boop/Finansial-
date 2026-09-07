import React, { useState } from 'react';
import { X, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Wallet } from '@/src/types/finance';
import { formatRupiah } from '@/src/utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  onTransfer: (fromWalletId: number, toWalletId: number, amount: number, note: string) => Promise<void>;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onTransfer,
}) => {
  const [fromWalletId, setFromWalletId] = useState<number>(wallets[0]?.id || 1);
  const [toWalletId, setToWalletId] = useState<number>(wallets[1]?.id || wallets[0]?.id || 2);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('Pindah pos mingguan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const sourceWallet = wallets.find((w) => w.id === fromWalletId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setErrorMsg('Nominal transfer harus lebih besar dari 0');
      return;
    }
    if (fromWalletId === toWalletId) {
      setErrorMsg('Pos asal dan tujuan tidak boleh sama');
      return;
    }
    if (sourceWallet && num > sourceWallet.balance) {
      setErrorMsg(`Saldo di ${sourceWallet.name} tidak mencukupi (${formatRupiah(sourceWallet.balance)})`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onTransfer(fromWalletId, toWalletId, num, note);
      setAmount('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses transfer pos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Pindah Saldo Antar Pos (Transfer)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Alokasikan dana dari rekening utama ke pos operasional/jajan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Dari Pos (Asal)
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                disabled={isSubmitting}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                Ke Pos (Tujuan)
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                disabled={isSubmitting}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Nominal Alokasi (Rp) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 text-sm font-extrabold text-stone-900 border border-stone-300 rounded-lg bg-white"
              disabled={isSubmitting}
              required
            />
            {sourceWallet && (
              <p className="text-[11px] text-stone-500 mt-1">
                Saldo tersedia di {sourceWallet.name}:{' '}
                <strong className="text-stone-800">{formatRupiah(sourceWallet.balance)}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Catatan Pindah Saldo
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Alokasi jajan minggu ke-2"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Pindah Saldo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
