import axios from 'axios';
import type { FundSummary, PublicDonation, PublicExpense, AdminDonation, AdminExpense, AuditLog, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically to protected requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const publicApi = {
  getFundSummary: async (slug: string): Promise<FundSummary> => {
    const res = await api.get(`/api/public/funds/${slug}`);
    return res.data;
  },
  getVerifiedDonations: async (slug: string): Promise<PublicDonation[]> => {
    const res = await api.get(`/api/public/funds/${slug}/donations`);
    return res.data;
  },
  getExpenses: async (slug: string): Promise<PublicExpense[]> => {
    const res = await api.get(`/api/public/funds/${slug}/expenses`);
    return res.data;
  },
  submitDonation: async (slug: string, data: {
    donor_name: string;
    amount: number;
    donation_date: string;
    upi_transaction_id: string;
    description?: string;
    show_donor_name: boolean;
  }): Promise<PublicDonation> => {
    const res = await api.post(`/api/public/funds/${slug}/donations/submit`, data);
    return res.data;
  },
};

export const adminApi = {
  login: async (email: string, password: string): Promise<{ access_token: string }> => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('admin_token', res.data.access_token);
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('admin_token');
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },
  getFundDetails: async (fundId: number): Promise<FundSummary> => {
    const res = await api.get(`/api/admin/funds/${fundId}`);
    return res.data;
  },
  updateFundDetails: async (fundId: number, data: Partial<FundSummary>): Promise<FundSummary> => {
    const res = await api.put(`/api/admin/funds/${fundId}`, data);
    return res.data;
  },
  getAdminDonations: async (fundId: number, status?: string): Promise<AdminDonation[]> => {
    const url = `/api/admin/funds/${fundId}/donations` + (status ? `?status=${status}` : '');
    const res = await api.get(url);
    return res.data;
  },
  createManualDonation: async (fundId: number, data: {
    donor_name: string;
    amount: number;
    donation_date: string;
    upi_transaction_id: string;
    description?: string;
    show_donor_name: boolean;
    status: string;
  }): Promise<AdminDonation> => {
    const res = await api.post(`/api/admin/funds/${fundId}/donations`, data);
    return res.data;
  },
  verifyDonation: async (donationId: number): Promise<AdminDonation> => {
    const res = await api.post(`/api/admin/donations/${donationId}/verify`);
    return res.data;
  },
  rejectDonation: async (donationId: number): Promise<AdminDonation> => {
    const res = await api.post(`/api/admin/donations/${donationId}/reject`);
    return res.data;
  },
  voidDonation: async (donationId: number, reason: string): Promise<AdminDonation> => {
    const res = await api.post(`/api/admin/donations/${donationId}/void`, { reason });
    return res.data;
  },
  getAdminExpenses: async (fundId: number, status?: string): Promise<AdminExpense[]> => {
    const url = `/api/admin/funds/${fundId}/expenses` + (status ? `?status=${status}` : '');
    const res = await api.get(url);
    return res.data;
  },
  createExpense: async (fundId: number, data: {
    amount: number;
    purpose: string;
    description?: string;
    handled_by: string;
    expense_date: string;
    status: 'SPENT' | 'PENDING';
  }): Promise<AdminExpense> => {
    const res = await api.post(`/api/admin/funds/${fundId}/expenses`, data);
    return res.data;
  },
  markExpenseSpent: async (expenseId: number): Promise<AdminExpense> => {
    const res = await api.post(`/api/admin/expenses/${expenseId}/mark-spent`);
    return res.data;
  },
  voidExpense: async (expenseId: number, reason: string): Promise<AdminExpense> => {
    const res = await api.post(`/api/admin/expenses/${expenseId}/void`, { reason });
    return res.data;
  },
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await api.get('/api/admin/audit-logs');
    return res.data;
  },
};

export default api;
