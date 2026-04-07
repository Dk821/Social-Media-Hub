import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, Trash2, Heart, ExternalLink, SortAsc, SortDesc,
    Filter, ChevronDown, Loader2, Search, Clock, BarChart3,
    Link2, Globe, Youtube, Copy, Eye, Users, Type
} from "lucide-react";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/axiosConfig";

const platformIcons = {
    LinkedIn: <FaLinkedin className="w-3.5 h-3.5 text-[#0A66C2]" />,
    Twitter: <FaTwitter className="w-3.5 h-3.5 text-black" />,
    Instagram: <FaInstagram className="w-3.5 h-3.5 text-[#E1306C]" />,
    Facebook: <FaFacebook className="w-3.5 h-3.5 text-[#1877F2]" />,
};

const HistoryPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("calendars");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("newest");
    const [filterBy, setFilterBy] = useState("all");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [deleting, setDeleting] = useState(null);

    // URL generations state
    const [urlItems, setUrlItems] = useState([]);
    const [urlLoading, setUrlLoading] = useState(true);
    const [urlTotal, setUrlTotal] = useState(0);
    const [urlDeleting, setUrlDeleting] = useState(null);
    const [urlFilterBy, setUrlFilterBy] = useState("all");

    // Engagement plans state
    const [engagementItems, setEngagementItems] = useState([]);
    const [engagementLoading, setEngagementLoading] = useState(true);
    const [engagementTotal, setEngagementTotal] = useState(0);
    const [engagementDeleting, setEngagementDeleting] = useState(null);
    const [engagementFilterBy, setEngagementFilterBy] = useState("all");
    const [engagementPage, setEngagementPage] = useState(1);
    const [engagementHasMore, setEngagementHasMore] = useState(false);

    // Caption generations state
    const [captionItems, setCaptionItems] = useState([]);
    const [captionLoading, setCaptionLoading] = useState(true);
    const [captionTotal, setCaptionTotal] = useState(0);
    const [captionDeleting, setCaptionDeleting] = useState(null);
    const [captionFilterBy, setCaptionFilterBy] = useState("all");
    const [captionPage, setCaptionPage] = useState(1);
    const [captionHasMore, setCaptionHasMore] = useState(false);

    // ── Calendar History ──
    const fetchHistory = useCallback(async (resetItems = false) => {
        try {
            setLoading(true);
            const currentPage = resetItems ? 1 : page;
            const res = await api.get("/api/history", {
                params: { page: currentPage, limit: 12, sort: sortBy, filter_by: filterBy },
            });
            const data = res.data;
            if (resetItems) {
                setItems(data.items);
                setPage(1);
            } else {
                setItems((prev) => currentPage === 1 ? data.items : [...prev, ...data.items]);
            }
            setHasMore(data.has_more);
            setTotal(data.total);
        } catch (err) {
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    }, [page, sortBy, filterBy]);

    useEffect(() => {
        fetchHistory(true);
    }, [sortBy, filterBy, fetchHistory]);

    const loadMore = () => {
        setPage((p) => p + 1);
    };

    useEffect(() => {
        if (page > 1) fetchHistory(false);
    }, [page, fetchHistory]);

    // ── URL Generation History ──
    const fetchUrlHistory = useCallback(async () => {
        try {
            setUrlLoading(true);
            const res = await api.get("/api/url/history");
            setUrlItems(res.data.items || []);
            setUrlTotal(res.data.total || 0);
        } catch (err) {
            toast.error("Failed to load URL history");
        } finally {
            setUrlLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "url") {
            fetchUrlHistory();
        }
    }, [activeTab, fetchUrlHistory]);

    // ── Engagement Plan History ──
    const fetchEngagementHistory = useCallback(async (resetItems = false) => {
        try {
            setEngagementLoading(true);
            const currentPage = resetItems ? 1 : engagementPage;
            const res = await api.get("/api/community/plans", {
                params: {
                    page: currentPage,
                    limit: 12,
                    sort: sortBy === "most_posts" ? "newest" : sortBy, // Engagement doesn't have most_posts sort
                    filter_by: engagementFilterBy
                },
            });
            const data = res.data;
            if (resetItems) {
                setEngagementItems(data.items);
                setEngagementPage(1);
            } else {
                setEngagementItems((prev) => currentPage === 1 ? data.items : [...prev, ...data.items]);
            }
            setEngagementHasMore(data.has_more);
            setEngagementTotal(data.total);
        } catch (err) {
            toast.error("Failed to load engagement history");
        } finally {
            setEngagementLoading(false);
        }
    }, [engagementPage, sortBy, engagementFilterBy]);

    useEffect(() => {
        if (activeTab === "engagement") {
            fetchEngagementHistory(true);
        }
    }, [activeTab, sortBy, engagementFilterBy, fetchEngagementHistory]);

    const loadMoreEngagement = () => {
        setEngagementPage((p) => p + 1);
    };

    useEffect(() => {
        if (activeTab === "engagement" && engagementPage > 1) {
            fetchEngagementHistory(false);
        }
    }, [engagementPage, activeTab, fetchEngagementHistory]);

    // ── Caption Generation History ──
    const fetchCaptionHistory = useCallback(async (resetItems = false) => {
        try {
            setCaptionLoading(true);
            const currentPage = resetItems ? 1 : captionPage;
            const res = await api.get("/api/caption/history", {
                params: {
                    page: currentPage,
                    limit: 12,
                    sort: sortBy === "most_posts" ? "newest" : sortBy,
                    filter_by: captionFilterBy
                },
            });
            const data = res.data;
            if (resetItems) {
                setCaptionItems(data.items);
                setCaptionPage(1);
            } else {
                setCaptionItems((prev) => currentPage === 1 ? data.items : [...prev, ...data.items]);
            }
            setCaptionHasMore(data.has_more);
            setCaptionTotal(data.total);
        } catch (err) {
            toast.error("Failed to load caption history");
        } finally {
            setCaptionLoading(false);
        }
    }, [captionPage, sortBy, captionFilterBy]);

    useEffect(() => {
        if (activeTab === "captions") {
            fetchCaptionHistory(true);
        }
    }, [activeTab, sortBy, captionFilterBy, fetchCaptionHistory]);

    const loadMoreCaptions = () => {
        setCaptionPage((p) => p + 1);
    };

    useEffect(() => {
        if (activeTab === "captions" && captionPage > 1) {
            fetchCaptionHistory(false);
        }
    }, [captionPage, activeTab, fetchCaptionHistory]);

    // ── Calendar Actions ──
    const handleFavorite = async (calendarId) => {
        try {
            const res = await api.post(`/api/calendar/${calendarId}/favorite`);
            setItems((prev) =>
                prev.map((item) =>
                    item.id === calendarId ? { ...item, is_favorite: res.data.is_favorite } : item
                )
            );
            toast.success(res.data.is_favorite ? "Added to favorites ❤️" : "Removed from favorites");
        } catch {
            toast.error("Failed to update favorite");
        }
    };

    const handleDelete = async (calendarId) => {
        if (!window.confirm("Are you sure you want to delete this calendar? This cannot be undone.")) return;
        setDeleting(calendarId);
        try {
            await api.delete(`/api/calendar/${calendarId}`);
            setItems((prev) => prev.filter((item) => item.id !== calendarId));
            setTotal((t) => t - 1);
            toast.success("Calendar deleted");
        } catch {
            toast.error("Failed to delete calendar");
        } finally {
            setDeleting(null);
        }
    };

    // ── URL Generation Actions ──
    const handleFavoriteUrl = async (genId) => {
        try {
            const res = await api.post(`/api/url/${genId}/favorite`);
            setUrlItems((prev) =>
                prev.map((item) =>
                    item.id === genId ? { ...item, is_favorite: res.data.is_favorite } : item
                )
            );
            toast.success(res.data.is_favorite ? "Added to favorites ❤️" : "Removed from favorites");
        } catch {
            toast.error("Failed to update favorite");
        }
    };

    const handleDeleteUrl = async (genId) => {
        if (!window.confirm("Delete this URL generation? This cannot be undone.")) return;
        setUrlDeleting(genId);
        try {
            await api.delete(`/api/url/${genId}`);
            setUrlItems((prev) => prev.filter((item) => item.id !== genId));
            setUrlTotal((t) => t - 1);
            toast.success("URL generation deleted");
        } catch {
            toast.error("Failed to delete");
        } finally {
            setUrlDeleting(null);
        }
    };

    // ── Engagement Plan Actions ──
    const handleFavoriteEngagement = async (planId) => {
        try {
            const res = await api.post(`/api/community/plan/${planId}/favorite`);
            setEngagementItems((prev) =>
                prev.map((item) =>
                    item.id === planId ? { ...item, is_favorite: res.data.is_favorite } : item
                )
            );
            toast.success(res.data.is_favorite ? "Added to favorites ❤️" : "Removed from favorites");
        } catch {
            toast.error("Failed to update favorite");
        }
    };

    const handleDeleteEngagement = async (planId) => {
        if (!window.confirm("Delete this engagement plan? This cannot be undone.")) return;
        setEngagementDeleting(planId);
        try {
            await api.delete(`/api/community/plan/${planId}`);
            setEngagementItems((prev) => prev.filter((item) => item.id !== planId));
            setEngagementTotal((t) => t - 1);
            toast.success("Engagement plan deleted");
        } catch {
            toast.error("Failed to delete");
        } finally {
            setEngagementDeleting(null);
        }
    };

    const handleCopyUrlOutput = (item) => {
        const output = item.final_output;
        if (!output) return;

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

    // ── Caption Generation Actions ──
    const handleFavoriteCaption = async (genId) => {
        try {
            const res = await api.post(`/api/caption/${genId}/favorite`);
            setCaptionItems((prev) =>
                prev.map((item) =>
                    item.id === genId ? { ...item, is_favorite: res.data.is_favorite } : item
                )
            );
            toast.success(res.data.is_favorite ? "Added to favorites ❤️" : "Removed from favorites");
        } catch {
            toast.error("Failed to update favorite");
        }
    };

    const handleDeleteCaption = async (genId) => {
        if (!window.confirm("Delete this caption generation? This cannot be undone.")) return;
        setCaptionDeleting(genId);
        try {
            await api.delete(`/api/caption/${genId}`);
            setCaptionItems((prev) => prev.filter((item) => item.id !== genId));
            setCaptionTotal((t) => t - 1);
            toast.success("Caption generation deleted");
        } catch {
            toast.error("Failed to delete");
        } finally {
            setCaptionDeleting(null);
        }
    };

    const handleCopyCaptionVariation = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    // ── Helpers ──
    const getPlatforms = (posts = []) => {
        const platforms = [...new Set(posts.map((p) => p.platform))];
        return platforms;
    };

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        } catch {
            return dateStr;
        }
    };

    const getOutputPreview = (item) => {
        const output = item.final_output;
        if (!output) return "No content generated";
        if (output.hook) return output.hook;
        if (output.slides?.[0]) return output.slides[0];
        if (output.tweets?.[0]) return output.tweets[0];
        return "Content generated";
    };

    const getEngagementGoalLabel = (goal) => {
        const goals = {
            engagement: "Engagement",
            brand_awareness: "Brand Awareness",
            lead_generation: "Lead Generation",
            community_building: "Community Building"
        };
        return goals[goal] || goal?.replace(/_/g, " ");
    };

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#111827] tracking-tight flex items-center gap-2">
                            <Clock className="w-8 h-8 text-blue-600" />
                            Content History
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {activeTab === "calendars"
                                ? `${total} calendar${total !== 1 ? "s" : ""} generated`
                                : activeTab === "url"
                                    ? `${urlTotal} URL generation${urlTotal !== 1 ? "s" : ""}`
                                    : activeTab === "captions"
                                        ? `${captionTotal} caption generation${captionTotal !== 1 ? "s" : ""}`
                                        : `${engagementTotal} engagement plan${engagementTotal !== 1 ? "s" : ""}`
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {activeTab !== "url" && (
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="h-10 w-[160px] rounded-xl border-[#E5E7EB] bg-white text-sm">
                                    <div className="flex items-center gap-2">
                                        <SortAsc className="w-4 h-4 text-gray-500" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    {activeTab === "calendars" && <SelectItem value="most_posts">Most Posts</SelectItem>}
                                </SelectContent>
                            </Select>
                        )}
                        <Select
                            value={activeTab === "calendars" ? filterBy : activeTab === "url" ? urlFilterBy : activeTab === "captions" ? captionFilterBy : engagementFilterBy}
                            onValueChange={activeTab === "calendars" ? setFilterBy : activeTab === "url" ? setUrlFilterBy : activeTab === "captions" ? setCaptionFilterBy : setEngagementFilterBy}
                        >
                            <SelectTrigger className="h-10 w-[160px] rounded-xl border-[#E5E7EB] bg-white text-sm">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-500" />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {activeTab === "calendars" ? "All Calendars" : activeTab === "url" ? "All Generations" : activeTab === "captions" ? "All Captions" : "All Plans"}
                                </SelectItem>
                                <SelectItem value="favorites">Favorites Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 border border-[#E5E7EB] w-fit">
                    <button
                        onClick={() => setActiveTab("calendars")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "calendars"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Calendars
                        {total > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "calendars" ? "bg-white/20" : "bg-gray-200"}`}>
                                {total}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("engagement")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "engagement"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Engagement Plans
                        {engagementTotal > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "engagement" ? "bg-white/20" : "bg-gray-200"}`}>
                                {engagementTotal}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("url")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "url"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <Link2 className="w-4 h-4" />
                        URL Generations
                        {urlTotal > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "url" ? "bg-white/20" : "bg-gray-200"}`}>
                                {urlTotal}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("captions")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "captions"
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <Type className="w-4 h-4" />
                        Captions
                        {captionTotal > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "captions" ? "bg-white/20" : "bg-gray-200"}`}>
                                {captionTotal}
                            </span>
                        )}
                    </button>
                </div>

                {/* ═══════ TAB: Calendars ═══════ */}
                {activeTab === "calendars" && (
                    <>
                        {loading && items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                                <p>Loading your history...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Calendar className="w-16 h-16 mb-4 text-gray-300" />
                                <h3 className="text-xl font-semibold text-gray-500 mb-2">No calendars yet</h3>
                                <p className="text-gray-400 mb-6">Generate your first content calendar to see it here</p>
                                <Button
                                    onClick={() => navigate("/")}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-6"
                                >
                                    Create Calendar
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <AnimatePresence>
                                        {items.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all group"
                                            >
                                                <div className="p-5">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-[#111827] truncate text-lg">
                                                                {item.strategy?.brand_name || "Untitled"}
                                                            </h3>
                                                            <p className="text-gray-500 text-xs mt-0.5">
                                                                {formatDate(item.created_at)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleFavorite(item.id)}
                                                            className="ml-2 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                        >
                                                            <Heart
                                                                className={`w-5 h-5 transition-all ${item.is_favorite
                                                                    ? "fill-red-500 text-red-500"
                                                                    : "text-gray-300 hover:text-red-400"
                                                                    }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-4 mb-3">
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                            <BarChart3 className="w-3.5 h-3.5" />
                                                            {item.posts?.length || 0} posts
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {item.strategy?.duration_days || 7} days
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        {getPlatforms(item.posts).map((p) => (
                                                            <div
                                                                key={p}
                                                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600"
                                                            >
                                                                {platformIcons[p]}
                                                                {p}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                        {item.strategy?.industry && (
                                                            <Badge className="bg-blue-50 text-blue-600 border-0 text-xs">
                                                                {item.strategy.industry}
                                                            </Badge>
                                                        )}
                                                        {item.strategy?.tone && (
                                                            <Badge className="bg-purple-50 text-purple-600 border-0 text-xs capitalize">
                                                                {item.strategy.tone}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                        <Button
                                                            onClick={() => navigate(`/calendar/${item.id}`)}
                                                            className="flex-1 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                            Open
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleDelete(item.id)}
                                                            disabled={deleting === item.id}
                                                            className="h-9 w-9 p-0 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            {deleting === item.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {hasMore && (
                                    <div className="flex justify-center mt-8">
                                        <Button
                                            onClick={loadMore}
                                            disabled={loading}
                                            variant="outline"
                                            className="rounded-xl px-8 border-[#E5E7EB]"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 mr-2" />
                                            )}
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ═══════ TAB: Engagement Plans ═══════ */}
                {activeTab === "engagement" && (
                    <>
                        {engagementLoading && engagementItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                                <p>Loading engagement plans...</p>
                            </div>
                        ) : engagementItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Users className="w-16 h-16 mb-4 text-gray-300" />
                                <h3 className="text-xl font-semibold text-gray-500 mb-2">No engagement plans yet</h3>
                                <p className="text-gray-400 mb-6">Generate your first engagement plan to see it here</p>
                                <Button
                                    onClick={() => navigate("/engagement-planner")}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-6"
                                >
                                    Create Engagement Plan
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <AnimatePresence>
                                        {engagementItems.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all group"
                                            >
                                                <div className="p-5">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-[#111827] truncate text-lg">
                                                                {getEngagementGoalLabel(item.goal)}
                                                            </h3>
                                                            <p className="text-gray-500 text-xs mt-0.5">
                                                                {formatDate(item.created_at)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleFavoriteEngagement(item.id)}
                                                            className="ml-2 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                        >
                                                            <Heart
                                                                className={`w-5 h-5 transition-all ${item.is_favorite
                                                                    ? "fill-red-500 text-red-500"
                                                                    : "text-gray-300 hover:text-red-400"
                                                                    }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">
                                                            {platformIcons[item.platform]}
                                                            {item.platform}
                                                        </div>
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {item.content_length}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                        {item.industry && (
                                                            <Badge className="bg-blue-50 text-blue-600 border-0 text-xs">
                                                                {item.industry}
                                                            </Badge>
                                                        )}
                                                        {item.tone && (
                                                            <Badge className="bg-purple-50 text-purple-600 border-0 text-xs capitalize">
                                                                {item.tone}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                        <Button
                                                            onClick={() => navigate(`/engagement-plan/${item.id}`)}
                                                            className="flex-1 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                            Open
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleDeleteEngagement(item.id)}
                                                            disabled={engagementDeleting === item.id}
                                                            className="h-9 w-9 p-0 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            {engagementDeleting === item.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {engagementHasMore && (
                                    <div className="flex justify-center mt-8">
                                        <Button
                                            onClick={loadMoreEngagement}
                                            disabled={engagementLoading}
                                            variant="outline"
                                            className="rounded-xl px-8 border-[#E5E7EB]"
                                        >
                                            {engagementLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 mr-2" />
                                            )}
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ═══════ TAB: URL Generations ═══════ */}
                {activeTab === "url" && (
                    <>
                        {urlLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                                <p>Loading URL generations...</p>
                            </div>
                        ) : urlItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Link2 className="w-16 h-16 mb-4 text-gray-300" />
                                <h3 className="text-xl font-semibold text-gray-500 mb-2">No URL generations yet</h3>
                                <p className="text-gray-400 mb-6">Repurpose content from a URL to see it here</p>
                                <Button
                                    onClick={() => navigate("/url-generator")}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-6"
                                >
                                    <Link2 className="w-4 h-4 mr-2" />
                                    Repurpose a URL
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {(urlFilterBy === "favorites" ? urlItems.filter(i => i.is_favorite) : urlItems).map((item, idx) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all group"
                                        >
                                            <div className="p-5">
                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {item.url_type === "youtube" ? (
                                                                <Youtube className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                            ) : (
                                                                <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                            )}
                                                            <Badge className={`border-0 text-xs font-medium ${item.url_type === "youtube" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                                                {item.url_type === "youtube" ? "YouTube" : "Web"}
                                                            </Badge>
                                                        </div>
                                                        <a
                                                            href={item.source_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:underline truncate block"
                                                            title={item.source_url}
                                                        >
                                                            {item.source_url?.length > 45
                                                                ? item.source_url.substring(0, 45) + "..."
                                                                : item.source_url}
                                                        </a>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            {formatDate(item.created_at)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleFavoriteUrl(item.id)}
                                                        className="ml-2 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        <Heart
                                                            className={`w-5 h-5 transition-all ${item.is_favorite
                                                                ? "fill-red-500 text-red-500"
                                                                : "text-gray-300 hover:text-red-400"
                                                                }`}
                                                        />
                                                    </button>
                                                </div>

                                                {/* Platform + Format */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    {item.platform && (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">
                                                            {platformIcons[item.platform]}
                                                            {item.platform}
                                                        </div>
                                                    )}
                                                    {item.format && (
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {item.format?.replace("_", " ")}
                                                        </Badge>
                                                    )}
                                                    {item.tone && (
                                                        <Badge className="bg-purple-50 text-purple-600 border-0 text-xs capitalize">
                                                            {item.tone}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Content preview */}
                                                <div className="p-3 bg-gray-50 rounded-xl mb-4">
                                                    <p className="text-xs text-gray-600 line-clamp-3">
                                                        {getOutputPreview(item)}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                    <Button
                                                        onClick={() => navigate(`/url-generation/${item.id}`)}
                                                        className="flex-1 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                        Open
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleCopyUrlOutput(item)}
                                                        className="h-9 w-9 p-0 rounded-xl border-[#E5E7EB] text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleDeleteUrl(item.id)}
                                                        disabled={urlDeleting === item.id}
                                                        className="h-9 w-9 p-0 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        {urlDeleting === item.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {/* ═══════ TAB: Captions ═══════ */}
                {activeTab === "captions" && (
                    <>
                        {captionLoading && captionItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                                <p>Loading caption generations...</p>
                            </div>
                        ) : captionItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                                <Type className="w-16 h-16 mb-4 text-gray-300" />
                                <h3 className="text-xl font-semibold text-gray-500 mb-2">No caption generations yet</h3>
                                <p className="text-gray-400 mb-6">Generate captions or bios to see them here</p>
                                <Button
                                    onClick={() => navigate("/caption-generator")}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-6"
                                >
                                    <Type className="w-4 h-4 mr-2" />
                                    Generate Captions
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <AnimatePresence>
                                        {captionItems.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all group"
                                            >
                                                <div className="p-5">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-[#111827] truncate text-lg">
                                                                {item.brand_name || "Untitled"}
                                                            </h3>
                                                            <p className="text-gray-500 text-xs mt-0.5">
                                                                {formatDate(item.created_at)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleFavoriteCaption(item.id)}
                                                            className="ml-2 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                        >
                                                            <Heart
                                                                className={`w-5 h-5 transition-all ${item.is_favorite
                                                                    ? "fill-red-500 text-red-500"
                                                                    : "text-gray-300 hover:text-red-400"
                                                                    }`}
                                                            />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">
                                                            {platformIcons[item.platform]}
                                                            {item.platform}
                                                        </div>
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {item.content_type}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                        {item.tone && (
                                                            <Badge className="bg-emerald-50 text-emerald-600 border-0 text-xs capitalize">
                                                                {item.tone}
                                                            </Badge>
                                                        )}
                                                        <Badge className="bg-blue-50 text-blue-600 border-0 text-xs">
                                                            {item.variations?.length || 0} variations
                                                        </Badge>
                                                        <Badge className="bg-gray-50 text-gray-600 border-0 text-xs">
                                                            ≤{item.char_limit} chars
                                                        </Badge>
                                                    </div>

                                                    {/* Preview first variation */}
                                                    {item.variations?.[0]?.text && (
                                                        <div className="p-3 bg-gray-50 rounded-xl mb-4">
                                                            <p className="text-xs text-gray-600 line-clamp-3">
                                                                {item.variations[0].text}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                        <Button
                                                            onClick={() => navigate(`/caption-generation/${item.id}`)}
                                                            className="flex-1 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                            Open
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleDeleteCaption(item.id)}
                                                            disabled={captionDeleting === item.id}
                                                            className="h-9 w-9 p-0 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            {captionDeleting === item.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {captionHasMore && (
                                    <div className="flex justify-center mt-8">
                                        <Button
                                            onClick={loadMoreCaptions}
                                            disabled={captionLoading}
                                            variant="outline"
                                            className="rounded-xl px-8 border-[#E5E7EB]"
                                        >
                                            {captionLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 mr-2" />
                                            )}
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
