// src/routes/app.notifications.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, MessageSquare, Mail, Smartphone, AlertTriangle, Megaphone, 
  Send, X, Loader2, RefreshCw, CheckCircle, AlertCircle, Clock,
  Mail as MailIcon, Phone, Globe, Users, Eye, Trash2, Check,
  Filter, Calendar, Share2
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { notificationAPI, Notification, NotificationStats } from "@/features/notifications";

// --- Lightweight, dependency-free chart primitives ---------------------

const CHART_ANIMATION_STYLES = `
@keyframes notif-arc-draw {
  from { stroke-dashoffset: var(--offset-start); }
  to { stroke-dashoffset: var(--offset-end); }
}
@keyframes notif-reveal {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0% 0 0); }
}
@keyframes notif-pop-in {
  from { opacity: 0; transform: scale(0.3); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes notif-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes notif-bar-grow {
  from { width: 0%; }
  to { width: var(--bar-w); }
}
.notif-reveal { animation: notif-reveal 1s cubic-bezier(0.22, 1, 0.36, 1) both; }
.notif-arc { animation: notif-arc-draw 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; transform-origin: center; }
.notif-dot { animation: notif-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; transform-origin: center; }
.notif-legend-row { animation: notif-fade-up 0.4s ease-out both; }
.notif-bar-fill { animation: notif-bar-grow 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
`;

function DonutChart({
  data,
  size = 132,
  strokeWidth = 18,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  const replayKey = data.map((d) => `${d.label}:${d.value}`).join("|");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.08}
        strokeWidth={strokeWidth}
      />
      <g key={replayKey}>
        {total > 0 &&
          data.map((d, i) => {
            if (d.value === 0) return null;
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const offset = -cumulative * circumference;
            cumulative += fraction;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                className="notif-arc"
                style={
                  {
                    "--offset-start": offset + dash,
                    "--offset-end": offset,
                    animationDelay: `${i * 140}ms`,
                  } as React.CSSProperties
                }
              />
            );
          })}
      </g>
    </svg>
  );
}

