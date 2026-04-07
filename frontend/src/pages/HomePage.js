import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Sparkles,
    Link2,
    Users,
    History,
    ArrowRight,
    Zap,
    Calendar,
    Target,
    TrendingUp,
    Shield,
    Layers,
    RefreshCw,
    CheckCircle2,
    ChevronRight,
    Instagram,
    Linkedin,
    Twitter,
    Facebook,
    BarChart3,
    Clock,
    Star,
    Type
} from "lucide-react";
import api from "@/lib/axiosConfig";

const MODULES = [
    {
        id: "calendar",
        title: "AI Calendar Generator",
        description: "Generate 1–30 day content calendars with platform-specific posts, pillars, and scheduling — ready in seconds.",
        icon: Sparkles,
        path: "/calendar-generator",
        gradient: "from-blue-600 to-indigo-700",
        shadow: "shadow-blue-500/25",
        lightBg: "bg-blue-50",
        lightText: "text-blue-600",
        features: ["Multi-platform", "Content pillars", "1-30 days"],
    },
    {
        id: "engagement",
        title: "Community Engagement",
        description: "Build 5-step engagement ladders — from awareness to CTA — optimized for any social platform.",
        icon: Users,
        path: "/engagement-planner",
        gradient: "from-purple-600 to-pink-600",
        shadow: "shadow-pink-500/25",
        lightBg: "bg-purple-50",
        lightText: "text-purple-600",
        features: ["5-step ladders", "Platform optimized", "Polls & CTAs"],
    },
    {
        id: "url",
        title: "URL Content Repurposer",
        description: "Transform any article or YouTube video into carousels, threads, and social-ready posts instantly.",
        icon: Link2,
        path: "/url-generator",
        gradient: "from-amber-500 to-orange-600",
        shadow: "shadow-orange-500/25",
        lightBg: "bg-amber-50",
        lightText: "text-amber-600",
        features: ["YouTube transcripts", "Blog extraction", "Multi-format"],
    },
    {
        id: "caption",
        title: "Caption & Bio Generator",
        description: "Generate captions, bios, taglines & descriptions with platform character limits enforced — 3-5 AI variations in seconds.",
        icon: Type,
        path: "/caption-generator",
        gradient: "from-emerald-500 to-teal-600",
        shadow: "shadow-emerald-500/25",
        lightBg: "bg-emerald-50",
        lightText: "text-emerald-600",
        features: ["Char limits", "3-5 variations", "Copy-to-clipboard"],
    },
];

const STATS_FEATURES = [
    { icon: Shield, label: "Multi-AI Failover", desc: "4 providers, zero downtime" },
    { icon: Layers, label: "4 Power Modules", desc: "Calendar, Repurpose, Engage, Captions" },
    { icon: RefreshCw, label: "Instant Regeneration", desc: "One-click post rewrites" },
    { icon: Target, label: "Platform Optimized", desc: "LinkedIn, X, IG, Facebook" },
];

const PLATFORMS = [
    { name: "LinkedIn", icon: Linkedin, color: "text-blue-600", bg: "bg-blue-50", hoverBg: "hover:bg-blue-100" },
    { name: "X (Twitter)", icon: Twitter, color: "text-slate-800", bg: "bg-slate-50", hoverBg: "hover:bg-slate-100" },
    { name: "Instagram", icon: Instagram, color: "text-pink-500", bg: "bg-pink-50", hoverBg: "hover:bg-pink-100" },
    { name: "Facebook", icon: Facebook, color: "text-blue-700", bg: "bg-blue-50", hoverBg: "hover:bg-blue-100" },
];

const WORKFLOW_STEPS = [
    { step: "01", title: "Define Strategy", desc: "Set your brand, audience, tone, and goals", icon: Target },
    { step: "02", title: "AI Generates", desc: "Multi-provider AI creates optimized content", icon: Zap },
    { step: "03", title: "Review & Refine", desc: "Edit, regenerate, or customize any post", icon: RefreshCw },
    { step: "04", title: "Export & Publish", desc: "Copy your polished content to any platform", icon: CheckCircle2 },
];

