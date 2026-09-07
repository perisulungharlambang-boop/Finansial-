export type TransactionType = 'income' | 'expense';

export interface Profile {
  id: string;
  name: string;
  monthly_income_target: number;
  created_at: string;
}

export interface Category {
  id?: number;
  user_id: string;
  name: string;
  type: TransactionType;
}

export interface Wallet {
  id?: number;
  user_id: string;
  name: string;
  balance: number;
  created_at: string;
  color?: string;
}

export interface Transaction {
  id?: number;
  user_id: string;
  wallet_id: number;
  category_id: number | null;
  amount: number;
  type: TransactionType;
  description: string;
  transaction_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface LeakItem {
  id: string;
  title: string;
  categoryName: string;
  frequencyThisMonth: number;
  totalSpentThisMonth: number;
  weeklyAverage: number;
  projectedAnnualCost: number;
  sampleDescriptions: string[];
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  savingsProgressPercent: number;
  targetSavings: number;
  totalBalance: number;
}

export interface Debt {
  id?: number;
  user_id: string;
  platform_name: string;
  total_amount: number;
  remaining_amount: number;
  monthly_installment: number;
  due_day: number; // 1 - 31
  remaining_tenor_months: number;
  status: 'active' | 'paid_off';
  notes?: string;
  created_at: string;
}

