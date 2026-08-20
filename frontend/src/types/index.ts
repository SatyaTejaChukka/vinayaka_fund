export interface FundSummary {
  id: number;
  name: str;
  year: number;
  description?: string;
  target_amount: number;
  total_collected: number;
  total_spent: number;
  pending_expenses: number;
  available_balance: number;
  committed_balance: number;
  collection_percentage: number;
  expense_percentage: number;
  verified_donations_count: number;
  expenses_count: number;
  upi_id: string;
  upi_name: string;
  notification_email?: string;
  public_slug: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export type str = string;

export interface PublicDonation {
  id: number;
  donor_name: string;
  amount: number;
  donation_date: string;
  status: string;
  show_donor_name: boolean;
  student_year?: string;
}

export interface AdminDonation {
  id: number;
  fund_id: number;
  donor_name: string;
  amount: number;
  donation_date: string;
  payment_method: string;
  upi_transaction_id?: string;
  description?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'VOIDED';
  show_donor_name: boolean;
  student_year?: string;
  created_at: string;
  updated_at: string;
  verified_at?: string;
  verified_by?: number;
  void_reason?: string;
}

export interface PublicExpense {
  id: number;
  amount: number;
  purpose: string;
  description?: string;
  handled_by: string;
  expense_date: string;
  status: 'SPENT' | 'PENDING';
}

export interface AdminExpense {
  id: number;
  fund_id: number;
  amount: number;
  purpose: string;
  description?: string;
  handled_by: string;
  expense_date: string;
  status: 'SPENT' | 'PENDING' | 'VOIDED';
  created_at: string;
  updated_at: string;
  voided_at?: string;
  voided_by?: number;
  void_reason?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}
