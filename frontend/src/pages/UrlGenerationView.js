import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft, Copy, Trash2, Globe, Youtube, Loader2,
    Link2, Target, Megaphone, MessageSquare, ExternalLink,
    CheckCircle2
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/axiosConfig";

const platformIcons = {
    LinkedIn: <FaLinkedin className="w-5 h-5 text-[#0A66C2]" />,
    Twitter: <FaTwitter className="w-5 h-5 text-black" />,
    Instagram: <FaInstagram className="w-5 h-5 text-[#E1306C]" />,
    Facebook: <FaFacebook className="w-5 h-5 text-[#1877F2]" />,
};

const goalLabels = {
    engagement: { label: "Engagement", icon: MessageSquare },
    awareness: { label: "Brand Awareness", icon: Megaphone },
    leads: { label: "Lead Generation", icon: Target },
};

const UrlGenerationView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchGeneration = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/url/generation/${id}`);
                setData(res.data);
            } catch (err) {
                toast.error("Failed to load content");
                navigate("/history");
            } finally {
                setLoading(false);
            }
        };
        fetchGeneration();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (!window.confirm("Delete this generation? This cannot be undone.")) return;
        setDeleting(true);
        try {
            await api.delete(`/api/url/${id}`);
            toast.success("Generation deleted");
            navigate("/history");
        } catch {
            toast.error("Failed to delete");
        } finally {
            setDeleting(false);
        }
    };

    const handleCopyAll = () => {
        if (!data?.final_output) return;
        const output = data.final_output;
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
        toast.success("All content copied!");
    };

    const handleCopySection = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied!");
    };

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
                year: "numeric", hour: "numeric", minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-gray-500">Loading content...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const output = data.final_output || {};
    const analysis = data.analysis || {};
    const GoalIcon = goalLabels[data.goal]?.icon || Target;

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/history")}
                            className="text-gray-600 hover:text-[#111827] rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleCopyAll}
                                variant="outline"
                                className="rounded-xl border-[#E5E7EB]"
                            >
                                <Copy className="w-4 h-4 mr-2" /> Copy All
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={deleting}
                                variant="outline"
                                className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Source Info Card */}
                    <Card className="border-[#E5E7EB] shadow-card mb-6">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${data.url_type === "youtube" ? "bg-red-100" : "bg-blue-100"}`}>
                                    {data.url_type === "youtube"
                                        ? <Youtube className="w-6 h-6 text-red-600" />
                                        : <Globe className="w-6 h-6 text-blue-600" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <Badge className={`border-0 text-xs font-medium ${data.url_type === "youtube" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                            {data.url_type === "youtube" ? "YouTube Video" : "Web Page"}
                                        </Badge>
                                        <span className="text-xs text-gray-400">{formatDate(data.created_at)}</span>
                                    </div>
                                    <a
                                        href={data.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm flex items-center gap-1 break-all"
                                    >
                                        {data.source_url}
                                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                    </a>
                                </div>
                            </div>

                            {/* Meta badges */}
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                                {data.platform && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-sm font-medium text-gray-700">
                                        {platformIcons[data.platform]}
                                        {data.platform}
                                    </div>
                                )}
                                {data.format && (
                                    <Badge variant="outline" className="capitalize text-sm">{data.format?.replace("_", " ")}</Badge>
                                )}
                                {data.tone && (
                                    <Badge className="bg-purple-50 text-purple-600 border-0 text-sm capitalize">{data.tone}</Badge>
                                )}
                                {data.goal && (
                                    <Badge className="bg-green-50 text-green-600 border-0 text-sm capitalize">
                                        <GoalIcon className="w-3 h-3 mr-1" />
                                        {goalLabels[data.goal]?.label || data.goal}
                                    </Badge>
                                )}
                            </div>

                            {data.target_audience && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Target Audience</p>
                                    <p className="text-sm text-[#111827]">{data.target_audience}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* AI Analysis Card */}
                    {analysis.summary && (
                        <Card className="border-[#E5E7EB] shadow-card mb-6">
                            <CardContent className="p-6">
                                <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Link2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                    Content Analysis
                                </h3>

                                <div className="space-y-3">
                                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                        <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Summary</p>
                                        <p className="text-sm text-[#111827]">{analysis.summary}</p>
                                    </div>

                                    {analysis.main_topic && (
                                        <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                                            <p className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-wide">Main Topic</p>
                                            <p className="text-sm text-[#111827] font-medium">{analysis.main_topic}</p>
                                        </div>
                                    )}

                                    {analysis.key_points?.length > 0 && (
                                        <div className="p-3 bg-white border border-[#E5E7EB] rounded-xl">
                                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Key Points</p>
                                            <ul className="space-y-1.5">
                                                {analysis.key_points.map((point, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-[#111827]">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Generated Content Card */}
                    <Card className="border-[#E5E7EB] shadow-card">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                </div>
                                Generated Content
                            </h3>

                            {/* Post format */}
                            {data.format === "post" && (
                                <div className="space-y-4">
                                    {output.hook && (
                                        <ContentSection
                                            label="Hook"
                                            text={output.hook}
                                            color="blue"
                                            onCopy={handleCopySection}
                                        />
                                    )}
                                    {output.body && (
                                        <ContentSection
                                            label="Body"
                                            text={output.body}
                                            color="gray"
                                            onCopy={handleCopySection}
                                        />
                                    )}
                                    {output.cta && (
                                        <ContentSection
                                            label="Call to Action"
                                            text={output.cta}
                                            color="purple"
                                            onCopy={handleCopySection}
                                        />
                                    )}
                                    {output.hashtags && <HashtagsRow hashtags={output.hashtags} />}
                                </div>
                            )}

                            {/* Carousel format */}
                            {data.format === "carousel" && (
                                <div className="space-y-4">
                                    {(output.slides || []).map((slide, i) => (
                                        <div key={i} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-[#E5E7EB] rounded-2xl group/slide">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-xs font-semibold text-gray-500 uppercase">Slide {i + 1}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopySection(slide)}
                                                    className="opacity-0 group-hover/slide:opacity-100 transition-opacity h-7 px-2 text-gray-400 hover:text-gray-700"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <p className="text-[#111827] whitespace-pre-line">{slide}</p>
                                        </div>
                                    ))}
                                    {output.caption && (
                                        <ContentSection label="Caption" text={output.caption} color="gray" onCopy={handleCopySection} />
                                    )}
                                    {output.hashtags && <HashtagsRow hashtags={output.hashtags} />}
                                </div>
                            )}

                            {/* Thread format */}
                            {data.format === "thread" && (
                                <div className="space-y-3">
                                    {(output.tweets || []).map((tweet, i) => (
                                        <div key={i} className="p-4 bg-white border border-[#E5E7EB] rounded-2xl flex gap-3 group/tweet">
                                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[#111827]">{tweet}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className={`text-xs ${tweet.length > 280 ? "text-red-500 font-medium" : "text-gray-400"}`}>
                                                        {tweet.length}/280
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopySection(tweet)}
                                                        className="opacity-0 group-hover/tweet:opacity-100 transition-opacity h-7 px-2 text-gray-400 hover:text-gray-700"
                                                    >
                                                        <Copy className="w-3 h-3 mr-1" /> Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {output.hashtags && <HashtagsRow hashtags={output.hashtags} />}
                                </div>
                            )}

                            {/* Video Script format */}
                            {data.format === "video_script" && (
                                <div className="space-y-4">
                                    {output.hook && (
                                        <ContentSection
                                            label="🎬 Hook (First 3 Seconds)"
                                            text={output.hook}
                                            color="red"
                                            onCopy={handleCopySection}
                                        />
                                    )}
                                    {(output.talking_points || []).length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">💬 Talking Points</p>
                                            {output.talking_points.map((point, i) => (
                                                <div key={i} className="p-3 bg-white border border-[#E5E7EB] rounded-xl flex items-start gap-3 mb-2 group/point">
                                                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-[#111827] flex-1">{point}</p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopySection(point)}
                                                        className="opacity-0 group-hover/point:opacity-100 transition-opacity h-7 px-2 text-gray-400 hover:text-gray-700 flex-shrink-0"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {output.closing_cta && (
                                        <ContentSection
                                            label="🎯 Closing CTA"
                                            text={output.closing_cta}
                                            color="purple"
                                            onCopy={handleCopySection}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Fallback for unknown format */}
                            {!["post", "carousel", "thread", "video_script"].includes(data.format) && (
                                <pre className="p-4 bg-gray-50 rounded-2xl text-sm overflow-auto whitespace-pre-wrap">
                                    {JSON.stringify(output, null, 2)}
                                </pre>
                            )}
                        </CardContent>
                    </Card>

                </motion.div>
            </div>
        </div>
    );
};


// ── Reusable sub-components ──

const colorMap = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", label: "text-blue-600" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", label: "text-purple-600" },
    red: { bg: "bg-red-50", border: "border-red-200", label: "text-red-600" },
    gray: { bg: "bg-white", border: "border-[#E5E7EB]", label: "text-gray-500" },
};

const ContentSection = ({ label, text, color = "gray", onCopy }) => {
    const c = colorMap[color] || colorMap.gray;
    return (
        <div className={`p-4 ${c.bg} border ${c.border} rounded-2xl group/section`}>
            <div className="flex items-center justify-between mb-1">
                <p className={`text-xs font-semibold ${c.label} uppercase tracking-wide`}>{label}</p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(text)}
                    className="opacity-0 group-hover/section:opacity-100 transition-opacity h-7 px-2 text-gray-400 hover:text-gray-700"
                >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                </Button>
            </div>
            <p className="text-[#111827] whitespace-pre-line">{text}</p>
        </div>
    );
};

const HashtagsRow = ({ hashtags }) => (
    <div className="flex flex-wrap gap-2">
        {hashtags.map((tag, i) => (
            <Badge key={i} className="bg-blue-50 text-blue-600 border-0 font-medium cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => { navigator.clipboard.writeText(tag); }}
            >
                {tag}
            </Badge>
        ))}
    </div>
);


export default UrlGenerationView;
