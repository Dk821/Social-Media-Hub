import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft, Copy, Check, Type, Loader2, Heart,
    AlertCircle, Clock, Sparkles,
    Instagram, Linkedin, Twitter, Facebook,
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";
import { toast } from "sonner";
import api from "@/lib/axiosConfig";

const platformMeta = {
    Instagram: { icon: FaInstagram, color: "text-[#E1306C]", bg: "bg-pink-50", gradient: "from-pink-500 to-purple-600" },
    Twitter: { icon: FaTwitter, color: "text-black", bg: "bg-slate-50", gradient: "from-gray-800 to-black" },
    LinkedIn: { icon: FaLinkedin, color: "text-[#0A66C2]", bg: "bg-blue-50", gradient: "from-blue-600 to-blue-700" },
    Facebook: { icon: FaFacebook, color: "text-[#1877F2]", bg: "bg-blue-50", gradient: "from-blue-500 to-blue-600" },
};

const CaptionGenerationView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/caption/generation/${id}`);
                setData(res.data);
                setIsFavorite(res.data.is_favorite || false);
            } catch {
                toast.error("Failed to load generation");
                navigate("/history");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleCopy = async (idx, text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIdx(idx);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopiedIdx(null), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    const handleCopyAll = async () => {
        if (!data?.variations) return;
        const allText = data.variations.map((v, i) => `--- Variation ${i + 1} ---\n${v.text}`).join("\n\n");
        try {
            await navigator.clipboard.writeText(allText);
            toast.success("All variations copied!");
        } catch {
            toast.error("Failed to copy");
        }
    };

    const handleFavorite = async () => {
        try {
            const res = await api.post(`/api/caption/${id}/favorite`);
            setIsFavorite(res.data.is_favorite);
            toast.success(res.data.is_favorite ? "Added to favorites ❤️" : "Removed from favorites");
        } catch {
            toast.error("Failed to toggle favorite");
        }
    };

    const getCharColor = (count, limit) => {
        const ratio = count / limit;
        if (ratio <= 0.8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (ratio <= 1) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    const formatDate = (d) => {
        try {
            const date = typeof d === "string" ? new Date(d) : d?._seconds ? new Date(d._seconds * 1000) : new Date(d);
            return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch { return ""; }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    <p className="text-slate-400 text-sm font-medium">Loading generation...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const variations = data.variations || [];
    const charLimit = data.char_limit || 500;
    const pm = platformMeta[data.platform] || platformMeta.Instagram;
    const PlatformIcon = pm.icon;

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Back button */}
                <button
                    onClick={() => navigate("/history")}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back to History
                </button>

                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6"
                >
                    {/* Gradient banner */}
                    <div className={`h-2 bg-gradient-to-r ${pm.gradient}`} />

                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pm.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                                    <Type className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        {data.brand_name}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${pm.bg} text-xs font-semibold ${pm.color}`}>
                                            <PlatformIcon className="w-3 h-3" />
                                            {data.platform}
                                        </span>
                                        <span className="px-3 py-1 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-600 capitalize">
                                            {data.content_type}
                                        </span>
                                        <span className="px-3 py-1 rounded-lg bg-purple-50 text-xs font-semibold text-purple-600 capitalize">
                                            {data.tone}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleFavorite}
                                    className={`p-2.5 rounded-xl border transition-all ${isFavorite
                                        ? "border-red-200 bg-red-50 text-red-500"
                                        : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-red-400"
                                        }`}
                                >
                                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500" : ""}`} />
                                </button>
                                <button
                                    onClick={handleCopyAll}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98]"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy All
                                </button>
                            </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(data.created_at)}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                {variations.length} variations
                            </div>
                            <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Max {charLimit} chars
                            </div>
                        </div>

                        {/* Key points */}
                        {data.key_points && (
                            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Key Points</p>
                                <p className="text-sm text-gray-600 leading-relaxed">{data.key_points}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Variations */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 px-1">
                        {variations.length} Variation{variations.length !== 1 ? "s" : ""}
                    </h2>

                    {variations.map((v, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow group"
                        >
                            {/* Top bar */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Variation {idx + 1}
                                    </span>
                                    {v.style && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 capitalize">
                                            {v.style}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getCharColor(v.char_count, charLimit)}`}>
                                        {v.char_count}/{charLimit}
                                    </span>
                                    <button
                                        onClick={() => handleCopy(idx, v.text)}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${copiedIdx === idx
                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                                            }`}
                                    >
                                        {copiedIdx === idx ? (
                                            <><Check className="w-3 h-3" /> Copied</>
                                        ) : (
                                            <><Copy className="w-3 h-3" /> Copy</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed bg-gray-50/60 p-4 rounded-xl border border-gray-100 select-all group-hover:border-gray-200 transition-colors">
                                {v.text}
                            </pre>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CaptionGenerationView;
