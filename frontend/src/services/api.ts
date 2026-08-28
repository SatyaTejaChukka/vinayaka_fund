import axios from 'axios';
import type { FundConfig, FundSummary, PublicDonation, PublicExpense, AdminDonation, AdminExpense, AuditLog, User, EventSchedule, PublicSchedulePayload } from '../types';

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
  getPublicSchedule: async (slug: string): Promise<PublicSchedulePayload> => {
    const res = await api.get(`/api/public/funds/${slug}/schedule`);
    return res.data;
  },
  submitDonation: async (slug: string, data: {
    donor_name: string;
    amount: number;
    donation_date: string;
    upi_transaction_id: string;
    description?: string;
    show_donor_name: boolean;
    student_year?: string;
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
  register: async (name: string, email: string, password: string): Promise<{ access_token: string }> => {
    const res = await api.post('/api/auth/register', { name, email, password });
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
  getCurrentFund: async (): Promise<FundConfig> => {
    const res = await api.get('/api/admin/funds/current');
    return res.data;
  },
  getCurrentFundSummary: async (): Promise<FundSummary> => {
    const res = await api.get('/api/admin/funds/current/summary');
    return res.data;
  },
  createFund: async (data: {
    name: string;
    year: number;
    target_amount: number;
    upi_id: string;
    upi_name: string;
    public_slug: string;
    description?: string;
    is_active?: boolean;
  }): Promise<FundConfig> => {
    const res = await api.post('/api/admin/funds', data);
    return res.data;
  },
  getFundDetails: async (fundId: number): Promise<FundConfig> => {
    const res = await api.get(`/api/admin/funds/${fundId}`);
    return res.data;
  },
  updateFundDetails: async (fundId: number, data: Partial<FundConfig>): Promise<FundConfig> => {
    const res = await api.put(`/api/admin/funds/${fundId}`, data);
    return res.data;
  },
  clearTestData: async (fundId: number): Promise<{ message: string; donations_deleted: number; expenses_deleted: number }> => {
    const res = await api.post(`/api/admin/funds/${fundId}/clear-test-data`);
    return res.data;
  },
  checkSlugAvailability: async (slug: string, fundId?: number): Promise<{ available: boolean; slug: string; reason?: string }> => {
    const params = new URLSearchParams({ slug });
    if (fundId !== undefined) params.append('fund_id', String(fundId));
    const res = await api.get(`/api/admin/funds/check-slug?${params.toString()}`);
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
    student_year?: string;
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
  updateDonationVisibility: async (donationId: number, showDonorName: boolean): Promise<AdminDonation> => {
    const res = await api.patch(`/api/admin/donations/${donationId}/visibility`, { show_donor_name: showDonorName });
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
  getSchedules: async (fundId: number): Promise<EventSchedule[]> => {
    const res = await api.get(`/api/admin/funds/${fundId}/schedules`);
    return res.data;
  },
  createSchedule: async (fundId: number, data: {
    title: string;
    category: string;
    event_date: string;
    start_time: string;
    end_time?: string;
    venue: string;
    description?: string;
    is_highlighted: boolean;
    order_index: number;
  }): Promise<EventSchedule> => {
    const res = await api.post(`/api/admin/funds/${fundId}/schedules`, data);
    return res.data;
  },
  updateSchedule: async (scheduleId: number, data: Partial<EventSchedule>): Promise<EventSchedule> => {
    const res = await api.put(`/api/admin/schedules/${scheduleId}`, data);
    return res.data;
  },
  deleteSchedule: async (scheduleId: number): Promise<{ message: string; id: number }> => {
    const res = await api.delete(`/api/admin/schedules/${scheduleId}`);
    return res.data;
  },
  toggleSchedulePublish: async (fundId: number, is_schedule_published: boolean): Promise<{ is_schedule_published: boolean }> => {
    const res = await api.patch(`/api/admin/funds/${fundId}/schedules/publish`, { is_schedule_published });
    return res.data;
  },
  toggleBannerPublish: async (fundId: number, data: {
    is_banner_active: boolean;
    banner_headline?: string;
    banner_message?: string;
  }): Promise<{ is_banner_active: boolean; banner_headline?: string; banner_message?: string }> => {
    const res = await api.patch(`/api/admin/funds/${fundId}/banner/publish`, data);
    return res.data;
  },
  seedDefaultSchedules: async (fundId: number, reset: boolean = false): Promise<EventSchedule[]> => {
    const res = await api.post(`/api/admin/funds/${fundId}/schedules/seed-defaults?reset=${reset}`);
    return res.data;
  },
};

export default api;
