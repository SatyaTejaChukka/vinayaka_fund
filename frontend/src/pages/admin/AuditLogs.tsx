import React, { useEffect, useState } from 'react';
import { History, UserCheck, ShieldCheck } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../context/ToastContext';
import { adminApi } from '../../services/api';
import type { AuditLog } from '../../types';

export const AuditLogs: React.FC = () => {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuditLogs();
      setLogs(data);
    } catch (err) {
      toast.error('Failed to load system audit logs.');
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <AdminLayout title="Security & Action Audit Logs">
      
      <div className="p-6 rounded-3xl festive-glass border border-amber-500/20 space-y-6 shadow-xl">
        
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Immutable System Audit Trail</h3>
          </div>
          <span className="text-xs text-slate-400">
            Records all admin state mutations & verification actions
          </span>
        </div>

        {loading ? (
          <TableSkeleton rows={6} columns={4} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No Audit Logs Recorded"
            description="All admin actions (verification, creation, voiding, fund updates) will be immutably recorded here."
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] border ${
                      log.action === 'VERIFY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : log.action === 'VOID'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : log.action === 'CREATE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-white">
                      {log.entity_type} #{log.entity_id}
                    </span>
                  </div>

                  {log.new_data && (
                    <p className="text-slate-400 font-mono text-[11px] truncate max-w-xl">
                      Details: {JSON.stringify(log.new_data)}
                    </p>
                  )}
                </div>

                <div className="text-right text-slate-400 text-[11px] shrink-0">
                  <p className="flex items-center gap-1 justify-end text-slate-300 font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400 inline" />
                    Admin User #{log.user_id || 'System'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </AdminLayout>
  );
};
