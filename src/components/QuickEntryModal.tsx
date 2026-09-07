import React, { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { Category, Wallet, TransactionType } from '@/src/types/finance';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  wallets: Wallet[];
  onSubmit: (data: {
    amount: number;
    type: TransactionType;
    wallet_id: number;
    category_id: number | null;
    description: string;
    transaction_date: string;
  }) => Promise<void>;
  onAddCategory: (name: string, type: TransactionType) => Promise<number>;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  categories,
  wallets,
  onSubmit,
  onAddCategory,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [walletId, setWalletId] = useState<number>(wallets[0]?.id || 1);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addVal).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Nominal transaksi harus lebih besar dari 0');
      return;
    }
    if (!walletId) {
      setErrorMsg('Pilih pos rekening (wallet) terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit({
        amount: numAmount,
        type,
        wallet_id: walletId,
        category_id: categoryId || (filteredCategories[0]?.id ?? null),
        description: description.trim() || (type === 'income' ? 'Pemasukan' : 'Pengeluaran'),
        transaction_date: transactionDate,
      });
      // Reset form
      setAmount('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Pencatatan Cepat (Quick Entry)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Catat pemasukan atau pengeluaran harian dalam hitungan detik
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Switch Jenis Transaksi */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId(null);
              }}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pengeluaran (Keluar)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId(null);
              }}
              className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pemasukan (Masuk)
            </button>
          </div>

          {/* Input Nominal */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Nominal (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">
                Rp
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 text-base font-extrabold text-stone-900 border border-stone-300 rounded-xl focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                disabled={isSubmitting}
                required
                autoFocus
              />
            </div>
            {/* Quick buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[15000, 25000, 50000, 100000, 500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer text-[11px]"
                >
                  +{val >= 1000 ? `${val / 1000}rb` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Catatan Singkat / Nama Barang *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Es kopi susu aren, Nasi goreng, Ojol"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Pos Rekening (Wallet) & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Pos Rekening (Wallet) *
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                disabled={isSubmitting}
                required
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Kategori
              </label>
              <select
                value={categoryId ?? ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                disabled={isSubmitting}
              >
                <option value="">-- Pilih Kategori --</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tanggal Transaksi */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
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
                  Menyimpan...
                </>
              ) : (
                'Simpan Catatan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
