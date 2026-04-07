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
    Copy,
    Check,
    Type,
    Trash2,
    Heart,
    Clock,
    AlertCircle,
    Instagram,
    Linkedin,
    Twitter,
    Facebook,
    ExternalLink,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────
const CONTENT_TYPES = [
    { value: "caption", label: "Caption", desc: "Social post caption" },
    { value: "bio", label: "Bio", desc: "Profile bio" },
    { value: "tagline", label: "Tagline", desc: "Brand slogan" },
    { value: "description", label: "Description", desc: "Page description" },
];

const PLATFORMS = [
    { value: "Instagram", label: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-600" },
    { value: "Twitter", label: "Twitter / X", icon: Twitter, color: "from-gray-800 to-black" },
    { value: "LinkedIn", label: "LinkedIn", icon: Linkedin, color: "from-blue-600 to-blue-700" },
    { value: "Facebook", label: "Facebook", icon: Facebook, color: "from-blue-500 to-blue-600" },
];

const TONES = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "inspirational", label: "Inspirational" },
    { value: "bold", label: "Bold" },
    { value: "witty", label: "Witty" },
    { value: "friendly", label: "Friendly" },
];

// Client-side limits mirror — used for the character badge
const LIMITS = {
    Instagram: { bio: 150, caption: 2200, tagline: 150, description: 2200 },
    Twitter: { bio: 160, caption: 280, tagline: 160, description: 280 },
    LinkedIn: { bio: 2600, caption: 1300, tagline: 220, description: 2600 },
    Facebook: { bio: 101, caption: 500, tagline: 255, description: 255 },
};

