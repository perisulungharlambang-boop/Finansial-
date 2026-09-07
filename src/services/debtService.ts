import { db, DEFAULT_USER_ID } from '@/src/db/database';
import { Debt } from '@/src/types/finance';

export const debtService = {
  async getDebts(): Promise<Debt[]> {
    const all = await db.debts.toArray();
    return all.sort((a, b) => {
      if (a.status === 'active' && b.status === 'paid_off') return -1;
      if (a.status === 'paid_off' && b.status === 'active') return 1;
      return (b.id || 0) - (a.id || 0);
    });
  },

  async addDebt(data: {
    platform_name: string;
    total_amount: number;
    remaining_amount: number;
    monthly_installment: number;
    due_day: number;
    remaining_tenor_months: number;
    notes?: string;
  }): Promise<number> {
    if (data.total_amount <= 0 || data.monthly_installment <= 0) {
      throw new Error('Nominal hutang dan cicilan bulanan harus lebih dari 0');
    }

    const cleanRemaining = Math.min(data.remaining_amount, data.total_amount);
    const cleanTenor = Math.max(1, data.remaining_tenor_months);
    const status = cleanRemaining <= 0 ? 'paid_off' : 'active';

    const id = await db.debts.add({
      user_id: DEFAULT_USER_ID,
      platform_name: data.platform_name.trim(),
      total_amount: data.total_amount,
      remaining_amount: cleanRemaining,
      monthly_installment: data.monthly_installment,
      due_day: Math.max(1, Math.min(31, data.due_day)),
      remaining_tenor_months: cleanTenor,
      status,
      notes: data.notes?.trim() || '',
      created_at: new Date().toISOString(),
    });

    return id;
  },

  async updateDebt(id: number, updates: Partial<Debt>): Promise<void> {
    const existing = await db.debts.get(id);
    if (!existing) {
      throw new Error('Data hutang tidak ditemukan');
    }

    const newRemaining = updates.remaining_amount !== undefined 
      ? Math.max(0, updates.remaining_amount) 
      : existing.remaining_amount;

    const newTenor = updates.remaining_tenor_months !== undefined
      ? Math.max(0, updates.remaining_tenor_months)
      : existing.remaining_tenor_months;

    const status = (newRemaining <= 0 || newTenor <= 0) 
      ? 'paid_off' 
      : (updates.status || existing.status);

    await db.debts.update(id, {
      ...updates,
      remaining_amount: newRemaining,
      remaining_tenor_months: newTenor,
      status,
    });
  },

  async deleteDebt(id: number): Promise<void> {
    await db.debts.delete(id);
  },

  async payInstallment(
    debtId: number,
    walletId: number,
    amount: number,
    notes?: string
  ): Promise<void> {
    if (amount <= 0) {
      throw new Error('Nominal pembayaran cicilan harus lebih dari 0');
    }

    await db.transaction('rw', [db.debts, db.wallets, db.categories, db.transactions], async () => {
      const debt = await db.debts.get(debtId);
      if (!debt) {
        throw new Error('Data hutang tidak ditemukan');
      }

      const wallet = await db.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Pos rekening sumber pembayaran tidak ditemukan');
      }

      if (wallet.balance < amount) {
        throw new Error(
          `Saldo ${wallet.name} tidak cukup (tersedia: Rp ${wallet.balance.toLocaleString('id-ID')})`
        );
      }

      // 1. Kurangi saldo pos rekening
      await db.wallets.update(walletId, { balance: wallet.balance - amount });

      // 2. Cari atau buat kategori Cicilan & Hutang Digital
      const existingCats = await db.categories
        .filter((c) => c.name.toLowerCase().includes('cicilan') || c.name.toLowerCase().includes('tagihan'))
        .toArray();

      let categoryId: number | null = existingCats[0]?.id || null;

      if (!categoryId) {
        categoryId = await db.categories.add({
          user_id: DEFAULT_USER_ID,
          name: 'Cicilan & Hutang Digital',
          type: 'expense',
        });
      }

      // 3. Catat transaksi pengeluaran
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      const txDesc = `Cicilan ${debt.platform_name}${notes ? ` - ${notes}` : ''}`;

      await db.transactions.add({
        user_id: DEFAULT_USER_ID,
        wallet_id: walletId,
        category_id: categoryId,
        amount,
        type: 'expense',
        description: txDesc,
        transaction_date: today,
        created_at: now,
      });

      // 4. Update sisa hutang dan tenor
      const newRemaining = Math.max(0, debt.remaining_amount - amount);
      const newTenor = Math.max(0, debt.remaining_tenor_months - 1);
      const newStatus = newRemaining === 0 ? 'paid_off' : debt.status;

      await db.debts.update(debtId, {
        remaining_amount: newRemaining,
        remaining_tenor_months: newTenor,
        status: newStatus,
      });
    });
  },
};
