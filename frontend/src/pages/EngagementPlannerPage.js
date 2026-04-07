import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axiosConfig";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Loader2,
    ArrowRight,
    ArrowLeft,
    Target,
    Users,
    MessageCircle,
    BookOpen,
    Megaphone,
    Trash2,
    Heart,
    Eye,
    Clock,
    ChevronDown,
    Copy,
    Check,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────
const GOALS = [
    { value: "engagement", label: "Engagement", icon: MessageCircle },
    { value: "brand_awareness", label: "Brand Awareness", icon: Megaphone },
    { value: "lead_generation", label: "Lead Generation", icon: Target },
    { value: "community_building", label: "Community Building", icon: Users },
];

const TONES = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "inspirational", label: "Inspirational" },
    { value: "bold", label: "Bold" },
    { value: "educational", label: "Educational" },
];

const PLATFORMS = [
    { value: "LinkedIn", label: "LinkedIn", color: "from-blue-600 to-blue-700" },
    { value: "Twitter", label: "Twitter / X", color: "from-gray-800 to-black" },
    { value: "Instagram", label: "Instagram", color: "from-pink-500 to-purple-600" },
    { value: "Facebook", label: "Facebook", color: "from-blue-500 to-blue-600" },
];

const LENGTHS = [
    { value: "short", label: "Short", desc: "Punchy & concise" },
    { value: "medium", label: "Medium", desc: "Balanced content" },
    { value: "long", label: "Long", desc: "In-depth posts" },
];

const POST_TYPE_META = {
    awareness: { label: "Awareness Post", icon: Megaphone, color: "bg-blue-500" },
    poll: { label: "Poll", icon: MessageCircle, color: "bg-green-500" },
    question: { label: "Question Post", icon: Users, color: "bg-amber-500" },
    storytelling: { label: "Storytelling Post", icon: BookOpen, color: "bg-purple-500" },
    cta: { label: "Call-to-Action", icon: Target, color: "bg-red-500" },
};