// ── Main Page ──────────────────────────────────────────
const CaptionBioPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // 0=form, 1=loading, 2=results
    const [formData, setFormData] = useState({
        content_type: "",
        platform: "",
        brand_name: "",
        tone: "",
        key_points: "",
        num_variations: 5,
    });
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const res = await api.get("/api/caption/history");
            setHistory(res.data.items || []);
        } catch { /* silent */ } finally {
            setLoadingHistory(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.content_type || !formData.platform || !formData.brand_name || !formData.tone || !formData.key_points) {
            toast.error("Please fill in all fields");
            return;
        }
        setStep(1);
        try {
            const res = await api.post("/api/caption/generate", formData);
            setResult(res.data);
            setStep(2);
            fetchHistory();
            toast.success("Variations generated!");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Generation failed. Please try again.");
            setStep(0);
        }
    };

    const handleDelete = async (genId, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/api/caption/${genId}`);
            setHistory((prev) => prev.filter((g) => g.id !== genId));
            toast.success("Deleted");
        } catch { toast.error("Failed to delete"); }
    };

    const handleFavorite = async (genId, e) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/api/caption/${genId}/favorite`);
            setHistory((prev) =>
                prev.map((g) => (g.id === genId ? { ...g, is_favorite: res.data.is_favorite } : g))
            );
        } catch { toast.error("Failed to toggle favorite"); }
    };

    const loadFromHistory = async (gen) => {
        try {
            const res = await api.get(`/api/caption/generation/${gen.id}`);
            setResult(res.data);
            setStep(2);
        } catch {
            toast.error("Failed to load generation");
        }
    };

    const formatDate = (d) => {
        try {
            // Firestore timestamps may come as strings or {_seconds, _nanoseconds}
            const date = typeof d === "string" ? new Date(d) : d?._seconds ? new Date(d._seconds * 1000) : new Date(d);
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        } catch { return ""; }
    };

    const resetForm = () => {
        setStep(0);
        setResult(null);
        setFormData({ content_type: "", platform: "", brand_name: "", tone: "", key_points: "", num_variations: 5 });
    };

    // ── Render ──────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Type className="w-5 h-5 text-white" />
                        </div>
                        AI Caption & Bio Generator
                    </h1>
                    <p className="text-gray-500 mt-2 ml-[52px]">
                        Generate captions, bios, taglines & descriptions — with platform character limits enforced
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
                                Recent Generations
                            </h2>
                            {loadingHistory ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                                </div>
                            ) : history.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">No generations yet</p>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                    {history.map((gen) => (
                                        <div
                                            key={gen.id}
                                            onClick={() => loadFromHistory(gen)}
                                            className="group p-3.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {gen.platform} — {gen.content_type}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {gen.brand_name} · {gen.tone}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {formatDate(gen.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={(e) => handleFavorite(gen.id, e)}
                                                        className="p-1.5 rounded-lg hover:bg-white transition"
                                                    >
                                                        <Heart
                                                            className={`w-3.5 h-3.5 ${gen.is_favorite
                                                                ? "fill-red-500 text-red-500"
                                                                : "text-gray-300"
                                                                }`}
                                                        />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/caption-generation/${gen.id}`); }}
                                                        className="p-1.5 rounded-lg hover:bg-emerald-100 transition text-emerald-600"
                                                        title="Open Full View"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(gen.id, e)}
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
    const charLimit = formData.platform && formData.content_type
        ? LIMITS[formData.platform]?.[formData.content_type] || null
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-8"
        >
            {/* 1. Content Type */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">1. What do you want to generate?</legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CONTENT_TYPES.map(({ value, label, desc }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => update("content_type", value)}
                            className={`p-3.5 rounded-xl border text-center transition-all ${formData.content_type === value
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs mt-0.5 opacity-70">{desc}</p>
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* 2. Platform */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">2. Select Platform</legend>
                <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map(({ value, label, icon: Icon, color }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => update("platform", value)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all ${formData.platform === value
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                                <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            {label}
                        </button>
                    ))}
                </div>
                {/* Character limit badge */}
                {charLimit && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        Max <span className="font-semibold text-gray-700">{charLimit}</span> characters for {formData.platform} {formData.content_type}
                    </div>
                )}
            </fieldset>

            {/* 3. Brand Name */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">3. Brand Name</legend>
                <input
                    type="text"
                    value={formData.brand_name}
                    onChange={(e) => update("brand_name", e.target.value)}
                    placeholder="e.g. TechFlow, GreenLeaf Studio, NovaByte…"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
            </fieldset>

            {/* 4. Tone */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">4. Brand Tone</legend>
                <div className="flex flex-wrap gap-2">
                    {TONES.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => update("tone", value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${formData.tone === value
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* 5. Key Points */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">5. Key Points / Context</legend>
                <textarea
                    value={formData.key_points}
                    onChange={(e) => update("key_points", e.target.value)}
                    placeholder="Describe your brand, product, or the message you want to convey…"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
            </fieldset>

            {/* 6. Number of Variations */}
            <fieldset>
                <legend className="text-sm font-semibold text-gray-800 mb-3">6. Number of Variations</legend>
                <div className="flex gap-3">
                    {[3, 4, 5].map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => update("num_variations", n)}
                            className={`w-14 h-11 rounded-xl border text-sm font-semibold transition-all ${formData.num_variations === n
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                                }`}
                        >
                            {n}
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* Submit */}
            <button
                onClick={onSubmit}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-[0.98]"
            >
                <Sparkles className="w-4 h-4" />
                Generate Variations
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-pulse">
                <Type className="w-7 h-7 text-white" />
            </div>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-4" />
        <p className="text-lg font-semibold text-gray-800">Generating your variations…</p>
        <p className="text-sm text-gray-400 mt-1">Crafting unique options with AI</p>
    </motion.div>
);

// ── Results Step ──────────────────────────────────────
const ResultsStep = ({ result, onReset }) => {
    const variations = result.variations || [];
    const charLimit = result.char_limit || 500;
    const [copiedIdx, setCopiedIdx] = useState(null);

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

    const getCharColor = (count) => {
        const ratio = count / charLimit;
        if (ratio <= 0.8) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (ratio <= 1) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                        {variations.length} Variations Ready
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        {result.platform} {result.content_type} · Max {charLimit} chars
                    </p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" />
                    New Generation
                </button>
            </div>

            {/* Variation Cards */}
            <div className="space-y-4">
                {variations.map((v, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow group"
                    >
                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
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
                                <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${getCharColor(v.char_count)}`}>
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
        </motion.div>
    );
};

export default CaptionBioPage;
