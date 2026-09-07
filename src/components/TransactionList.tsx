import React, { useState, useMemo } from 'react';
import { Search, Filter, Trash2, ArrowDownLeft, ArrowUpRight, Calendar, Tag } from 'lucide-react';
import { Transaction, Category, Wallet } from '@/src/types/finance';
import { formatRupiah, formatDate } from '@/src/utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
  onDeleteTransaction: (id: number) => Promise<void>;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  wallets,
  onDeleteTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterWalletId, setFilterWalletId] = useState<string>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w.name])), [wallets]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterWalletId !== 'all' && t.wallet_id !== Number(filterWalletId)) return false;
      if (filterCategoryId !== 'all' && t.category_id !== Number(filterCategoryId)) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(query);
        const catName = (t.category_id && catMap.get(t.category_id)?.toLowerCase()) || '';
        const walletName = walletMap.get(t.wallet_id)?.toLowerCase() || '';
        if (!descMatch && !catName.includes(query) && !walletName.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, filterType, filterWalletId, filterCategoryId, searchTerm, catMap, walletMap]);

  const handleDelete = async (t: Transaction) => {
    if (!t.id) return;
    const confirm = window.confirm(`Hapus catatan transaksi "${t.description}" sebesar ${formatRupiah(t.amount)}?`);
    if (confirm) {
      setDeletingId(t.id);
      try {
        await onDeleteTransaction(t.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-4 border-b border-stone-100">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Riwayat Arus Kas Harian
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar seluruh transaksi yang tercatat di database lokal Anda
          </p>
        </div>
        <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
          Total: {filteredTransactions.length} transaksi
        </span>
      </div>

      {/* Baris Filter & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4 text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari transaksi atau pos..."
            className="w-full pl-8 pr-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:border-stone-400 outline-hidden"
          />
        </div>

        {/* Filter Jenis */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
        >
          <option value="all">Semua Jenis (Masuk & Keluar)</option>
          <option value="expense">Hanya Pengeluaran</option>
          <option value="income">Hanya Pemasukan</option>
        </select>

        {/* Filter Pos Rekening */}
        <select
          value={filterWalletId}
          onChange={(e) => setFilterWalletId(e.target.value)}
          className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
        >
          <option value="all">Semua Pos Rekening</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {/* Filter Kategori */}
        <select
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 focus:bg-white"
        >
          <option value="all">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type === 'income' ? 'Masuk' : 'Keluar'})
            </option>
          ))}
        </select>
      </div>

      {/* Tabel Transaksi */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12 text-center text-stone-500 text-xs">
          <Filter className="w-8 h-8 mx-auto text-stone-300 mb-2" />
          <p className="font-semibold text-stone-700">Tidak ada transaksi yang cocok</p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Coba sesuaikan filter atau tambahkan transaksi baru
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="divide-y divide-stone-100">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const walletName = walletMap.get(tx.wallet_id) || 'Pos Umum';
              const categoryName = (tx.category_id && catMap.get(tx.category_id)) || (isIncome ? 'Pemasukan' : 'Pengeluaran');

              return (
                <div
                  key={tx.id}
                  className="py-3 px-2 hover:bg-stone-50/80 rounded-xl transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 truncate">
                        {tx.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {formatDate(tx.transaction_date)}
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-stone-100 font-medium text-stone-700">
                          {walletName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-stone-500">
                          <Tag className="w-2.5 h-2.5 text-stone-400" />
                          {categoryName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-extrabold tracking-tight ${
                        isIncome ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx)}
                      disabled={deletingId === tx.id}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
