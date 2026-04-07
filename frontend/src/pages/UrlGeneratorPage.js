import { useState } from "react";
import api from "@/lib/axiosConfig";
import { motion, AnimatePresence } from "framer-motion";
import {
    Link2, Sparkles, Eye, Copy, Save, ChevronRight, ChevronLeft,
    Loader2, Globe, Youtube, Target, Megaphone, MessageSquare,
    Palette, CheckCircle2, AlertTriangle, LayoutGrid, FileText,
    Video, Twitter
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const PLATFORMS = [
    { value: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" },
    { value: "Twitter", icon: FaTwitter, color: "#000000" },
    { value: "Instagram", icon: FaInstagram, color: "#E1306C" },
    { value: "Facebook", icon: FaFacebook, color: "#1877F2" },
];

const FORMATS = [
    { value: "post", label: "Post", icon: FileText, description: "Hook + Body + CTA" },
    { value: "carousel", label: "Carousel", icon: LayoutGrid, description: "Multi-slide content" },
    { value: "thread", label: "Thread", icon: Twitter, description: "Multi-tweet thread" },
    { value: "video_script", label: "Video Script", icon: Video, description: "Hook + Talking Points + CTA" },
];

const GOALS = [
    { value: "engagement", label: "Engagement", icon: MessageSquare },
    { value: "awareness", label: "Brand Awareness", icon: Megaphone },
    { value: "leads", label: "Lead Generation", icon: Target },
];

const TONES = [
    { value: "professional", label: "Professional" },
    { value: "friendly", label: "Friendly" },
    { value: "casual", label: "Casual" },
    { value: "inspirational", label: "Inspirational" },
    { value: "humorous", label: "Humorous" },
];


const UrlGeneratorPage = () => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [url, setUrl] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const [generatedResult, setGeneratedResult] = useState(null);
    const [preferences, setPreferences] = useState({
        target_audience: "",
        goal: "engagement",
        platform: "",
        format: "",
        tone: "professional",
    });

    // ── Step 0: Analyze URL ──
    const handleAnalyze = async () => {
        if (!url.trim()) {
            toast.error("Please enter a URL");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("/api/url/analyze", { url: url.trim() });
            setAnalysisResult(response.data);
            setStep(1);
            toast.success("URL analyzed successfully!");
        } catch (error) {
            const msg = error.response?.data?.detail || "Failed to analyze URL. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: Generate Content ──
    const handleGenerate = async () => {
        if (!preferences.target_audience || !preferences.platform || !preferences.format) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                source_url: analysisResult.source_url,
                url_type: analysisResult.url_type,
                extracted_summary: analysisResult.summary,
                analysis: {
                    summary: analysisResult.summary,
                    main_topic: analysisResult.main_topic,
                    key_points: analysisResult.key_points,
                    suggested_formats: analysisResult.suggested_formats,
                    suggested_angles: analysisResult.suggested_angles,
                },
                ...preferences,
            };

            const response = await api.post("/api/url/generate", payload);
            setGeneratedResult(response.data);
            setStep(2);
            toast.success("Content generated successfully!");
        } catch (error) {
            const msg = error.response?.data?.detail || "Failed to generate content. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Copy all output to clipboard ──
    const handleCopy = () => {
        if (!generatedResult?.output) return;
        const output = generatedResult.output;
        let text = "";

        if (output.hook) text += output.hook + "\n\n";
        if (output.body) text += output.body + "\n\n";
        if (output.cta) text += output.cta + "\n\n";
        if (output.slides) text += output.slides.join("\n\n---\n\n") + "\n\n";
        if (output.caption) text += output.caption + "\n\n";
        if (output.tweets) text += output.tweets.join("\n\n") + "\n\n";
        if (output.talking_points) text += output.talking_points.join("\n\n") + "\n\n";
        if (output.closing_cta) text += output.closing_cta + "\n\n";
        if (output.hashtags) text += output.hashtags.join(" ");

        navigator.clipboard.writeText(text.trim());
        toast.success("Copied to clipboard!");
    };

    // ── Reset to start ──
    const handleReset = () => {
        setStep(0);
        setUrl("");
        setAnalysisResult(null);
        setGeneratedResult(null);
        setPreferences({ target_audience: "", goal: "engagement", platform: "", format: "", tone: "professional" });
    };

    // ── Render Output Preview ──
    const renderOutput = (output, format) => {
        if (!output) return null;

        if (format === "post") {
            return (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                        <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Hook</p>
                        <p className="text-[#111827] font-medium">{output.hook}</p>
                    </div>
                    <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl">
                        <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Body</p>
                        <p className="text-[#111827] whitespace-pre-line">{output.body}</p>
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                        <p className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-wide">Call to Action</p>
                        <p className="text-[#111827] font-medium">{output.cta}</p>
                    </div>
                    {output.hashtags && (
                        <div className="flex flex-wrap gap-2">
                            {output.hashtags.map((tag, i) => (
                                <Badge key={i} className="bg-brand-blue/10 text-brand-blue border-0 font-medium">{tag}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (format === "carousel") {
            return (
                <div className="space-y-4">
                    <div className="grid gap-3">
                        {(output.slides || []).map((slide, i) => (
                            <div key={i} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-[#E5E7EB] rounded-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 rounded-full bg-brand-gradient text-white flex items-center justify-center text-xs font-bold shadow-brand">
                                        {i + 1}
                                    </div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Slide {i + 1}</p>
                                </div>
                                <p className="text-[#111827] whitespace-pre-line">{slide}</p>
                            </div>
                        ))}
                    </div>
                    {output.caption && (
                        <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl">
                            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Caption</p>
                            <p className="text-[#111827]">{output.caption}</p>
                        </div>
                    )}
                    {output.hashtags && (
                        <div className="flex flex-wrap gap-2">
                            {output.hashtags.map((tag, i) => (
                                <Badge key={i} className="bg-brand-blue/10 text-brand-blue border-0 font-medium">{tag}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (format === "thread") {
            return (
                <div className="space-y-3">
                    {(output.tweets || []).map((tweet, i) => (
                        <div key={i} className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex gap-3">
                            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {i + 1}
                            </div>
                            <div>
                                <p className="text-[#111827]">{tweet}</p>
                                <p className="text-xs text-gray-400 mt-1">{tweet.length}/280</p>
                            </div>
                        </div>
                    ))}
                    {output.hashtags && (
                        <div className="flex flex-wrap gap-2">
                            {output.hashtags.map((tag, i) => (
                                <Badge key={i} className="bg-gray-100 text-gray-700 border-0 font-medium">{tag}</Badge>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (format === "video_script") {
            return (
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                        <p className="text-xs font-semibold text-red-600 mb-1 uppercase tracking-wide">🎬 Hook (First 3 Seconds)</p>
                        <p className="text-[#111827] font-medium">{output.hook}</p>
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">💬 Talking Points</p>
                        {(output.talking_points || []).map((point, i) => (
                            <div key={i} className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-[#111827]">{point}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                        <p className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-wide">🎯 Closing CTA</p>
                        <p className="text-[#111827] font-medium">{output.closing_cta}</p>
                    </div>
                </div>
            );
        }

        // Fallback: render raw JSON
        return (
            <pre className="p-4 bg-gray-50 rounded-2xl text-sm overflow-auto">
                {JSON.stringify(output, null, 2)}
            </pre>
        );
    };


    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h2 className="text-4xl font-bold tracking-tighter mb-3">URL Content Repurposer</h2>
                        <p className="text-[#6B7280]">Paste a URL — we'll extract content and generate platform-ready posts</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {["Analyze", "Customize", "Result"].map((label, s) => (
                            <div key={s} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step >= s ? "bg-brand-gradient text-white shadow-brand" : "bg-[#E5E7EB] text-[#6B7280]"
                                        }`}>
                                        {step > s ? <CheckCircle2 className="w-4 h-4" /> : s + 1}
                                    </div>
                                    <span className="text-xs text-[#6B7280] mt-1 hidden sm:block">{label}</span>
                                </div>
                                {s < 2 && <div className={`w-16 h-0.5 transition-all duration-300 mx-2 ${step > s ? "bg-brand-blue" : "bg-[#E5E7EB]"}`} />}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">

                        {/* ════════════ STEP 0: URL Input ════════════ */}
                        {step === 0 && (
                            <motion.div key="step-0" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <Card className="border-[#E5E7EB] shadow-card">
                                    <CardContent className="p-8">
                                        <div className="flex items-start gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                                                <Link2 className="w-5 h-5 text-brand-blue" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-semibold mb-1">Paste Your URL</h3>
                                                <p className="text-[#6B7280] text-sm">YouTube video, blog article, news page, or documentation</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="url-input" className="text-sm font-medium text-[#111827] mb-1.5 block">URL</Label>
                                                <Input
                                                    id="url-input"
                                                    data-testid="url-input"
                                                    placeholder="https://www.youtube.com/watch?v=... or https://blog.example.com/article"
                                                    value={url}
                                                    onChange={(e) => setUrl(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                                                    className="h-12 rounded-xl border-[#E5E7EB] bg-[#F5F7FB] focus:bg-white focus:ring-2 focus:ring-brand-blue/20 text-base"
                                                />
                                            </div>

                                            <div className="flex gap-3 text-xs text-[#6B7280]">
                                                <span className="flex items-center gap-1"><Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube</span>
                                                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-blue-500" /> Blog / Article</span>
                                                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-green-500" /> News / Docs</span>
                                            </div>
                                        </div>

                                        <Button
                                            data-testid="analyze-btn"
                                            onClick={handleAnalyze}
                                            disabled={loading || !url.trim()}
                                            className="w-full h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium transition-all active:scale-[0.98] shadow-brand mt-6"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Analyze URL
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* ════════════ STEP 1: Analysis + Preferences ════════════ */}
                        {step === 1 && analysisResult && (
                            <motion.div key="step-1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <Card className="border-[#E5E7EB] shadow-card">
                                    <CardContent className="p-8 space-y-6">

                                        {/* Analysis Summary */}
                                        <div>
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <Eye className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-semibold mb-1">Content Analysis</h3>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={`border-0 font-medium ${analysisResult.url_type === "youtube" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                                            {analysisResult.url_type === "youtube" ? "YouTube Video" : "Web Page"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                                    <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Summary</p>
                                                    <p className="text-[#111827] text-sm">{analysisResult.summary}</p>
                                                </div>

                                                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
                                                    <p className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-wide">Main Topic</p>
                                                    <p className="text-[#111827] text-sm font-medium">{analysisResult.main_topic}</p>
                                                </div>

                                                <div className="p-4 bg-white border border-[#E5E7EB] rounded-2xl">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Key Points</p>
                                                    <ul className="space-y-1.5">
                                                        {analysisResult.key_points.map((point, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-[#111827]">
                                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                                {point}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {analysisResult.suggested_angles?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase w-full mb-1">Suggested Angles</span>
                                                        {analysisResult.suggested_angles.map((angle, i) => (
                                                            <Badge key={i} variant="outline" className="text-xs font-medium">{angle}</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <hr className="border-[#E5E7EB]" />

                                        {/* User Preferences */}
                                        <div>
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                                                    <Palette className="w-5 h-5 text-brand-purple" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold mb-1">Customize Output</h3>
                                                    <p className="text-[#6B7280] text-sm">Select your preferences for the generated content</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Target Audience */}
                                                <div>
                                                    <Label className="text-sm font-medium text-[#111827] mb-1.5 block">Target Audience</Label>
                                                    <Textarea
                                                        data-testid="url-target-audience"
                                                        placeholder="e.g., Tech professionals, startup founders, marketing managers"
                                                        value={preferences.target_audience}
                                                        onChange={(e) => setPreferences({ ...preferences, target_audience: e.target.value })}
                                                        className="min-h-20 rounded-xl border-[#E5E7EB] bg-[#F5F7FB] focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                                                    />
                                                </div>

                                                {/* Goal */}
                                                <div>
                                                    <Label className="text-sm font-medium text-[#111827] mb-1.5 block">Goal</Label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {GOALS.map(({ value, label, icon: Icon }) => (
                                                            <div
                                                                key={value}
                                                                onClick={() => setPreferences({ ...preferences, goal: value })}
                                                                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center ${preferences.goal === value
                                                                    ? "border-brand-blue bg-brand-blue/5 shadow-brand"
                                                                    : "border-[#E5E7EB] hover:border-brand-blue/30"
                                                                    }`}
                                                                data-testid={`goal-${value}`}
                                                            >
                                                                <Icon className={`w-5 h-5 mx-auto mb-1 ${preferences.goal === value ? "text-brand-blue" : "text-gray-400"}`} />
                                                                <p className="text-xs font-medium">{label}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Platform */}
                                                <div>
                                                    <Label className="text-sm font-medium text-[#111827] mb-1.5 block">Platform</Label>
                                                    <div className="grid grid-cols-4 gap-3">
                                                        {PLATFORMS.map(({ value, icon: Icon, color }) => (
                                                            <div
                                                                key={value}
                                                                onClick={() => setPreferences({ ...preferences, platform: value })}
                                                                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center ${preferences.platform === value
                                                                    ? "border-brand-blue bg-brand-blue/5 shadow-brand"
                                                                    : "border-[#E5E7EB] hover:border-brand-blue/30"
                                                                    }`}
                                                                data-testid={`platform-${value}`}
                                                            >
                                                                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color }} />
                                                                <p className="text-xs font-medium">{value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Format */}
                                                <div>
                                                    <Label className="text-sm font-medium text-[#111827] mb-1.5 block">Content Format</Label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {FORMATS.map(({ value, label, icon: Icon, description }) => (
                                                            <div
                                                                key={value}
                                                                onClick={() => setPreferences({ ...preferences, format: value })}
                                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${preferences.format === value
                                                                    ? "border-brand-purple bg-brand-purple/5"
                                                                    : "border-[#E5E7EB] hover:border-brand-purple/30"
                                                                    }`}
                                                                style={preferences.format === value ? { boxShadow: '0 4px 14px -3px rgba(123,44,191,0.2)' } : {}}
                                                                data-testid={`format-${value}`}
                                                            >
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Icon className={`w-4 h-4 ${preferences.format === value ? "text-brand-purple" : "text-gray-400"}`} />
                                                                    <span className="text-sm font-semibold">{label}</span>
                                                                </div>
                                                                <p className="text-xs text-[#6B7280]">{description}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Tone */}
                                                <div>
                                                    <Label className="text-sm font-medium text-[#111827] mb-1.5 block">Tone</Label>
                                                    <Select value={preferences.tone} onValueChange={(v) => setPreferences({ ...preferences, tone: v })}>
                                                        <SelectTrigger data-testid="url-tone-select" className="h-11 rounded-xl border-[#E5E7EB] bg-[#F5F7FB]">
                                                            <SelectValue placeholder="Select tone" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {TONES.map(({ value, label }) => (
                                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3">
                                            <Button
                                                data-testid="url-step1-back"
                                                onClick={() => setStep(0)}
                                                variant="outline"
                                                className="flex-1 h-12 rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F5F7FB]"
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-2" /> Back
                                            </Button>
                                            <Button
                                                data-testid="url-generate-btn"
                                                onClick={handleGenerate}
                                                disabled={loading || !preferences.target_audience || !preferences.platform || !preferences.format}
                                                className="flex-1 h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium transition-all active:scale-[0.98] shadow-brand"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Generate Content
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* ════════════ STEP 2: Generated Result ════════════ */}
                        {step === 2 && generatedResult && (
                            <motion.div key="step-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <Card className="border-[#E5E7EB] shadow-card">
                                    <CardContent className="p-8 space-y-6">

                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-semibold mb-1">Generated Content</h3>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-brand-blue/10 text-brand-blue border-0">{generatedResult.platform}</Badge>
                                                        <Badge variant="outline">{generatedResult.format}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Output Preview */}
                                        {renderOutput(generatedResult.output, generatedResult.format)}

                                        {/* Actions */}
                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                data-testid="url-copy-btn"
                                                onClick={handleCopy}
                                                variant="outline"
                                                className="flex-1 h-12 rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F5F7FB]"
                                            >
                                                <Copy className="w-4 h-4 mr-2" /> Copy All
                                            </Button>
                                            <Button
                                                data-testid="url-new-btn"
                                                onClick={handleReset}
                                                className="flex-1 h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium shadow-brand"
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" /> Create Another
                                            </Button>
                                        </div>

                                        {/* Back to customize */}
                                        <Button
                                            data-testid="url-step2-back"
                                            onClick={() => setStep(1)}
                                            variant="ghost"
                                            className="w-full text-[#6B7280] hover:text-[#111827]"
                                        >
                                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Customize
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default UrlGeneratorPage;
