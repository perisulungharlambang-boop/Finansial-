import React, { useState } from 'react';
import { Plus, ArrowLeftRight, Trash2, Layers, AlertCircle } from 'lucide-react';
import { Wallet } from '@/src/types/finance';
import { formatRupiah } from '@/src/utils/formatters';

interface WalletCardsProps {
  wallets: Wallet[];
  totalBalance: number;
  onAddWallet: (name: string, balance: number) => Promise<void>;
  onDeleteWallet: (walletId: number) => Promise<void>;
  onOpenTransfer: () => void;
}

export const WalletCards: React.FC<WalletCardsProps> = ({
  wallets,
  totalBalance,
  onAddWallet,
  onDeleteWallet,
  onOpenTransfer,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) {
      setErrorMsg('Nama pos rekening wajib diisi');
      return;
    }
    const balance = parseFloat(newWalletBalance) || 0;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onAddWallet(newWalletName.trim(), balance);
      setNewWalletName('');
      setNewWalletBalance('');
      setShowAddForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan pos rekening');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (wallet: Wallet) => {
    if (wallets.length <= 1) {
      alert('Minimal harus tersisa 1 pos rekening aktif.');
      return;
    }
    const confirmDelete = window.confirm(
      `Hapus pos "${wallet.name}"? Semua catatan transaksi yang terkait pos ini juga akan dihapus.`
    );
    if (confirmDelete && wallet.id) {
      await onDeleteWallet(wallet.id);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-base font-bold text-stone-900">
              Pos Rekening & Alokasi Dana (Wallets)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Sistem pemisahan uang (Tabungan, Operasional Harian, & Jajan) untuk mencegah percampuran kas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransfer}
            className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Pindah Saldo
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddForm ? 'Tutup' : 'Tambah Pos'}
          </button>
        </div>
      </div>

      {/* Form Tambah Pos Baru */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="mb-5 p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs">
          <h3 className="font-bold text-stone-800 mb-2">Buat Pos Rekening Baru</h3>
          {errorMsg && (
            <div className="mb-2 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Nama Pos (Misal: Dana Liburan, Belanja)</label>
              <input
                type="text"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder="Contoh: Dompet Belanja Mingguan"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700 mb-1">Saldo Awal (Rp)</label>
              <input
                type="number"
                value={newWalletBalance}
                onChange={(e) => setNewWalletBalance(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 font-medium text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pos'}
            </button>
          </div>
        </form>
      )}

      {/* Grid Pos Rekening */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {wallets.map((wallet) => {
          const percentage = totalBalance > 0 
            ? Math.round((wallet.balance / totalBalance) * 100) 
            : 0;

          return (
            <div
              key={wallet.id}
              className="group relative p-4 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50/50 hover:bg-white transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 truncate max-w-[150px]">
                    {wallet.name}
                  </h4>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {percentage}% dari total aset
                  </span>
                </div>
                {wallets.length > 1 && (
                  <button
                    onClick={() => handleDelete(wallet)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-opacity rounded cursor-pointer"
                    title="Hapus Pos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-2">
                <p className="text-base font-extrabold text-stone-900 tracking-tight">
                  {formatRupiah(wallet.balance)}
                </p>
                {/* Mini bar */}
                <div className="w-full h-1 bg-stone-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${Math.max(3, Math.min(100, percentage))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
