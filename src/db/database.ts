import Dexie, { type Table } from 'dexie';
import { Profile, Category, Wallet, Transaction, Debt } from '@/src/types/finance';

export const DEFAULT_USER_ID = 'user_default';

export class FinanceDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  categories!: Table<Category, number>;
  wallets!: Table<Wallet, number>;
  transactions!: Table<Transaction, number>;
  debts!: Table<Debt, number>;

  constructor() {
    super('PersonalFinanceDexieDB');
    this.version(1).stores({
      profiles: 'id',
      categories: '++id, user_id, name, type',
      wallets: '++id, user_id, name',
      transactions: '++id, user_id, wallet_id, category_id, type, transaction_date',
      debts: '++id, user_id, platform_name, status, due_day',
    });
  }
}

export const db = new FinanceDatabase();

const DEFAULT_CATEGORIES = [
  { name: 'Gaji Pokok', type: 'income' as const },
  { name: 'Bonus & Insentif', type: 'income' as const },
  { name: 'Bisnis & Freelance', type: 'income' as const },
  { name: 'Makanan & Minuman', type: 'expense' as const },
  { name: 'Kopi & Jajan Harian', type: 'expense' as const },
  { name: 'Transportasi & Ojol', type: 'expense' as const },
  { name: 'Tagihan & Langganan', type: 'expense' as const },
  { name: 'Belanja Kebutuhan', type: 'expense' as const },
  { name: 'Kesehatan', type: 'expense' as const },
  { name: 'Hiburan', type: 'expense' as const },
  { name: 'Cicilan & Hutang Digital', type: 'expense' as const },
];

/**
 * Inisialisasi data profil awal dan kategori jika database masih baru
 */
export async function seedInitialDataIfNeeded(): Promise<void> {
  const profileCount = await db.profiles.count();
  if (profileCount === 0) {
    await db.profiles.put({
      id: DEFAULT_USER_ID,
      name: 'Pengguna',
      monthly_income_target: 0,
      created_at: new Date().toISOString(),
    });
  }

  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await db.categories.add({
        user_id: DEFAULT_USER_ID,
        name: cat.name,
        type: cat.type,
      });
    }
  }

  const walletCount = await db.wallets.count();
  if (walletCount === 0) {
    await db.wallets.add({
      user_id: DEFAULT_USER_ID,
      name: 'Dompet Utama',
      balance: 0,
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Mengosongkan data transaksi, hutang, dan pos rekening
 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.transactions, db.debts, db.wallets, db.profiles], async () => {
    await db.transactions.clear();
    await db.debts.clear();
    await db.wallets.clear();

    await db.profiles.update(DEFAULT_USER_ID, {
      monthly_income_target: 0,
    });

    await db.wallets.add({
      user_id: DEFAULT_USER_ID,
      name: 'Dompet Utama',
      balance: 0,
      created_at: new Date().toISOString(),
    });
  });
}
