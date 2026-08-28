import React, { useEffect, useState } from 'react';
import { 
  Calendar, Sparkles, Clock, MapPin, PlusCircle, Trash2, Edit3, 
  CheckCircle2, Eye, EyeOff, Megaphone, Flame, Palette, Award, 
  Utensils, Waves, Layers
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { EmptyState } from '../../components/EmptyState';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { adminApi } from '../../services/api';
import type { EventSchedule, FundConfig } from '../../types';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; badge: string }> = {
  POOJA: { label: 'Pooja & Aarti', icon: <Flame className="w-3.5 h-3.5" />, color: 'amber', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  RANGOLI: { label: 'Rangoli Event', icon: <Palette className="w-3.5 h-3.5" />, color: 'purple', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  COMPETITION: { label: 'Competition', icon: <Award className="w-3.5 h-3.5" />, color: 'pink', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  PRASADAM: { label: 'Maha Prasadam', icon: <Utensils className="w-3.5 h-3.5" />, color: 'emerald', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  VISARJAN: { label: 'Visarjan / Immersion', icon: <Waves className="w-3.5 h-3.5" />, color: 'cyan', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  CULTURAL: { label: 'Cultural & Bhajans', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'indigo', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  OTHER: { label: 'General Event', icon: <Calendar className="w-3.5 h-3.5" />, color: 'slate', badge: 'bg-slate-800 text-slate-300 border-slate-700' },
};

export const AdminEventSchedule: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();

  const [fund, setFund] = useState<FundConfig | null>(null);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);

  // Banner State
  const [isBannerActive, setIsBannerActive] = useState<boolean>(false);
  const [bannerHeadline, setBannerHeadline] = useState<string>('✨ Festival Schedule & Competitions Announced!');
  const [bannerMessage, setBannerMessage] = useState<string>('🪔 Maha Ganapati Pooja at 9:00 AM | 🎨 Inter-Batch Rangoli Competition at 2:00 PM');
  const [savingBanner, setSavingBanner] = useState<boolean>(false);

  // Schedule Publish State
  const [isSchedulePublished, setIsSchedulePublished] = useState<boolean>(false);
  const [togglingSchedule, setTogglingSchedule] = useState<boolean>(false);

  // Event Modal State
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'POOJA',
    event_date: '',
    start_time: '',
    end_time: '',
    venue: '',
    description: '',
    is_highlighted: false,
    order_index: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const currentFund = await adminApi.getCurrentFund();
      setFund(currentFund);
      setIsBannerActive(!!currentFund.is_banner_active);
      if (currentFund.banner_headline) setBannerHeadline(currentFund.banner_headline);
      if (currentFund.banner_message) setBannerMessage(currentFund.banner_message);
      setIsSchedulePublished(!!currentFund.is_schedule_published);

      const items = await adminApi.getSchedules(currentFund.id);
      setSchedules(items);
      setSetupRequired(false);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setSetupRequired(true);
      } else {
        toast.error('Failed to load event schedule from server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSchedulePublish = async () => {
    if (!fund) return;
    const nextState = !isSchedulePublished;
    try {
      setTogglingSchedule(true);
      await adminApi.toggleSchedulePublish(fund.id, nextState);
      setIsSchedulePublished(nextState);
      toast.success(
        nextState
          ? '🎉 Event Schedule is now LIVE on the Public Transparency Portal!'
          : 'Event Schedule has been switched to Draft mode (hidden from public).'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update publish status.');
    } finally {
      setTogglingSchedule(false);
    }
  };

  const handleSaveBanner = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fund) return;
    try {
      setSavingBanner(true);
      const res = await adminApi.toggleBannerPublish(fund.id, {
        is_banner_active: isBannerActive,
        banner_headline: bannerHeadline.trim(),
        banner_message: bannerMessage.trim()
      });
      setIsBannerActive(res.is_banner_active);
      toast.success(
        res.is_banner_active
          ? 'Top Announcement Banner is now LIVE on the public page!'
          : 'Announcement Banner saved and currently hidden.'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update announcement banner.');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleToggleBannerQuick = async () => {
    if (!fund) return;
    const nextState = !isBannerActive;
    try {
      setSavingBanner(true);
      const res = await adminApi.toggleBannerPublish(fund.id, {
        is_banner_active: nextState,
        banner_headline: bannerHeadline.trim(),
        banner_message: bannerMessage.trim()
      });
      setIsBannerActive(res.is_banner_active);
      toast.success(
        nextState
          ? 'Top Announcement Banner is now LIVE on the public portal!'
          : 'Top Announcement Banner turned OFF.'
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to toggle banner.');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!fund) return;
    const hasExisting = schedules.length > 0;
    const confirmed = await confirm({
      title: hasExisting ? 'Reset & Reload Festive Templates?' : 'Load Festive Schedule Templates?',
      message: hasExisting
        ? `You currently have ${schedules.length} event(s) in your schedule. Resetting will restore the 5 standard celebration templates (Ganesh Sthapana & Pooja, Inter-Batch Rangoli Competition, Evening Aarti, Maha Prasadam, Visarjan Procession). Do you want to proceed?`
        : 'This will auto-populate pre-configured celebration events (Pooja Timings, Inter-Batch Rangoli Competition, Maha Aarti, Prasadam & Visarjan). You can edit them anytime.',
      confirmText: hasExisting ? 'Reset & Reload Templates' : 'Load Templates',
      type: hasExisting ? 'warning' : 'info'
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const seeded = await adminApi.seedDefaultSchedules(fund.id, hasExisting);
      setSchedules(seeded);
      toast.success(hasExisting ? 'Reset and reloaded festival schedule templates!' : 'Loaded classic festival schedule template!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setEventForm({
      title: '',
      category: 'POOJA',
      event_date: '',
      start_time: '',
      end_time: '',
      venue: '',
      description: '',
      is_highlighted: false,
      order_index: schedules.length + 1
    });
    setShowEventModal(true);
  };

  const handleOpenEdit = (event: EventSchedule) => {
    setEditingId(event.id);
    setEventForm({
      title: event.title,
      category: event.category,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time || '',
      venue: event.venue,
      description: event.description || '',
      is_highlighted: event.is_highlighted,
      order_index: event.order_index
    });
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fund) return;
    try {
      const cleanEndTime = eventForm.end_time.trim() || null;
      const cleanDescription = eventForm.description.trim() || null;

      if (editingId) {
        await adminApi.updateSchedule(editingId, {
          title: eventForm.title.trim(),
          category: eventForm.category,
          event_date: eventForm.event_date.trim(),
          start_time: eventForm.start_time.trim(),
          end_time: cleanEndTime,
          venue: eventForm.venue.trim(),
          description: cleanDescription,
          is_highlighted: eventForm.is_highlighted,
          order_index: Number(eventForm.order_index) || 0
        });
        toast.success(`Updated "${eventForm.title}"!`);
      } else {
        await adminApi.createSchedule(fund.id, {
          title: eventForm.title.trim(),
          category: eventForm.category,
          event_date: eventForm.event_date.trim(),
          start_time: eventForm.start_time.trim(),
          end_time: cleanEndTime || undefined,
          venue: eventForm.venue.trim(),
          description: cleanDescription || undefined,
          is_highlighted: eventForm.is_highlighted,
          order_index: Number(eventForm.order_index) || 0
        });
        toast.success(`Added "${eventForm.title}" to schedule!`);
      }
      setShowEventModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save schedule event.');
    }
  };

  const handleDeleteEvent = async (id: number, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Schedule Event?',
      message: `Are you sure you want to remove "${title}" from the celebration schedule?`,
      confirmText: 'Delete Event',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      await adminApi.deleteSchedule(id);
      toast.info(`Removed "${title}" from schedule.`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete event.');
    }
  };

  return (
    <AdminLayout title="Event Schedule & Announcement Banner">
      
      {setupRequired ? (
        <EmptyState
          emoji="⚙️"
          title="Fund Setup Required"
          description="Please configure your celebration fund in Fund Settings first."
          actionText="Go to Fund Settings"
          onAction={() => (window.location.href = '/admin/fund-settings')}
        />
      ) : loading ? (
        <div className="p-6">
          <TableSkeleton rows={4} columns={4} />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Top Control Cards: 1-Click Publishing Switch & Top Banner Switch */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Card 1: 1-Click Schedule Public Publish Switch */}
            <div className="p-5 sm:p-6 rounded-3xl festive-glass border border-amber-500/30 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
                    <h3 className="font-extrabold text-white text-base sm:text-lg">Public Schedule Visibility</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Control whether the detailed event timeline (Pooja, Rangoli competition, Prasadam) is visible to devotees on the public transparency page.
                  </p>
                </div>

                <button
                  disabled={togglingSchedule}
                  onClick={handleToggleSchedulePublish}
                  className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 border ${
                    isSchedulePublished
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 border-emerald-300/40 shadow-lg'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/40'
                  }`}
                >
                  {isSchedulePublished ? (
                    <>
                      <Eye className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>LIVE (Published)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Draft (Hidden)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${isSchedulePublished ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  Status: <strong className={isSchedulePublished ? 'text-emerald-300' : 'text-amber-300'}>
                    {isSchedulePublished ? 'Visible on Public Portal' : 'Draft / Unpublished'}
                  </strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  {schedules.length} {schedules.length === 1 ? 'event configured' : 'events configured'}
                </span>
              </div>
            </div>

            {/* Card 2: 1-Click Announcement Banner Switch & Quick Toggle */}
            <div className="p-5 sm:p-6 rounded-3xl festive-glass border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-amber-400 shrink-0" />
                    <h3 className="font-extrabold text-white text-base sm:text-lg">Top Announcement Banner</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Flash high-priority highlights (e.g. Pooja timings & Rangoli competition callout) across the top of the public fund page.
                  </p>
                </div>

                <button
                  disabled={savingBanner}
                  onClick={handleToggleBannerQuick}
                  className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 border ${
                    isBannerActive
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 border-amber-300/40 shadow-lg'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/40'
                  }`}
                >
                  {isBannerActive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>Banner ON</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Banner OFF</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleSaveBanner} className="space-y-2.5">
                <div>
                  <input
                    type="text"
                    value={bannerHeadline}
                    onChange={(e) => setBannerHeadline(e.target.value)}
                    placeholder="Banner Headline (e.g., ✨ Festival Schedule & Competitions Announced!)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 font-semibold"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={bannerMessage}
                    onChange={(e) => setBannerMessage(e.target.value)}
                    placeholder="Banner message (e.g., 🪔 Pooja: 9:00 AM | 🎨 Rangoli Competition: 2:00 PM)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingBanner}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 active:scale-95 transition"
                  >
                    Save Banner Text
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Schedule Events Timeline Manager */}
          <div className="p-5 sm:p-6 rounded-3xl festive-glass border border-amber-500/30 space-y-4 shadow-xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400 shrink-0" />
                  Celebration Schedule Timeline
                </h3>
                <p className="text-xs text-slate-300">
                  Add, edit, or customize festival events. Click <strong>Publish</strong> above when finalized!
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSeedDefaults}
                  className="px-3.5 py-2 rounded-xl font-bold text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 active:scale-95 transition flex items-center gap-1.5"
                  title={schedules.length === 0 ? "Load Festive Templates" : "Reset & Reload Templates"}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{schedules.length === 0 ? 'Load Festive Template' : 'Reload / Reset Templates'}</span>
                </button>

                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2 rounded-xl font-bold gold-button text-amber-950 active:scale-95 transition text-xs flex items-center gap-1.5 shadow-md"
                >
                  <PlusCircle className="w-4 h-4 text-amber-950" />
                  <span>Add Event</span>
                </button>
              </div>
            </div>

            {/* Events List */}
            {schedules.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  emoji="📅"
                  title="No Events Configured"
                  description="Click 'Load Festive Template' to auto-populate default Pooja timings and Rangoli competition, or add custom events manually."
                  actionText="Load Festive Template"
                  onAction={handleSeedDefaults}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedules.map((item) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.OTHER;
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/40 transition space-y-3 shadow-md relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.badge}`}>
                              {meta.icon}
                              <span>{meta.label}</span>
                            </span>
                            {item.is_highlighted && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                <span>Featured</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-white text-sm sm:text-base leading-snug">
                            {item.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition"
                            title="Edit Event"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(item.id, item.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                        <span className="flex items-center gap-1 font-semibold text-amber-300">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          {item.event_date}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-emerald-300">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {item.start_time}{item.end_time ? ` - ${item.end_time}` : ''}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {item.venue}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* Add / Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg festive-glass rounded-3xl border border-amber-500/30 p-6 text-white space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-gold-gradient">
                {editingId ? 'Edit Celebration Event' : 'Add Celebration Event'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3.5">
              
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g., Inter-Batch Rangoli Competition / Maha Ganapati Pooja"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Event Category *</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="POOJA">🪔 Pooja & Aarti</option>
                    <option value="RANGOLI">🎨 Rangoli Event</option>
                    <option value="COMPETITION">🏆 Competition</option>
                    <option value="PRASADAM">🍚 Maha Prasadam</option>
                    <option value="VISARJAN">🌊 Visarjan / Immersion</option>
                    <option value="CULTURAL">✨ Cultural & Bhajans</option>
                    <option value="OTHER">📋 General Event</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Date / Day *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    placeholder="e.g., Day 2 (Sept 8) or Every Morning"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Start Time *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.start_time}
                    onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                    placeholder="e.g., 09:00 AM or 02:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">End Time (Optional)</label>
                  <input
                    type="text"
                    value={eventForm.end_time}
                    onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                    placeholder="e.g., 11:30 AM or 05:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Venue / Location *</label>
                <input
                  type="text"
                  required
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  placeholder="e.g., Main College Quadrangle / Celebration Arena"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description / Rules / Notes</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Details, competition rules, registration link, or devotional schedule instructions..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_highlighted"
                  checked={eventForm.is_highlighted}
                  onChange={(e) => setEventForm({ ...eventForm, is_highlighted: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="is_highlighted" className="text-xs text-slate-300 cursor-pointer">
                  Feature this event on the top announcement banner
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold gold-button text-amber-950 shadow-md active:scale-95 transition"
                >
                  {editingId ? 'Save Changes' : 'Add to Schedule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};