// ── Main Page ──────────────────────────────────────────
const EngagementPlannerPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0 = form, 1 = loading, 2 = results
    const [formData, setFormData] = useState({
        goal: "",
        target_audience: "",
        industry: "",
        tone: "",
        platform: "",
        content_length: "medium",
    });
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // Fetch history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const res = await api.get("/api/community/plans");
            setHistory(res.data.items || []);
        } catch {
            // silent — history is supplementary
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSubmit = async () => {
        // Validate
        if (!formData.goal || !formData.target_audience || !formData.industry || !formData.tone || !formData.platform) {
            toast.error("Please fill in all fields");
            return;
        }

        setStep(1); // loading
        try {
            const res = await api.post("/api/community/plan", formData);
            setResult(res.data);
            setStep(2); // results
            fetchHistory(); // refresh sidebar
            toast.success("Engagement plan generated!");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Generation failed. Please try again.");
            setStep(0);
        }
    };

    const handleDelete = async (planId, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/api/community/plan/${planId}`);
            setHistory((prev) => prev.filter((p) => p.id !== planId));
            toast.success("Plan deleted");
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleFavorite = async (planId, e) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/api/community/plan/${planId}/favorite`);
            setHistory((prev) =>
                prev.map((p) => (p.id === planId ? { ...p, is_favorite: res.data.is_favorite } : p))
            );
        } catch {
            toast.error("Failed to toggle favorite");
        }
    };

    const resetForm = () => {
        setStep(0);
        setResult(null);
        setFormData({ goal: "", target_audience: "", industry: "", tone: "", platform: "", content_length: "medium" });
    };

    // ── Render ──────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        Community Engagement Planner
                    </h1>
                    <p className="text-gray-500 mt-2 ml-[52px]">
                        Generate a structured engagement ladder with 5 platform-optimized post types
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── Left: Form / Loading / Results ── */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {step === 0 && (
                                <FormStep
                                    key="form"
                                    formData={formData}
                                    setFormData={setFormData}
                                    onSubmit={handleSubmit}
                                />
                            )}
                            {step === 1 && <LoadingStep key="loading" />}
                            {step === 2 && result && (
                                <ResultsStep key="results" result={result} onReset={resetForm} />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Right: History Sidebar ── */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                Recent Plans
                            </h2>
                            {loadingHistory ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                                </div>
                            ) : history.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">No plans yet</p>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                    {history.map((plan) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => navigate(`/engagement-plan/${plan.id}`)}
                                            className="group p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {plan.platform} — {plan.goal?.replace(/_/g, " ")}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {plan.industry} · {plan.tone}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {new Date(plan.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={(e) => handleFavorite(plan.id, e)}
                                                        className="p-1.5 rounded-lg hover:bg-white transition"
                                                    >
                                                        <Heart
                                                            className={`w-3.5 h-3.5 ${plan.is_favorite
                                                                ? "fill-red-500 text-red-500"
                                                                : "text-gray-300"
                                                                }`}
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(plan.id, e)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Form Step ──────────────────────────────────────────
const FormStep = ({ formData, setFormData, onSubmit }) => {
    const update = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-8"
        >
            {/* 1. Goal */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">1. What is the primary goal?</legend>
                <div className="grid grid-cols-2 gap-3">
                    {GOALS.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => update("goal", value)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all ${formData.goal === value
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* 2. Target Audience */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">2. Target Audience</legend>
                <input
                    type="text"
                    value={formData.target_audience}
                    onChange={(e) => update("target_audience", e.target.value)}
                    placeholder="e.g. Startup founders, marketing managers, developers…"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
            </fieldset>

            {/* 3. Industry */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">3. Industry</legend>
                <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => update("industry", e.target.value)}
                    placeholder="e.g. SaaS, Healthcare, Education, E-commerce…"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
            </fieldset>

            {/* 4. Brand Tone */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">4. Brand Tone</legend>
                <div className="flex flex-wrap gap-2">
                    {TONES.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => update("tone", value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${formData.tone === value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* 5. Platform */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">5. Platform</legend>
                <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map(({ value, label, color }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => update("platform", value)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all ${formData.platform === value
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            <div
                                className={`w-6 h-6 rounded-md bg-gradient-to-br ${color} flex items-center justify-center`}
                            >
                                <span className="text-white text-[10px] font-bold">
                                    {value[0]}
                                </span>
                            </div>
                            {label}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* 6. Content Length */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">6. Content Length Preference</legend>
                <div className="grid grid-cols-3 gap-3">
                    {LENGTHS.map(({ value, label, desc }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => update("content_length", value)}
                            className={`p-3.5 rounded-xl border text-center transition-all ${formData.content_length === value
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs mt-0.5 opacity-70">{desc}</p>
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* Submit */}
            <button
                onClick={onSubmit}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-[0.98]"
            >
                <Sparkles className="w-4 h-4" />
                Generate Engagement Plan
                <ArrowRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

// ── Loading Step ───────────────────────────────────────
const LoadingStep = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 px-8"
    >
        <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse">
                <Sparkles className="w-7 h-7 text-white" />
            </div>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-purple-500 mb-4" />
        <p className="text-lg font-semibold text-gray-800">Generating your engagement plan…</p>
        <p className="text-sm text-gray-400 mt-1">Crafting 5 platform-optimized post types</p>
    </motion.div>
);

// ── Results Step ───────────────────────────────────────
const ResultsStep = ({ result, onReset }) => {
    const plan = result.plan || {};
    const posts = plan.posts || {};
    const order = plan.suggested_posting_order || Object.keys(posts);
    const [selectedPost, setSelectedPost] = useState(order[0] || null);
    const [copiedKey, setCopiedKey] = useState(null);

    const handleCopy = async (key, text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopiedKey(null), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    const currentPost = posts[selectedPost];
    const currentMeta = POST_TYPE_META[selectedPost];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            {/* Header Content */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                        Success! Your Plan is Ready
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Explore your {result.platform} strategy step-by-step
                    </p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" />
                    New Plan
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Sidebar Navigation */}
                <div className="xl:col-span-5 space-y-6">
                    {plan.engagement_strategy_notes && (
                        <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Master Strategy</span>
                            </div>
                            <p className="text-sm text-indigo-800/80 leading-relaxed font-medium capitalize">
                                {plan.engagement_strategy_notes}
                            </p>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl p-3 border border-slate-200/60 shadow-sm shadow-slate-200/40">
                        <p className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Sequence</p>
                        <div className="space-y-1.5">
                            {order.map((key, idx) => {
                                const post = posts[key];
                                const meta = POST_TYPE_META[key];
                                if (!post || !meta) return null;
                                const isActive = selectedPost === key;
                                const Icon = meta.icon;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedPost(key)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 relative group ${isActive
                                            ? "bg-slate-900 text-white shadow-xl shadow-slate-400/20"
                                            : "hover:bg-slate-50 text-slate-600"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${isActive ? "bg-white/10" : "bg-slate-100"
                                            }`}>
                                            <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Step {idx + 1}</p>
                                            <p className="text-sm font-bold truncate max-w-[180px] leading-tight mt-0.5">{meta.label}</p>
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="results-sidebar-active"
                                                className="absolute right-4 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Content View */}
                <div className="xl:col-span-7">
                    <AnimatePresence mode="wait">
                        {currentPost && (
                            <motion.div
                                key={selectedPost}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold text-slate-900 truncate pr-4">
                                            {currentPost.title || currentMeta.label}
                                        </h3>
                                        <p className="text-slate-500 text-xs mt-1 truncate pr-4">
                                            {currentPost.purpose || "Customized for your audience"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(selectedPost, currentPost.content)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${copiedKey === selectedPost
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100"
                                            }`}
                                    >
                                        {copiedKey === selectedPost ? (
                                            <><Check className="w-4 h-4" /> Copied!</>
                                        ) : (
                                            <><Copy className="w-4 h-4 text-slate-400" /> Copy Text</>
                                        )}
                                    </button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 to-slate-100/30 rounded-[40px] border border-white/80 blur-3xl -z-10" />
                                    <div className="flex justify-center py-4 px-2">
                                        {result.platform === 'Instagram' ? (
                                            <InstagramMockup content={currentPost.content} options={currentPost.options} isPoll={selectedPost === 'poll'} />
                                        ) : result.platform === 'LinkedIn' ? (
                                            <LinkedInMockup content={currentPost.content} options={currentPost.options} isPoll={selectedPost === 'poll'} />
                                        ) : (
                                            <XMockup content={currentPost.content} options={currentPost.options} isPoll={selectedPost === 'poll'} />
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 group">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Post Content</span>
                                    </div>
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 leading-relaxed bg-white/50 p-6 rounded-2xl border border-slate-200/40 select-all group-hover:border-slate-300 transition-colors">
                                        {currentPost.content}
                                    </pre>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

// ── Mockup Components (Duplicated for Scope in Page) ────────────────
const InstagramMockup = ({ content, options, isPoll }) => (
    <div className="w-full max-w-[400px] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden font-sans scale-[0.9] sm:scale-100 origin-top">
        <div className="p-3 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white p-[1px]">
                        <div className="w-full h-full rounded-full bg-slate-100" />
                    </div>
                </div>
                <span className="text-[11px] font-bold text-slate-800">Your Brand</span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-300" />)}
            </div>
        </div>
        <div className="aspect-square bg-slate-100 flex items-center justify-center relative group">
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-8 text-center">
                <Sparkles className="w-12 h-12 text-slate-300 mb-4 group-hover:rotate-12 transition-transform duration-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Recommended Visual Space</p>
            </div>
        </div>
        <div className="p-4 space-y-2.5">
            <div className="flex items-center gap-4 py-0.5">
                <Heart className="w-5 h-5 text-slate-800" />
                <MessageCircle className="w-5 h-5 text-slate-800" />
                <Megaphone className="w-5 h-5 text-slate-800" />
                <div className="ml-auto">
                    <BookOpen className="w-5 h-5 text-slate-800" />
                </div>
            </div>
            <div className="text-[11px] leading-relaxed line-clamp-4">
                <span className="font-bold mr-2 text-slate-900">yourbrand</span>
                <span className="text-slate-700">{content}</span>
            </div>
            {isPoll && options && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {options.slice(0, 4).map((opt, i) => (
                        <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[9px] font-bold text-center text-slate-500">
                            {opt}
                        </div>
                    ))}
                </div>
            )}
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider pt-1">Just Now</div>
        </div>
    </div>
);

const LinkedInMockup = ({ content, options, isPoll }) => (
    <div className="w-full max-w-[560px] bg-white rounded-2xl border border-slate-200 shadow-xl font-sans overflow-hidden scale-[0.9] sm:scale-100 origin-top">
        <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200" />
                <div>
                    <p className="text-xs font-bold text-slate-900 leading-none">Your Brand Name</p>
                    <p className="text-[10px] text-slate-500 mt-1">Thought Leadership | Growth</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] text-slate-400">1m •</span>
                        <Target className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                </div>
            </div>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap mb-6 line-clamp-6">
                {content}
            </div>
            {isPoll && options && (
                <div className="bg-blue-50/30 rounded-2xl border border-blue-100/50 p-4 mt-2">
                    <p className="text-[10px] font-bold text-slate-900 mb-3 opacity-60 uppercase tracking-widest">Audience Poll</p>
                    <div className="space-y-2">
                        {options.slice(0, 4).map((opt, i) => (
                            <div key={i} className="w-full p-3 rounded-lg border border-blue-100 bg-white text-[10px] font-bold text-blue-700 flex justify-between">
                                {opt}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <div className="grid grid-cols-4 border-t border-slate-50 text-[10px] font-bold text-slate-500">
            {['Like', 'Comment', 'Repost', 'Send'].map(btn => (
                <button key={btn} className="py-3 hover:bg-slate-50">{btn}</button>
            ))}
        </div>
    </div>
);

const XMockup = ({ content, options, isPoll }) => (
    <div className="w-full max-w-[480px] bg-white rounded-3xl border border-slate-200 shadow-xl font-sans p-4 scale-[0.9] sm:scale-100 origin-top">
        <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm italic uppercase">B</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-sm">
                    <span className="font-bold text-slate-900">Your Brand</span>
                    <span className="text-slate-400 text-xs">@yourbrand · 1m</span>
                </div>
                <div className="text-sm text-slate-800 leading-normal mt-1 whitespace-pre-wrap">
                    {content}
                </div>
                {isPoll && options && (
                    <div className="mt-3 space-y-1">
                        {options.slice(0, 4).map((opt, i) => (
                            <div key={i} className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-blue-500">
                                {opt}
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-between mt-4 text-slate-400 max-w-[300px]">
                    <MessageCircle className="w-4 h-4" />
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                    <Heart className="w-4 h-4" />
                    <Target className="w-4 h-4" />
                </div>
            </div>
        </div>
    </div>
);

export default EngagementPlannerPage;
