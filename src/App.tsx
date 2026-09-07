import { useState } from 'react';
import { useFinanceData } from '@/src/hooks/useFinanceData';
import { Debt } from '@/src/types/finance';
import { Header } from '@/src/components/Header';
import { CashFlowDashboard } from '@/src/components/CashFlowDashboard';
import { WalletCards } from '@/src/components/WalletCards';
import { DebtTracker } from '@/src/components/DebtTracker';
import { LeakDetector } from '@/src/components/LeakDetector';
import { TransactionList } from '@/src/components/TransactionList';
import { QuickEntryModal } from '@/src/components/QuickEntryModal';
import { TransferModal } from '@/src/components/TransferModal';
import { DebtModal } from '@/src/components/DebtModal';
import { PayDebtModal } from '@/src/components/PayDebtModal';
import { ToastContainer } from '@/src/components/Toast';
import { Loader2 } from 'lucide-react';

export default function App() {
  const {
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
  } = useFinanceData();

  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mb-3" />
        <p className="text-xs font-bold text-stone-700">Mempersiapkan Database Keuangan...</p>
        <p className="text-[11px] text-stone-500 mt-1">Menyiapkan penyimpanan offline aman di perangkat Anda</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col selection:bg-emerald-200">
      <Header
        onOpenQuickEntry={() => setIsQuickEntryOpen(true)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onClearData={handleClearAllData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dashboard Arus Kas */}
        <CashFlowDashboard
          summary={summary}
          onUpdateTarget={handleUpdateTarget}
        />

        {/* Pelacak Hutang & Cicilan Digital */}
        <DebtTracker
          debts={debts}
          monthlyIncome={summary.totalIncome || 3000000}
          onOpenAddModal={() => {
            setEditingDebt(null);
            setIsDebtModalOpen(true);
          }}
          onOpenEditModal={(debt) => {
            setEditingDebt(debt);
            setIsDebtModalOpen(true);
          }}
          onOpenPayModal={(debt) => {
            setPayingDebt(debt);
            setIsPayDebtModalOpen(true);
          }}
          onDeleteDebt={handleDeleteDebt}
        />

        {/* Manajemen Pos Rekening (Wallets) */}
        <WalletCards
          wallets={wallets}
          totalBalance={summary.totalBalance}
          onAddWallet={handleAddWallet}
          onDeleteWallet={handleDeleteWallet}
          onOpenTransfer={() => setIsTransferOpen(true)}
        />

        {/* Deteksi Bocor Halus */}
        <LeakDetector leaks={leaks} />

        {/* Riwayat Transaksi */}
        <TransactionList
          transactions={transactions}
          categories={categories}
          wallets={wallets}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </main>

      <footer className="mt-12 py-6 border-t border-stone-200 bg-white text-center text-xs text-stone-500">
        <p className="font-semibold text-stone-700">Personal Finance Tracker</p>
        <p className="text-[11px] text-stone-400 mt-1">
          Penyimpanan offline lokal murni menggunakan Dexie (IndexedDB). Data tersimpan aman di perangkat Anda.
        </p>
      </footer>

      {/* Modals & Toasts */}
      <QuickEntryModal
        isOpen={isQuickEntryOpen}
        onClose={() => setIsQuickEntryOpen(false)}
        categories={categories}
        wallets={wallets}
        onSubmit={handleAddTransaction}
        onAddCategory={handleAddCategory}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        wallets={wallets}
        onTransfer={handleTransfer}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setEditingDebt(null);
        }}
        onSubmit={(data) => handleSaveDebt(data, editingDebt?.id)}
        initialData={editingDebt}
      />

      <PayDebtModal
        isOpen={isPayDebtModalOpen}
        onClose={() => {
          setIsPayDebtModalOpen(false);
          setPayingDebt(null);
        }}
        debt={payingDebt}
        wallets={wallets}
        onPay={handlePayDebt}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
