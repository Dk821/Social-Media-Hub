import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axiosConfig";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Loader2,
    Target,
    Users,
    MessageCircle,
    BookOpen,
    Megaphone,
    Heart,
    Copy,
    Check,
    ChevronDown,
    Clock,
    Sparkles,
} from "lucide-react";

const POST_TYPE_META = {
    awareness: { label: "Awareness Post", icon: Megaphone, color: "bg-blue-500", gradient: "from-blue-500 to-blue-600" },
    poll: { label: "Poll", icon: MessageCircle, color: "bg-green-500", gradient: "from-green-500 to-emerald-600" },
    question: { label: "Question Post", icon: Users, color: "bg-amber-500", gradient: "from-amber-500 to-orange-600" },
    storytelling: { label: "Storytelling Post", icon: BookOpen, color: "bg-purple-500", gradient: "from-purple-500 to-violet-600" },
    cta: { label: "Call-to-Action", icon: Target, color: "bg-red-500", gradient: "from-red-500 to-rose-600" },
};

const EngagementPlanView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);

    const fetchPlan = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/community/plan/${id}`);
            setPlan(res.data);
            const output = res.data.plan_output || {};
            const order = output.suggested_posting_order || Object.keys(output.posts || {});
            if (order.length > 0) setSelectedPost(order[0]);
        } catch {
            toast.error("Failed to load engagement plan");
            navigate("/engagement-planner");
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    const handleFavorite = async () => {
        try {
            const res = await api.post(`/api/community/plan/${id}/favorite`);
            setPlan((prev) => ({ ...prev, is_favorite: res.data.is_favorite }));
            toast.success(res.data.is_favorite ? "Added to favorites" : "Removed from favorites");
        } catch {
            toast.error("Failed to toggle favorite");
        }
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!plan) return null;

    const output = plan.plan_output || {};
    const posts = output.posts || {};
    const order = output.suggested_posting_order || Object.keys(posts);
    const currentPost = posts[selectedPost];
    const currentMeta = POST_TYPE_META[selectedPost];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 transition-all duration-300">
                <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate("/engagement-planner")}
                        className="group flex items-center gap-2.5 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg group-hover:bg-slate-100 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Back to Planner</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleFavorite}
                            className={`p-2.5 rounded-xl transition-all duration-200 ${plan.is_favorite
                                ? "bg-red-50 text-red-500 shadow-sm shadow-red-100"
                                : "text-slate-300 hover:bg-slate-50 hover:text-slate-400"
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${plan.is_favorite ? "fill-current" : ""}`} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Sidebar - Plan Details & Navigation */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Header Info */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm shadow-slate-200/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />

                            <div className="relative">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        <Sparkles className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                                            {plan.platform} Plan
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                <Clock className="w-3 h-3" />
                                                {new Date(plan.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {[plan.goal, plan.tone, plan.industry, plan.target_audience].map((tag, i) => tag && (
                                        <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-100 hover:border-slate-200 transition-colors capitalize">
                                            {tag.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>

                                {output.engagement_strategy_notes && (
                                    <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="w-4 h-4 text-indigo-600" />
                                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Strategy</span>
                                        </div>
                                        <p className="text-sm text-indigo-800/80 leading-relaxed font-medium">
                                            {output.engagement_strategy_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Menu */}
                        <div className="bg-white rounded-3xl p-3 border border-slate-200/60 shadow-sm shadow-slate-200/40">
                            <p className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Engagement Ladder</p>
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
                                                ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
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
                                                    layoutId="sidebar-active"
                                                    className="absolute right-4 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Mockup & Post View */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {selectedPost && currentPost && (
                                <motion.div
                                    key={selectedPost}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="space-y-8"
                                >
                                    {/* Post Header with Actions */}
                                    <div className="flex items-center justify-between px-2">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                                                {currentPost.title || currentMeta.label}
                                            </h2>
                                            <p className="text-slate-500 text-sm mt-1">{currentPost.purpose || "Generated specifically for your audience"}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleCopy(selectedPost, currentPost.content)}
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${copiedKey === selectedPost
                                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                    : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100"
                                                    }`}
                                            >
                                                {copiedKey === selectedPost ? (
                                                    <><Check className="w-4 h-4" /> Copied!</>
                                                ) : (
                                                    <><Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-600" /> Copy Text</>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* SOCIAL MEDIA MOCKUP CONTAINER */}
                                    <div className="relative">
                                        {/* Mockup Background Design */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-white/50 rounded-[40px] border border-white/80 blur-3xl -z-10" />

                                        {/* Dynamic Platform Mockup */}
                                        <div className="flex justify-center py-6 px-4">
                                            {plan.platform === 'Instagram' ? (
                                                <InstagramMockup content={currentPost.content} options={currentPost.options} isPoll={selectedPost === 'poll'} />
                                            ) : plan.platform === 'LinkedIn' ? (
                                                <LinkedInMockup content={currentPost.content} options={currentPost.options} isPoll={selectedPost === 'poll'} />
                                            ) : (
                                                <XMockup content={currentPost.content} options={currentPost.options} isPoll={selectedPost === 'poll'} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Raw Content View */}
                                    <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-8 group">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Raw Output</span>
                                            </div>
                                        </div>
                                        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-600 leading-relaxed bg-white/50 p-6 rounded-2xl border border-slate-200/40 select-all group-hover:border-slate-300 transition-colors">
                                            {currentPost.content}
                                        </pre>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

// ── MOCKUP COMPONENTS ──────────────────────────────────────

const InstagramMockup = ({ content, options, isPoll }) => (
    <div className="w-full max-w-[420px] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden font-sans">
        <div className="p-4 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white p-[1px]">
                        <div className="w-full h-full rounded-full bg-slate-100" />
                    </div>
                </div>
                <span className="text-xs font-bold text-slate-800">Your Brand</span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-300" />)}
            </div>
        </div>
        <div className="aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden group">
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-10 text-center">
                <Sparkles className="w-16 h-16 text-slate-300 mb-4 group-hover:scale-110 transition-transform duration-700" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Image Content Placeholder</p>
                <p className="text-[10px] text-slate-400 mt-2 max-w-[200px] leading-relaxed italic">Visual suggested for the {content.length > 50 ? 'topic discussed' : 'post'}</p>
            </div>
        </div>
        <div className="p-4 space-y-3">
            <div className="flex items-center gap-4 py-1">
                <Heart className="w-6 h-6 text-slate-800 hover:text-red-500 cursor-pointer transition-colors" />
                <MessageCircle className="w-6 h-6 text-slate-800" />
                <Megaphone className="w-6 h-6 text-slate-800" />
                <div className="ml-auto">
                    <BookOpen className="w-6 h-6 text-slate-800" />
                </div>
            </div>
            <div className="text-xs leading-relaxed">
                <span className="font-bold mr-2 text-slate-900">yourbrand</span>
                <span className="text-slate-700 whitespace-pre-wrap">{content}</span>
            </div>
            {isPoll && options && (
                <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
                    {options.slice(0, 4).map((opt, i) => (
                        <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold text-center text-slate-600">
                            {opt}
                        </div>
                    ))}
                </div>
            )}
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider pt-1">2 hours ago</div>
        </div>
    </div>
);

const LinkedInMockup = ({ content, options, isPoll }) => (
    <div className="w-full max-w-[600px] bg-white rounded-2xl border border-slate-200 shadow-xl font-sans overflow-hidden">
        <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200" />
                <div>
                    <p className="text-sm font-bold text-slate-900 leading-none">Your Brand Name</p>
                    <p className="text-[11px] text-slate-500 mt-1">Innovative Solutions | Industry Leaders</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-slate-400">1h •</span>
                        <Target className="w-3 h-3 text-slate-400" />
                    </div>
                </div>
            </div>
            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap mb-6 underline-offset-4 decoration-blue-500/30">
                {content}
            </div>
            {isPoll && options && (
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/60 p-5 mt-4">
                    <p className="text-xs font-bold text-slate-900 mb-4 opacity-80 uppercase tracking-widest">Poll Question</p>
                    <div className="space-y-2.5">
                        {options.slice(0, 4).map((opt, i) => (
                            <div key={i} className="w-full p-4 rounded-xl border-2 border-blue-100 bg-white text-xs font-bold text-blue-700 flex justify-between group hover:bg-blue-50 transition-colors cursor-default">
                                {opt}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px]">Vote</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">348 votes • 3 days left</div>
                </div>
            )}
            <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-50">
                <div className="flex -space-x-1.5 mr-2">
                    {[1, 2, 3].map(i => <div key={i} className={`w-5 h-5 rounded-full border border-white ${['bg-blue-500', 'bg-emerald-500', 'bg-red-400'][i - 1]}`} />)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Liked by 42 people</span>
            </div>
        </div>
        <div className="grid grid-cols-4 border-t border-slate-50">
            {['Like', 'Comment', 'Repost', 'Send'].map(btn => (
                <button key={btn} className="py-4 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">{btn}</button>
            ))}
        </div>
    </div>
);

const XMockup = ({ content, options, isPoll }) => (
    <div className="w-full max-w-[500px] bg-white rounded-3xl border border-slate-200 shadow-xl font-sans p-5">
        <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xl uppercase italic">Brand</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-[15px]">
                    <span className="font-bold text-slate-900">Your Brand</span>
                    <span className="text-slate-500">@yourbrand</span>
                    <span className="text-slate-500">· 2h</span>
                </div>
                <div className="text-[15px] text-slate-800 leading-normal mt-1 whitespace-pre-wrap">
                    {content}
                </div>
                {isPoll && options && (
                    <div className="mt-4 space-y-1.5">
                        {options.slice(0, 4).map((opt, i) => (
                            <div key={i} className="relative w-full overflow-hidden rounded-xl border border-blue-200/60 bg-white p-3 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50">
                                {opt}
                            </div>
                        ))}
                        <div className="text-[13px] text-slate-500 mt-2">1,248 votes · 2 hours left</div>
                    </div>
                )}
                <div className="flex items-center justify-between mt-4 text-slate-500 max-w-[340px]">
                    <MessageCircle className="w-5 h-5 hover:text-blue-500 transition-colors" />
                    <ArrowLeft className="w-5 h-5 hover:text-green-500 rotate-180 transition-colors" />
                    <Heart className="w-5 h-5 hover:text-pink-500 transition-colors" />
                    <Target className="w-5 h-5 hover:text-blue-500 transition-colors" />
                </div>
            </div>
        </div>
    </div>
);

export default EngagementPlanView;