const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashStats, setDashStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/api/user/dashboard-stats");
                setDashStats(res.data?.stats);
            } catch {
                // silent — stats are optional
            }
        };
        fetchStats();
    }, []);

    const totalContent = dashStats
        ? (dashStats.total_calendars || 0) + (dashStats.url_generations || 0) + (dashStats.engagement_plans || 0) + (dashStats.caption_generations || 0)
        : null;

    return (
        <div className="min-h-screen bg-[#FAFBFF] selection:bg-indigo-100 selection:text-indigo-900">

            {/* ━━━ Hero Section ━━━ */}
            <section className="relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-100/60 via-purple-50/40 to-transparent rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-blue-50/50 to-transparent rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
                        {/* Left — Copy */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                            className="lg:w-1/2 text-center lg:text-left space-y-7"
                        >
                            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/80 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                                    {user?.displayName ? `Welcome back, ${user.displayName.split(' ')[0]}` : 'AI-Powered Content Hub'}
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                                Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">Scroll-Stopping</span> Content with AI
                            </h1>

                            <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Generate calendars, repurpose articles, and plan engagement&nbsp;—
                                all powered by multi-provider AI with enterprise failover.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                                <button
                                    onClick={() => navigate("/calendar-generator")}
                                    className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Start Creating
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate("/history")}
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-700 font-bold text-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <History className="w-4 h-4" />
                                    Content Library
                                </button>
                            </div>

                            {/* Mini stat strip */}
                            {totalContent !== null && totalContent > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                    className="flex items-center gap-6 pt-2 justify-center lg:justify-start"
                                >
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Calendars</p>
                                            <p className="text-sm font-bold text-slate-800">{dashStats?.total_calendars || 0}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100" />
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                            <BarChart3 className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Total Posts</p>
                                            <p className="text-sm font-bold text-slate-800">{dashStats?.total_posts || 0}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100" />
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                                            <Star className="w-4 h-4 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Favorites</p>
                                            <p className="text-sm font-bold text-slate-800">{dashStats?.favorites_count || 0}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Right — Visual Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="lg:w-1/2 w-full max-w-lg"
                        >
                            <div className="relative">
                                {/* Main card */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-1.5">
                                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-[22px] p-8 relative overflow-hidden">
                                        {/* Grid pattern overlay */}
                                        <div className="absolute inset-0 opacity-[0.04]" style={{
                                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Cpath d='M0 0h1v40H0zM39 0h1v40h-1z'/%3E%3Cpath d='M0 0h40v1H0zM0 39h40v1H0z'/%3E%3C/g%3E%3C/svg%3E")`
                                        }} />

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                                </div>
                                                <div className="px-3 py-1 rounded-lg bg-white/10 text-[10px] font-mono font-medium text-white/60">
                                                    ContentAI Studio
                                                </div>
                                            </div>

                                            {/* Simulated content preview */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                                        <Sparkles className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">7-Day Content Calendar</p>
                                                        <p className="text-white/40 text-xs">28 posts • 4 platforms</p>
                                                    </div>
                                                </div>

                                                {/* Platform rows */}
                                                {[
                                                    { platform: "LinkedIn", icon: Linkedin, posts: "8 posts", color: "bg-blue-500" },
                                                    { platform: "Instagram", icon: Instagram, posts: "7 posts", color: "bg-pink-500" },
                                                    { platform: "Twitter", icon: Twitter, posts: "7 posts", color: "bg-sky-400" },
                                                    { platform: "Facebook", icon: Facebook, posts: "6 posts", color: "bg-blue-700" },
                                                ].map((p, i) => (
                                                    <motion.div
                                                        key={p.platform}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.6 + i * 0.1 }}
                                                        className="flex items-center gap-3 bg-white/[0.06] rounded-xl px-4 py-3 border border-white/[0.06]"
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center`}>
                                                            <p.icon className="w-4 h-4 text-white" />
                                                        </div>
                                                        <p className="text-white/80 text-sm font-medium flex-1">{p.platform}</p>
                                                        <span className="text-white/30 text-xs font-medium">{p.posts}</span>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating badge */}
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 flex items-center gap-2"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">AI Engine</p>
                                        <p className="text-xs font-black text-slate-800">4 Providers</p>
                                    </div>
                                </motion.div>

                                {/* Floating time badge */}
                                <motion.div
                                    animate={{ y: [0, 8, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -bottom-3 -left-3 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-2"
                                >
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    <p className="text-xs font-bold text-slate-700">~30s generation</p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ━━━ Platform Strip ━━━ */}
            <div className="border-y border-slate-100 bg-white/60 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mr-4">Optimized for</span>
                        {PLATFORMS.map((p) => (
                            <div
                                key={p.name}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${p.bg} ${p.hoverBg} transition-colors cursor-default`}
                            >
                                <p.icon className={`w-4 h-4 ${p.color}`} />
                                <span className="text-xs font-bold text-slate-700">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ━━━ Modules Section ━━━ */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-2xl mx-auto mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.15em]">AI Modules</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
                            Four Modules, One Platform
                        </h2>
                        <p className="text-base text-slate-500 leading-relaxed">
                            Each module is purpose-built for a specific content workflow — together, they form a complete creation ecosystem.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {MODULES.map((module, idx) => (
                            <motion.div
                                key={module.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.12 }}
                                onClick={() => navigate(module.path)}
                                className="group cursor-pointer bg-white rounded-3xl border border-slate-200/60 p-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.07)] hover:-translate-y-2 relative overflow-hidden"
                            >
                                {/* Hover gradient overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                                <div className="relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} flex items-center justify-center mb-7 shadow-xl ${module.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                        <module.icon className="w-7 h-7 text-white" />
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors leading-tight">
                                        {module.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                        {module.description}
                                    </p>

                                    {/* Feature badges */}
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {module.features.map(f => (
                                            <span key={f} className={`px-2.5 py-1 rounded-lg ${module.lightBg} text-[10px] font-bold ${module.lightText} uppercase tracking-wider`}>
                                                {f}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        Launch Module
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Content Library Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        onClick={() => navigate("/history")}
                        className="mt-6 group cursor-pointer bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                                <History className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-1">Content Library</h3>
                                <p className="text-sm text-white/50">Access your entire archive — calendars, repurposed content, and engagement plans.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-white/60 group-hover:text-white transition-colors whitespace-nowrap">
                            Browse Library
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ━━━ How It Works ━━━ */}
            <section className="py-24 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-2xl mx-auto mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
                            <Zap className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.15em]">How It Works</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
                            Content in Four Simple Steps
                        </h2>
                        <p className="text-base text-slate-500 leading-relaxed">
                            From strategy to publication-ready content — our AI handles the heavy lifting.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {WORKFLOW_STEPS.map((step, idx) => (
                            <motion.div
                                key={step.step}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative bg-slate-50/50 rounded-2xl border border-slate-100 p-6 hover:bg-white hover:shadow-lg hover:border-slate-200 transition-all duration-300"
                            >
                                <span className="text-5xl font-black text-slate-100 absolute top-4 right-5 leading-none select-none">
                                    {step.step}
                                </span>
                                <div className="relative z-10">
                                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-5 shadow-sm">
                                        <step.icon className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ━━━ Features Grid ━━━ */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center max-w-2xl mx-auto mb-16"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 mb-6">
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.15em]">Built Different</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
                            Enterprise-Grade, Creator-Friendly
                        </h2>
                        <p className="text-base text-slate-500 leading-relaxed">
                            The power of a SaaS platform with the simplicity of a personal tool.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {STATS_FEATURES.map((feature, idx) => (
                            <motion.div
                                key={feature.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.08 }}
                                className="bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 flex items-center justify-center mb-4">
                                    <feature.icon className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">{feature.label}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ━━━ CTA Footer ━━━ */}
            <section className="pb-24">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-12 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='6' cy='6' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }} />
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Create?</h2>
                            <p className="text-white/50 text-base mb-8 max-w-lg mx-auto">
                                Start generating professional content for all your social platforms in seconds.
                            </p>
                            <button
                                onClick={() => navigate("/calendar-generator")}
                                className="group px-10 py-4 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-black/20 inline-flex items-center gap-2"
                            >
                                Launch Calendar Generator
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

        </div>
    );
};

export default HomePage;
