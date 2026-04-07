import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Mail, Calendar, BarChart3, Heart, FileText,
    Edit3, Check, X, Loader2, Link2, Users, Sparkles,
    History, ArrowRight, Clock, Shield, Database,
    Copy, LogOut, Info, ChevronDown, ChevronUp,
    Zap, TrendingUp, Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axiosConfig";
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    Tooltip as RechartsTooltip
} from "recharts";

// --- Internal Components ---

const CountUp = ({ end, duration = 1.5 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration]);
    return <>{count}</>;
};

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [saving, setSaving] = useState(false);
    const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 500);
        const fetchData = async () => {
            try {
                const [profileRes, dashboardRes] = await Promise.all([
                    api.get("/api/user/profile"),
                    api.get("/api/user/dashboard-stats"),
                ]);
                setProfile(profileRes.data);
                setDashboardData(dashboardRes.data);
                setNameInput(profileRes.data.name || "");
            } catch (err) {
                toast.error("Failed to load profile data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => clearTimeout(timer);
    }, []);

    const handleSaveName = async () => {
        if (!nameInput.trim()) {
            toast.error("Name cannot be empty");
            return;
        }
        setSaving(true);
        try {
            const res = await api.put("/api/user/profile", { name: nameInput.trim() });
            setProfile(res.data);
            setEditing(false);
            toast.success("Profile updated successfully");
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
            toast.success("Signed out successfully");
        } catch {
            toast.error("Failed to sign out");
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    const formatFullDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            return new Date(dateStr).toLocaleString("en-US", {
                year: "numeric", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
    };

    const getRelativeTime = (dateStr) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return "Just now";
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return formatDate(dateStr);
        } catch {
            return dateStr;
        }
    };

    const chartData = useMemo(() => {
        if (!dashboardData?.stats) return [];
        return [
            { name: "Calendars", value: dashboardData.stats.total_calendars || 0, color: "#2563eb" },
            { name: "URL Gens", value: dashboardData.stats.url_generations || 0, color: "#d97706" },
            { name: "Engagements", value: dashboardData.stats.engagement_plans || 0, color: "#9333ea" },
            { name: "Captions", value: dashboardData.stats.caption_generations || 0, color: "#059669" },
        ].filter(d => d.value > 0);
    }, [dashboardData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-14 h-14">
                        <Loader2 className="w-14 h-14 animate-spin text-blue-600 absolute inset-0" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-7 h-7 bg-blue-100 rounded-full" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-semibold animate-pulse">Loading your profile...</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: "Total Posts", value: dashboardData?.stats?.total_posts || 0,
            icon: FileText, accent: "#9333ea", bg: "bg-purple-50", text: "text-purple-600",
        },
        {
            label: "Favorites", value: dashboardData?.stats?.favorites_count || 0,
            icon: Heart, accent: "#e11d48", bg: "bg-rose-50", text: "text-rose-600",
        },
        {
            label: "Calendars", value: dashboardData?.stats?.total_calendars || 0,
            icon: Calendar, accent: "#2563eb", bg: "bg-blue-50", text: "text-blue-600",
        },
        {
            label: "URL Gens", value: dashboardData?.stats?.url_generations || 0,
            icon: Link2, accent: "#d97706", bg: "bg-amber-50", text: "text-amber-600",
        },
        {
            label: "Engagements", value: dashboardData?.stats?.engagement_plans || 0,
            icon: Users, accent: "#059669", bg: "bg-emerald-50", text: "text-emerald-600",
        },
        {
            label: "Captions", value: dashboardData?.stats?.caption_generations || 0,
            icon: Type, accent: "#0d9488", bg: "bg-teal-50", text: "text-teal-600",
        },
       
    ];

    const quickActions = [
        { label: "New Calendar", icon: Sparkles, path: "/calendar-generator", gradient: "from-blue-600 to-indigo-700" },
        { label: "Repurpose URL", icon: Link2, path: "/url-generator", gradient: "from-amber-500 to-orange-600" },
        { label: "Engagement", icon: Users, path: "/engagement-planner", gradient: "from-purple-600 to-pink-600" },
        { label: "Captions", icon: Type, path: "/caption-generator", gradient: "from-emerald-500 to-teal-600" },
    ];

    const recentActivity = dashboardData?.recent_activity || [];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* ══════════ COMPACT BANNER HEADER ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-8"
                >
                    {/* Banner */}
                    <div className="h-32 sm:h-40 rounded-t-3xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
                            <motion.div
                                animate={{
                                    scale: [1, 1.15, 1],
                                    opacity: [0.15, 0.25, 0.15]
                                }}
                                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-[-40%] right-[-10%] w-[80%] h-[180%] pointer-events-none"
                                style={{
                                    backgroundImage: "radial-gradient(circle at center, rgba(99,102,241,0.5) 0%, transparent 70%)",
                                    filter: "blur(60px)"
                                }}
                            />
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.1, 0.2, 0.1]
                                }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                className="absolute bottom-[-30%] left-[-10%] w-[60%] h-[160%] pointer-events-none"
                                style={{
                                    backgroundImage: "radial-gradient(circle at center, rgba(59,130,246,0.4) 0%, transparent 70%)",
                                    filter: "blur(50px)"
                                }}
                            />
                            {/* Dot pattern */}
                            <div className="absolute inset-0 opacity-[0.04]" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/g%3E%3C/svg%3E")`
                            }} />
                        </div>

                        {/* Status badges on banner */}
                        <div className="absolute bottom-4 right-6 hidden sm:flex items-center gap-2">
                            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2 text-xs font-semibold text-white/80">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Active Creator
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2 text-xs font-semibold text-white/80">
                                <Shield className="w-3 h-3 text-blue-300" />
                                Premium
                            </div>
                        </div>
                    </div>

                    {/* Profile info strip (overlaps banner) */}
                    <div className="bg-white rounded-b-3xl border border-slate-200/60 border-t-0 shadow-[0_4px_24px_rgb(0,0,0,0.04)] px-6 sm:px-8 pb-6 pt-0 relative">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-12 sm:-mt-14">
                            {/* Avatar */}
                            <motion.div whileHover={{ scale: 1.02 }} className="relative group shrink-0">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                                {user?.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt=""
                                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-[3px] border-white object-cover relative shadow-xl"
                                    />
                                ) : (
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-[3px] border-white bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center relative shadow-xl">
                                        <span className="text-3xl sm:text-4xl font-black text-white">
                                            {(profile?.name || user?.email)?.[0]?.toUpperCase() || "U"}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-md flex items-center justify-center">
                                    <Check className="w-4 h-4 text-blue-600 fill-blue-600" />
                                </div>
                            </motion.div>

                            {/* Name + meta info */}
                            <div className="flex-1 text-center sm:text-left pb-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                    {editing ? (
                                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                                            <Input
                                                value={nameInput}
                                                onChange={(e) => setNameInput(e.target.value)}
                                                className="h-10 w-56 rounded-xl border-slate-200 text-base font-bold focus-visible:ring-blue-500"
                                                autoFocus
                                            />
                                            <Button
                                                size="icon"
                                                onClick={handleSaveName}
                                                disabled={saving}
                                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-10 w-10 shrink-0"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={() => { setEditing(false); setNameInput(profile?.name || ""); }}
                                                className="rounded-xl h-10 w-10 shrink-0 border-slate-200"
                                            >
                                                <X className="w-4 h-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                                {profile?.name || "User"}
                                            </h1>
                                            <button
                                                onClick={() => setEditing(true)}
                                                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Info chips */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-slate-500 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="truncate max-w-[200px]">{profile?.email || user?.email}</span>
                                    </div>
                                    <span className="hidden sm:inline text-slate-300">·</span>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        Joined {formatDate(profile?.joined_at)}
                                    </div>
                                    <span className="hidden sm:inline text-slate-300">·</span>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        Active {getRelativeTime(profile?.last_login)}
                                    </div>
                                </div>
                            </div>

                            {/* Top-right actions */}
                            <div className="hidden sm:flex items-center gap-2 pb-1">
                                <Button
                                    onClick={handleLogout}
                                    variant="outline"
                                    className="rounded-xl h-10 px-4 border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-semibold text-sm gap-2 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ══════════ QUICK ACTIONS BAR ══════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="mb-8"
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {quickActions.map((action, idx) => (
                            <motion.button
                                key={action.label}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(action.path)}
                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all text-left group"
                            >
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                                    <action.icon className="w-4.5 h-4.5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{action.label}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* ══════════ MAIN GRID: SIDEBAR + CONTENT ══════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* ─── LEFT SIDEBAR (4-col) ─── */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Content DNA / Chart Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                        >
                            <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        Content Overview
                                    </CardTitle>
                                    <CardDescription className="text-xs">Output distribution across modules</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-5">
                                    <div className="relative overflow-hidden" style={{ width: '100%', height: 192, minHeight: 192 }}>
                                        {(isMounted && chartData.length > 0) ? (
                                            <ResponsiveContainer width="100%" height={192} minWidth={1} minHeight={1}>
                                                <PieChart>
                                                    <Pie
                                                        data={chartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={55}
                                                        outerRadius={75}
                                                        paddingAngle={6}
                                                        dataKey="value"
                                                        animationBegin={500}
                                                        animationDuration={1200}
                                                    >
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgb(0 0 0 / 0.08)', fontSize: '12px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-300">
                                                <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest">No Data Yet</p>
                                            </div>
                                        )}
                                        {chartData.length > 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="text-center">
                                                    <p className="text-xl font-black text-slate-900 leading-none">
                                                        {dashboardData?.stats?.total_content || 0}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {chartData.length > 0 && (
                                        <div className="space-y-2.5 mt-3 pt-3 border-t border-slate-100">
                                            {chartData.map(d => (
                                                <div key={d.name} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                                        <span className="text-xs font-semibold text-slate-600">{d.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">{d.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Account Access Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25, duration: 0.4 }}
                        >
                            <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                                <div className="absolute inset-0 opacity-[0.04]" style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/g%3E%3C/svg%3E")`
                                }} />
                                <CardContent className="relative z-10 p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                            <Shield className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Account Access</p>
                                            <p className="text-[11px] text-slate-400">Session & security</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleLogout}
                                        className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] sm:hidden"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </Button>
                                    <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Info className="w-3 h-3" /> v2.4.0</span>
                                        <span>•</span>
                                        <span>Secure Session</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* ─── RIGHT MAIN CONTENT (8-col) ─── */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* ━━━ Usage Analytics Grid ━━━ */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.4 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <BarChart3 className="w-4 h-4 text-blue-600" />
                                    </div>
                                    Usage Analytics
                                </h2>
                                <Badge variant="outline" className="rounded-lg bg-blue-50 text-blue-600 border-blue-100 font-semibold text-[10px] px-2 py-0.5">
                                    Real-time
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {stats.map((stat, idx) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + idx * 0.04 }}
                                        whileHover={{ y: -3 }}
                                        className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
                                    >
                                        {/* Left accent border */}
                                        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: stat.accent }} />

                                        <div className="pl-3 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                                <stat.icon className={`w-4.5 h-4.5 ${stat.text}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-2xl font-black text-slate-900 leading-none mb-0.5 tracking-tight">
                                                    <CountUp end={stat.value} />
                                                </p>
                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider truncate">{stat.label}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ━━━ Activity Stream ━━━ */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.4 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <History className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    Activity Stream
                                </h2>
                                <button
                                    onClick={() => navigate("/history")}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                                >
                                    View All
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>

                            <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
                                <CardContent className="p-0">
                                    {recentActivity.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                                                <History className="w-7 h-7 text-slate-300" />
                                            </div>
                                            <h3 className="text-slate-800 font-bold text-sm mb-1">No Recent Activity</h3>
                                            <p className="text-slate-400 text-xs max-w-xs mx-auto mb-4">Start using the AI modules to see your content stream here.</p>
                                            <Button
                                                onClick={() => navigate("/calendar-generator")}
                                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 h-9 transition-all"
                                            >
                                                <Zap className="w-3.5 h-3.5 mr-1.5" />
                                                Launch Generator
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {recentActivity.slice(0, 5).map((item, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 + idx * 0.04 }}
                                                    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/50 transition-colors group"
                                                >
                                                    <div className={`w-9 h-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                                        {item.type === "calendar" && <Calendar className="w-4 h-4 text-blue-600" />}
                                                        {item.type === "url" && <Link2 className="w-4 h-4 text-amber-600" />}
                                                        {item.type === "engagement" && <Users className="w-4 h-4 text-purple-600" />}
                                                        {item.type === "caption" && <Type className="w-4 h-4 text-teal-600" />}
                                                        {!["calendar", "url", "engagement", "caption"].includes(item.type) && <FileText className="w-4 h-4 text-slate-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                                                            {getRelativeTime(item.created_at)}
                                                        </span>
                                                        <Badge variant="secondary" className="text-[8px] font-bold uppercase tracking-widest rounded px-1 py-0 h-3.5 bg-slate-50 text-slate-400 border-slate-100 block mt-0.5 w-fit ml-auto">
                                                            {item.type}
                                                        </Badge>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* ━━━ Collapsible Account Details ━━━ */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.4 }}
                        >
                            <Card className="rounded-2xl border-slate-200/60 shadow-sm overflow-hidden bg-white">
                                <button
                                    onClick={() => setAccountDetailsOpen(!accountDetailsOpen)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <User className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">Account Details</h3>
                                            <p className="text-[11px] text-slate-400">Creator ID, email, registration info</p>
                                        </div>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: accountDetailsOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center"
                                    >
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    </motion.div>
                                </button>

                                <AnimatePresence initial={false}>
                                    {accountDetailsOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-6 pb-5 pt-1">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creator ID</p>
                                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                                                            <span className="text-xs font-mono text-slate-600 truncate mr-2">
                                                                {user?.uid}
                                                            </span>
                                                            <button
                                                                onClick={() => copyToClipboard(user?.uid, "UID")}
                                                                className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-blue-600 transition-all"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Email</p>
                                                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                            <span className="text-xs font-semibold text-slate-700 truncate">
                                                                {user?.email}
                                                            </span>
                                                            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                                <Shield className="w-3 h-3 text-blue-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Created</p>
                                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                                <Database className="w-3 h-3 text-indigo-500" />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-700">
                                                                {formatFullDate(profile?.joined_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Token Refresh</p>
                                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                                <Clock className="w-3 h-3 text-emerald-500" />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-700">
                                                                {formatFullDate(profile?.last_login)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
