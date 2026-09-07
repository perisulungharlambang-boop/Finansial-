import { db, clearAllData as dexieClearAllData, DEFAULT_USER_ID } from '@/src/db/database';
import { 
  Profile, 
  Category, 
  Wallet, 
  Transaction, 
  CashFlowSummary, 
  LeakItem 
} from '@/src/types/finance';

export const financeService = {
  async clearAllData(): Promise<void> {
    await dexieClearAllData();
  },

  async getProfile(): Promise<Profile | undefined> {
    return await db.profiles.get(DEFAULT_USER_ID);
  },

  async updateMonthlyTarget(target: number): Promise<void> {
    await db.profiles.update(DEFAULT_USER_ID, {
      monthly_income_target: target,
    });
  },

  async getWallets(): Promise<Wallet[]> {
    return await db.wallets.toArray();
  },

  async addWallet(name: string, initialBalance: number): Promise<number> {
    const id = await db.wallets.add({
      user_id: DEFAULT_USER_ID,
      name: name.trim(),
      balance: initialBalance,
      created_at: new Date().toISOString(),
    });
    return id;
  },

  async deleteWallet(walletId: number): Promise<void> {
    await db.transaction('rw', [db.wallets, db.transactions], async () => {
      await db.transactions.where('wallet_id').equals(walletId).delete();
      await db.wallets.delete(walletId);
    });
  },

  async transferFunds(
    fromWalletId: number, 
    toWalletId: number, 
    amount: number, 
    note: string
  ): Promise<void> {
    if (fromWalletId === toWalletId) {
      throw new Error('Dompet asal dan tujuan tidak boleh sama');
    }
    if (amount <= 0) {
      throw new Error('Nominal transfer harus lebih besar dari 0');
    }

    await db.transaction('rw', [db.wallets, db.transactions], async () => {
      const fromWallet = await db.wallets.get(fromWalletId);
      const toWallet = await db.wallets.get(toWalletId);

      if (!fromWallet || !toWallet) {
        throw new Error('Pos rekening tidak ditemukan');
      }

      if (fromWallet.balance < amount) {
        throw new Error(
          `Saldo ${fromWallet.name} tidak cukup (tersedia: Rp ${fromWallet.balance.toLocaleString('id-ID')})`
        );
      }

      // Potong saldo asal & tambah saldo tujuan
      await db.wallets.update(fromWalletId, { balance: fromWallet.balance - amount });
      await db.wallets.update(toWalletId, { balance: toWallet.balance + amount });

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      await db.transactions.add({
        user_id: DEFAULT_USER_ID,
        wallet_id: fromWalletId,
        category_id: null,
        amount,
        type: 'expense',
        description: `Transfer ke ${toWallet.name}: ${note || 'Alokasi pos'}`,
        transaction_date: today,
        created_at: now,
      });

      await db.transactions.add({
        user_id: DEFAULT_USER_ID,
        wallet_id: toWalletId,
        category_id: null,
        amount,
        type: 'income',
        description: `Transfer dari ${fromWallet.name}: ${note || 'Alokasi pos'}`,
        transaction_date: today,
        created_at: now,
      });
    });
  },

  async getCategories(): Promise<Category[]> {
    return await db.categories.toArray();
  },

  async addCategory(name: string, type: 'income' | 'expense'): Promise<number> {
    const id = await db.categories.add({
      user_id: DEFAULT_USER_ID,
      name: name.trim(),
      type,
    });
    return id;
  },

  async getTransactions(): Promise<Transaction[]> {
    const all = await db.transactions.toArray();
    return all.sort((a, b) => {
      const dateCompare = b.transaction_date.localeCompare(a.transaction_date);
      if (dateCompare !== 0) return dateCompare;
      return (b.id || 0) - (a.id || 0);
    });
  },

  async addTransaction(data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>): Promise<number> {
    let insertedId = 0;

    await db.transaction('rw', [db.wallets, db.transactions], async () => {
      const wallet = await db.wallets.get(data.wallet_id);
      if (!wallet) {
        throw new Error('Pos rekening (wallet) tidak valid');
      }

      const newBalance = data.type === 'income' 
        ? wallet.balance + data.amount 
        : wallet.balance - data.amount;

      await db.wallets.update(data.wallet_id, { balance: newBalance });

      insertedId = await db.transactions.add({
        user_id: DEFAULT_USER_ID,
        wallet_id: data.wallet_id,
        category_id: data.category_id,
        amount: data.amount,
        type: data.type,
        description: data.description.trim(),
        transaction_date: data.transaction_date,
        created_at: new Date().toISOString(),
      });
    });

    return insertedId;
  },

  async deleteTransaction(id: number): Promise<void> {
    await db.transaction('rw', [db.wallets, db.transactions], async () => {
      const tx = await db.transactions.get(id);
      if (!tx) return;

      const wallet = await db.wallets.get(tx.wallet_id);
      if (wallet) {
        const revertedBalance = tx.type === 'income' 
          ? wallet.balance - tx.amount 
          : wallet.balance + tx.amount;
        await db.wallets.update(tx.wallet_id, { balance: revertedBalance });
      }

      await db.transactions.delete(id);
    });
  },

  async getCashFlowSummary(): Promise<CashFlowSummary> {
    const wallets = await db.wallets.toArray();
    const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

    const profile = await this.getProfile();
    const targetSavings = profile?.monthly_income_target || 3000000;

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const transactions = await db.transactions
      .filter((t) => t.transaction_date.startsWith(currentMonthPrefix))
      .toArray();

    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    }

    const netCashFlow = totalIncome - totalExpense;
    const savingsProgressPercent = targetSavings > 0 
      ? Math.min(100, Math.max(0, Math.round((netCashFlow / targetSavings) * 100))) 
      : 0;

    return {
      totalIncome,
      totalExpense,
      netCashFlow,
      savingsProgressPercent,
      targetSavings,
      totalBalance,
    };
  },

  async detectLeaks(): Promise<LeakItem[]> {
    const transactions = await db.transactions
      .filter((t) => t.type === 'expense')
      .toArray();
    const categories = await db.categories.toArray();
    const catMap = new Map(categories.map((c) => [c.id!, c.name]));

    const groups: Record<string, { total: number; count: number; samples: string[]; categoryId: number | null }> = {};

    const normalizeKey = (desc: string): string => {
      const lower = desc.toLowerCase().trim();
      if (lower.includes('kopi') || lower.includes('coffee') || lower.includes('cafe')) return 'Kopi & Minuman Kafe';
      if (lower.includes('ojol') || lower.includes('grab') || lower.includes('gojek') || lower.includes('maxim')) return 'Ojek Online Singkat';
      if (lower.includes('rokok') || lower.includes('vape')) return 'Rokok / Tembakau';
      if (lower.includes('snack') || lower.includes('camilan') || lower.includes('jajan') || lower.includes('boba')) return 'Jajan Camilan Sore';
      if (lower.includes('admin') || lower.includes('biaya bank')) return 'Biaya Admin & Transfer';
      if (lower.includes('spotify') || lower.includes('netflix') || lower.includes('youtube') || lower.includes('subscription')) return 'Langganan Digital Streaming';
      if (lower.includes('parkir')) return 'Uang Parkir Receh';
      return desc.slice(0, 20);
    };

    for (const tx of transactions) {
      if (tx.amount <= 150000) {
        const key = normalizeKey(tx.description);
        if (!groups[key]) {
          groups[key] = { total: 0, count: 0, samples: [], categoryId: tx.category_id };
        }
        groups[key].total += tx.amount;
        groups[key].count += 1;
        if (groups[key].samples.length < 3 && !groups[key].samples.includes(tx.description)) {
          groups[key].samples.push(tx.description);
        }
      }
    }

    const leakItems: LeakItem[] = [];

    for (const [key, data] of Object.entries(groups)) {
      if (data.count >= 2) {
        const weeklyAvg = Math.round(data.total / Math.max(1, data.count > 4 ? 4 : 2));
        const projectedAnnualCost = weeklyAvg * 52;
        const categoryName = data.categoryId && catMap.has(data.categoryId)
          ? catMap.get(data.categoryId)!
          : 'Bocor Halus';

        leakItems.push({
          id: key.replace(/\s+/g, '-').toLowerCase(),
          title: key,
          categoryName,
          frequencyThisMonth: data.count,
          totalSpentThisMonth: data.total,
          weeklyAverage: weeklyAvg,
          projectedAnnualCost,
          sampleDescriptions: data.samples,
        });
      }
    }

    return leakItems.sort((a, b) => b.projectedAnnualCost - a.projectedAnnualCost);
  },
};