function TrendChart({
  points,
  color = "#6366f1",
  gradientId,
}: {
  points: { label: string; value: number }[];
  color?: string;
  gradientId: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const w = 300;
  const h = 84;
  const stepX = points.length > 1 ? w / (points.length - 1) : 0;
  const coordsFor = (i: number, value: number) => {
    const x = i * stepX;
    const y = h - (value / max) * (h - 12) - 6;
    return { x, y };
  };
  const linePath = points
    .map((p, i) => {
      const { x, y } = coordsFor(i, p.value);
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
  const replayKey = points.map((p) => p.value).join("-");

  return (
    <div className="notif-reveal" key={replayKey}>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full h-32">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const { x, y } = coordsFor(i, p.value);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill={color}
              className="notif-dot"
              style={{ animationDelay: `${300 + i * 90}ms` }}
            />
          );
        })}
        {points.map((p, i) => {
          const { x } = coordsFor(i, p.value);
          return (
            <text key={`label-${i}`} x={x} y={h + 16} fontSize="9" textAnchor="middle" className="fill-muted-foreground">
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}


export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement' as Notification['type'],
    channel: 'email' as Notification['channel'],
    priority: 'medium' as Notification['priority'],
    category: 'general' as Notification['category'],
    recipients: '',
    sendEmail: true
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsRes, statsRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getStats()
      ]);

      if (notificationsRes.success) {
        setNotifications(notificationsRes.data || []);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch notifications:', error);
      setError(error.message || 'Failed to load notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast.error('Please fill in title and message');
      return;
    }

    setIsSubmitting(true);
    try {
      const recipients = formData.recipients ? formData.recipients.split(',').map(r => r.trim()) : [];
      
      const response = await notificationAPI.create({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        channel: formData.channel,
        priority: formData.priority,
        category: formData.category,
        recipients: recipients.length > 0 ? recipients : undefined,
        sendEmail: formData.sendEmail
      });

      if (response.success) {
        toast.success(`Notification sent successfully!${response.email ? ` (${response.email.delivered} delivered)` : ''}`);
        setIsModalOpen(false);
        setFormData({
          title: '',
          message: '',
          type: 'announcement',
          channel: 'email',
          priority: 'medium',
          category: 'general',
          recipients: '',
          sendEmail: true
        });
        await fetchNotifications();
      }
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      if (response.success) {
        toast.success('Notification marked as read');
        await fetchNotifications();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationAPI.markAllAsRead();
      if (response.success) {
        toast.success('All notifications marked as read');
        await fetchNotifications();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      const response = await notificationAPI.delete(id);
      if (response.success) {
        toast.success('Notification deleted');
        await fetchNotifications();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete notification');
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const response = await notificationAPI.sendTestEmail();
      if (response.success) {
        toast.success('Test email sent successfully! Check your inbox.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test email');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'sent': { className: 'bg-emerald-500/15 text-emerald-600', label: 'Sent' },
      'pending': { className: 'bg-amber-500/15 text-amber-600', label: 'Pending' },
      'failed': { className: 'bg-rose-500/15 text-rose-600', label: 'Failed' },
      'scheduled': { className: 'bg-blue-500/15 text-blue-600', label: 'Scheduled' }
    };
    const info = statusMap[status] || statusMap['pending'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { className: string; label: string }> = {
      'low': { className: 'bg-gray-500/15 text-gray-600', label: 'Low' },
      'medium': { className: 'bg-blue-500/15 text-blue-600', label: 'Medium' },
      'high': { className: 'bg-amber-500/15 text-amber-600', label: 'High' },
      'urgent': { className: 'bg-rose-500/15 text-rose-600', label: 'Urgent' }
    };
    const info = priorityMap[priority] || priorityMap['medium'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  const channelIcons: Record<string, any> = {
    'email': Mail,
    'sms': MessageSquare,
    'whatsapp': Smartphone,
    'push': Bell,
    'all': Globe
  };

  const typeIcons: Record<string, any> = {
    'alert': AlertTriangle,
    'broadcast': Megaphone,
    'reminder': Bell,
    'announcement': Megaphone,
    'emergency': AlertTriangle
  };

  const channelColorMap: Record<string, string> = {
    email: '#6366f1',
    sms: '#06b6d4',
    whatsapp: '#22c55e',
    push: '#f59e0b',
    all: '#a855f7'
  };

  const priorityColorMap: Record<string, string> = {
    low: '#9ca3af',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#f43f5e'
  };

  const channelBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((n) => {
      counts[n.channel] = (counts[n.channel] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value, color: channelColorMap[label] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value);
  }, [notifications]);

  const priorityBreakdown = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
    notifications.forEach((n) => {
      counts[n.priority] = (counts[n.priority] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const weeklyTrend = useMemo(() => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const count = notifications.filter((n) => {
        if (!n.createdAt) return false;
        return new Date(n.createdAt).toDateString() === d.toDateString();
      }).length;
      days.push({ label: dayLabels[d.getDay()], value: count });
    }
    return days;
  }, [notifications]);

  const maxPriorityCount = Math.max(...Object.values(priorityBreakdown), 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
      <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Bell, name: "Total", count: stats?.total || 0, tone: "brand" },
          { icon: Mail, name: "Sent", count: stats?.sent || 0, tone: "success" },
          { icon: Clock, name: "Pending", count: stats?.pending || 0, tone: "warning" },
          { icon: AlertCircle, name: "Failed", count: stats?.failed || 0, tone: "destructive" },
        ].map((c) => (
          <Card key={c.name} className="glass card-hover">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.name}</div>
                <div className="text-2xl font-bold mt-1">{c.count}</div>
                <div className="text-[11px] text-muted-foreground">notifications</div>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-${c.tone}/15 text-${c.tone} flex items-center justify-center`}>
                <c.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Overview */}
      <style>{CHART_ANIMATION_STYLES}</style>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Channel distribution */}
        <Card className="glass card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Channel Distribution</CardTitle>
            <CardDescription>Where notifications are sent</CardDescription>
          </CardHeader>
          <CardContent>
            {channelBreakdown.length > 0 ? (
              <div className="flex items-center gap-5">
                <DonutChart data={channelBreakdown} />
                <div className="flex-1 space-y-2 min-w-0" key={notifications.length}>
                  {channelBreakdown.map((d, i) => {
                    const ChannelIcon = channelIcons[d.label] || Mail;
                    const pct = notifications.length ? Math.round((d.value / notifications.length) * 100) : 0;
                    return (
                      <div
                        key={d.label}
                        className="flex items-center gap-2 text-xs notif-legend-row"
                        style={{ animationDelay: `${300 + i * 90}ms` }}
                      >
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <ChannelIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="capitalize truncate flex-1">{d.label}</span>
                        <span className="font-medium">{d.value}</span>
                        <span className="text-muted-foreground w-9 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Weekly activity trend */}
        <Card className="glass card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weekly Activity</CardTitle>
            <CardDescription>Notifications sent, last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart points={weeklyTrend} color="#6366f1" gradientId="weeklyTrendFill" />
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
              <span>{weeklyTrend.reduce((sum, p) => sum + p.value, 0)} this week</span>
              <span>Peak: {Math.max(...weeklyTrend.map((p) => p.value), 0)}/day</span>
            </div>
          </CardContent>
        </Card>

        {/* Priority breakdown */}
        <Card className="glass card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Priority Breakdown</CardTitle>
            <CardDescription>By urgency level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3" key={`priority-${notifications.length}`}>
            {(['urgent', 'high', 'medium', 'low'] as const).map((level, i) => {
              const value = priorityBreakdown[level] || 0;
              const pct = Math.round((value / maxPriorityCount) * 100);
              return (
                <div key={level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium">{level}</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full notif-bar-fill"
                      style={
                        {
                          "--bar-w": `${pct}%`,
                          backgroundColor: priorityColorMap[level],
                          animationDelay: `${i * 120}ms`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Notification List */}
      <Card className="glass">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Notification Center</CardTitle>
            <CardDescription>Recent activity across all channels</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {notifications.filter(n => !n.isRead).length} unread
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] || Megaphone;
                const ChannelIcon = channelIcons[n.channel] || Mail;
                const isUnread = !n.isRead;
                
                return (
                  <div 
                    key={n._id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border ${isUnread ? 'bg-primary/5 border-primary/20' : 'bg-card/50'} hover:bg-accent/30 transition-colors`}
                  >
                    <div className={`h-9 w-9 rounded-lg bg-${n.priority === 'urgent' ? 'rose' : n.priority === 'high' ? 'amber' : 'blue'}/15 text-${n.priority === 'urgent' ? 'rose' : n.priority === 'high' ? 'amber' : 'blue'} flex items-center justify-center shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{n.title}</span>
                        {getPriorityBadge(n.priority)}
                        {getStatusBadge(n.status)}
                        {isUnread && <Badge variant="outline" className="text-[10px] bg-blue-500/10">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ChannelIcon className="h-3 w-3" />
                          {n.channel}
                        </span>
                        <span>•</span>
                        <span>{n.category}</span>
                        <span>•</span>
                        <span>{new Date(n.createdAt || '').toLocaleString()}</span>
                        {n.deliveredCount !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600">✓ {n.deliveredCount} delivered</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {isUnread && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => n._id && handleMarkAsRead(n._id)}
                          title="Mark as read"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => n._id && handleDelete(n._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs">Create your first broadcast to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                New Broadcast
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateNotification} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter notification title..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter notification message..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="alert">Alert</option>
                    <option value="broadcast">Broadcast</option>
                    <option value="reminder">Reminder</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <select
                    id="channel"
                    name="channel"
                    value={formData.channel}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="push">Push</option>
                    <option value="all">All Channels</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="academic">Academic</option>
                    <option value="administrative">Administrative</option>
                    <option value="emergency">Emergency</option>
                    <option value="event">Event</option>
                    <option value="fee">Fee</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients (comma separated emails)</Label>
                <Input
                  id="recipients"
                  name="recipients"
                  value={formData.recipients}
                  onChange={handleInputChange}
                  placeholder="user1@email.com, user2@email.com"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to send to default email: samiahayat95@gmail.com
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  name="sendEmail"
                  checked={formData.sendEmail}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="sendEmail" className="text-sm font-normal">Send email notification</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-brand text-white border-0" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
  );
}

export default NotificationsPage;
