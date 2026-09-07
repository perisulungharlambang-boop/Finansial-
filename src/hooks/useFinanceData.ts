import { useState, useEffect, useCallback } from 'react';
import { seedInitialDataIfNeeded } from '@/src/db/database';
import { financeService } from '@/src/services/financeService';
import { debtService } from '@/src/services/debtService';
import { 
  Wallet, 
  Category, 
  Transaction, 
  CashFlowSummary, 
  LeakItem, 
  TransactionType,
  Debt 
} from '@/src/types/finance';
import { ToastMessage } from '@/src/components/Toast';

export function useFinanceData() {
  const [isLoading, setIsLoading] = useState(true);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [leaks, setLeaks] = useState<LeakItem[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
    savingsProgressPercent: 0,
    targetSavings: 3000000,
    totalBalance: 0,
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [allWallets, allCategories, allTxs, cashSummary, leakItems, allDebts] = await Promise.all([
        financeService.getWallets(),
        financeService.getCategories(),
        financeService.getTransactions(),
        financeService.getCashFlowSummary(),
        financeService.detectLeaks(),
        debtService.getDebts(),
      ]);

      setWallets(allWallets);
      setCategories(allCategories);
      setTransactions(allTxs);
      setSummary(cashSummary);
      setLeaks(leakItems);
      setDebts(allDebts);
    } catch (err) {
      console.error('Gagal memuat data keuangan:', err);
      addToast('Terjadi kesalahan saat memuat data lokal', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        await seedInitialDataIfNeeded();
      } catch (err) {
        console.warn('Inisialisasi database Dexie:', err);
      }
      if (isMounted) {
        await loadAllData();
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadAllData]);

  const handleAddTransaction = async (data: {
    amount: number;
    type: TransactionType;
    wallet_id: number;
    category_id: number | null;
    description: string;
    transaction_date: string;
  }) => {
    await financeService.addTransaction(data);
    await loadAllData();
    addToast(`Transaksi ${data.type === 'income' ? 'masuk' : 'keluar'} berhasil dicatat!`, 'success');
  };

  const handleDeleteTransaction = async (id: number) => {
    await financeService.deleteTransaction(id);
    await loadAllData();
    addToast('Catatan transaksi berhasil dihapus', 'info');
  };

  const handleAddWallet = async (name: string, balance: number) => {
    await financeService.addWallet(name, balance);
    await loadAllData();
    addToast(`Pos rekening "${name}" berhasil dibuat!`, 'success');
  };

  const handleDeleteWallet = async (walletId: number) => {
    await financeService.deleteWallet(walletId);
    await loadAllData();
    addToast('Pos rekening berhasil dihapus', 'info');
  };

  const handleTransfer = async (
    fromWalletId: number,
    toWalletId: number,
    amount: number,
    note: string
  ) => {
    await financeService.transferFunds(fromWalletId, toWalletId, amount, note);
    await loadAllData();
    addToast('Pindah saldo antar pos berhasil!', 'success');
  };

  const handleUpdateTarget = async (target: number) => {
    await financeService.updateMonthlyTarget(target);
    await loadAllData();
    addToast('Target tabungan bulanan berhasil diperbarui!', 'success');
  };

  const handleAddCategory = async (name: string, type: TransactionType): Promise<number> => {
    const id = await financeService.addCategory(name, type);
    const updated = await financeService.getCategories();
    setCategories(updated);
    return id;
  };

  const handleSaveDebt = async (data: {
    platform_name: string;
    total_amount: number;
    remaining_amount: number;
    monthly_installment: number;
    due_day: number;
    remaining_tenor_months: number;
    notes?: string;
  }, editingId?: number) => {
    if (editingId) {
      await debtService.updateDebt(editingId, data);
      addToast(`Data hutang "${data.platform_name}" diperbarui`, 'success');
    } else {
      await debtService.addDebt(data);
      addToast(`Hutang platform "${data.platform_name}" berhasil dicatat`, 'success');
    }
    await loadAllData();
  };

  const handleDeleteDebt = async (id: number) => {
    await debtService.deleteDebt(id);
    await loadAllData();
    addToast('Data hutang platform berhasil dihapus', 'info');
  };

  const handlePayDebt = async (debtId: number, walletId: number, amount: number, notes?: string) => {
    await debtService.payInstallment(debtId, walletId, amount, notes);
    await loadAllData();
    addToast('Pembayaran cicilan berhasil dicatat & saldo pos terpotong', 'success');
  };

  const handleClearAllData = async () => {
    await financeService.clearAllData();
    await loadAllData();
    addToast('Seluruh data transaksi, hutang, dan saldo berhasil dikosongkan!', 'info');
  };

  return {
    isLoading,
    wallets,
    categories,
    transactions,
    leaks,
    debts,
    summary,
    toasts,
    dismissToast,
    handleAddTransaction,
    handleDeleteTransaction,
    handleAddWallet,
    handleDeleteWallet,
    handleTransfer,
    handleUpdateTarget,
    handleAddCategory,
    handleSaveDebt,
    handleDeleteDebt,
    handlePayDebt,
    handleClearAllData,
  };
}
