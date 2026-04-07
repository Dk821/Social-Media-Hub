import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/axiosConfig";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Download, RefreshCw, Filter, Calendar as CalendarIcon, Edit2, Check, Copy, Hash, Sparkles, Clock, Smile, CheckCircle2, Circle, Send, X, ChevronDown } from "lucide-react";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Platform character limits
const PLATFORM_CHARACTER_LIMITS = {
  LinkedIn: { recommended: 1300, max: 3000 },
  Twitter: { recommended: 280, max: 280 },
  Instagram: { recommended: 2200, max: 2200 },
  Facebook: { recommended: 500, max: 63206 }
};

// Content type configurations
const PLATFORM_CONTENT_TYPES = {
  LinkedIn: ["text_post", "article", "carousel", "video", "poll"],
  Twitter: ["tweet", "thread", "poll"],
  Instagram: ["post", "reel", "carousel", "story"],
  Facebook: ["post", "video", "story", "carousel"]
};

// Content type display names
const CONTENT_TYPE_LABELS = {
  text_post: "Text Post", article: "Article", carousel: "Carousel",
  video: "Video", poll: "Poll", tweet: "Tweet", thread: "Thread",
  post: "Post", reel: "Reel", story: "Story"
};

// Content type colors
const CONTENT_TYPE_COLORS = {
  text_post: "bg-blue-100 text-blue-700", article: "bg-purple-100 text-purple-700",
  carousel: "bg-green-100 text-green-700", video: "bg-red-100 text-red-700",
  poll: "bg-blue-100 text-blue-700", tweet: "bg-sky-100 text-sky-700",
  thread: "bg-indigo-100 text-indigo-700", post: "bg-pink-100 text-pink-700",
  reel: "bg-orange-100 text-orange-700", story: "bg-teal-100 text-teal-700"
};

const platformColors = {
  LinkedIn: { color: "#0A66C2", icon: FaLinkedin },
  Twitter: { color: "#000000", icon: FaTwitter },
  Instagram: { color: "#E1306C", icon: FaInstagram },
  Facebook: { color: "#1877F2", icon: FaFacebook }
};

// Status config
const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-[#E5E7EB] text-[#6B7280]", icon: Circle },
  scheduled: { label: "Scheduled", color: "bg-brand-blue/10 text-brand-blue", icon: Clock },
  published: { label: "Published", color: "bg-green-100 text-green-700", icon: CheckCircle2 }
};

// Best time to post by platform
const BEST_POST_TIMES = {
  LinkedIn: { time: "10:00 AM", day: "Tue-Thu", tip: "Best: Tue-Thu 10AM-12PM" },
  Twitter: { time: "9:00 AM", day: "Mon-Fri", tip: "Best: Mon-Fri 9AM-12PM" },
  Instagram: { time: "11:00 AM", day: "Mon,Wed,Fri", tip: "Best: Mon/Wed/Fri 11AM-1PM" },
  Facebook: { time: "1:00 PM", day: "Wed-Fri", tip: "Best: Wed-Fri 1PM-4PM" }
};

// Quick emoji picks
const QUICK_EMOJIS = ["🚀", "💡", "🎯", "✨", "🔥", "💪", "📈", "🎉", "👏", "💬", "❤️", "⭐"];

const CalendarView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterContentType, setFilterContentType] = useState("all");
  const [regenerating, setRegenerating] = useState(null);
  const [editingContentType, setEditingContentType] = useState(null);

  // New states
  const [selectedPosts, setSelectedPosts] = useState(new Set());
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [expandedPost, setExpandedPost] = useState(null);
  const [hashtagsData, setHashtagsData] = useState({});
  const [loadingHashtags, setLoadingHashtags] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [expandedContent, setExpandedContent] = useState(new Set());
  const editRef = useRef(null);

  const toggleContentExpand = (postId) => {
    setExpandedContent(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  const getCharacterStatus = (content, platform) => {
    const length = content.length;
    const limits = PLATFORM_CHARACTER_LIMITS[platform] || { recommended: 500, max: 1000 };
    if (length > limits.max) return { color: "text-brand-danger", status: "error" };
    if (length > limits.recommended) return { color: "text-brand-purple", status: "warning" };
    return { color: "text-green-600", status: "success" };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCalendar(); }, [id]);

  const fetchCalendar = async () => {
    try {
      const response = await api.get(`/api/calendar/${id}`);
      setCalendar(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  // ---- COPY FEATURES ----
  const copyToClipboard = (text, label = "Content") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const copyPostFormatted = (post) => {
    const formatted = `📱 ${post.platform} | 📅 ${post.date} | 📌 ${post.pillar}\n🏷️ Type: ${CONTENT_TYPE_LABELS[post.content_type] || post.content_type}\n\n${post.content}`;
    copyToClipboard(formatted, "Formatted post");
  };

  const copyBulkPosts = () => {
    if (selectedPosts.size === 0) {
      toast.error("No posts selected");
      return;
    }
    const posts = calendar.posts.filter(p => selectedPosts.has(p.id));
    const text = posts.map(p =>
      `--- ${p.platform} | ${p.date} | ${p.pillar} ---\n[${CONTENT_TYPE_LABELS[p.content_type] || p.content_type}]\n${p.content}\n`
    ).join("\n");
    copyToClipboard(text, `${posts.length} posts`);
  };

  const togglePostSelection = (postId) => {
    setSelectedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filtered = filteredPosts;
    if (selectedPosts.size === filtered.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filtered.map(p => p.id)));
    }
  };

  // ---- INLINE EDITING ----
  const startEditing = (post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
    setTimeout(() => editRef.current?.focus(), 100);
  };

  const saveEdit = async (postId) => {
    try {
      await api.post(`/api/update-post-content`, {
        post_id: postId, calendar_id: id, content: editContent
      });
      setCalendar(prev => ({
        ...prev,
        posts: prev.posts.map(p => p.id === postId ? { ...p, content: editContent } : p)
      }));
      setEditingPost(null);
      toast.success("Post updated!");
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };

  const cancelEdit = () => { setEditingPost(null); setEditContent(""); };

  // ---- POST STATUS ----
  const updateStatus = async (postId, newStatus) => {
    try {
      await api.post(`/api/update-post-status`, {
        post_id: postId, calendar_id: id, status: newStatus
      });
      setCalendar(prev => ({
        ...prev,
        posts: prev.posts.map(p => p.id === postId ? { ...p, status: newStatus } : p)
      }));
      toast.success(`Status changed to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // ---- HASHTAGS & CTA ----
  const generateHashtags = async (post) => {
    if (hashtagsData[post.id]) {
      setExpandedPost(expandedPost === post.id ? null : post.id);
      return;
    }
    setLoadingHashtags(post.id);
    setExpandedPost(post.id);
    try {
      const response = await api.post(`/api/generate-hashtags`, {
        content: post.content, platform: post.platform,
        industry: calendar.strategy.industry, brand_name: calendar.strategy.brand_name
      });
      setHashtagsData(prev => ({ ...prev, [post.id]: response.data }));
    } catch (error) {
      toast.error("Failed to generate suggestions");
    } finally {
      setLoadingHashtags(null);
    }
  };

  // ---- EMOJI INSERT ----
  const insertEmoji = (postId, emoji) => {
    setCalendar(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? { ...p, content: p.content + " " + emoji } : p)
    }));
    api.post(`/api/update-post-content`, {
      post_id: postId, calendar_id: id,
      content: calendar.posts.find(p => p.id === postId).content + " " + emoji
    }).catch(() => { });
    setShowEmojiPicker(null);
    toast.success("Emoji added!");
  };

  // ---- REGENERATE ----
  const regeneratePost = async (postId) => {
    setRegenerating(postId);
    try {
      const response = await api.post(`/api/regenerate`, { post_id: postId, calendar_id: id });
      setCalendar(prev => ({
        ...prev,
        posts: prev.posts.map(post => post.id === postId ? { ...post, content: response.data.new_content } : post)
      }));
      // Clear cached hashtags for this post
      setHashtagsData(prev => { const n = { ...prev }; delete n[postId]; return n; });
      toast.success("Post regenerated!");
    } catch (error) {
      toast.error("Failed to regenerate post");
    } finally {
      setRegenerating(null);
    }
  };

  const updateContentType = async (postId, newContentType) => {
    try {
      await api.post(`/api/update-content-type`, { post_id: postId, calendar_id: id, content_type: newContentType });
      setCalendar(prev => ({
        ...prev,
        posts: prev.posts.map(post => post.id === postId ? { ...post, content_type: newContentType } : post)
      }));
      setEditingContentType(null);
      toast.success("Content type updated!");
    } catch (error) {
      toast.error("Failed to update content type");
    }
  };

  // ---- EXPORT ----
  const exportToExcel = () => {
    if (!calendar) return;
    const data = calendar.posts.map(post => ({
      Date: post.date, Platform: post.platform,
      "Content Type": CONTENT_TYPE_LABELS[post.content_type] || post.content_type,
      Pillar: post.pillar, Content: post.content, Status: post.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Content Calendar");
    XLSX.writeFile(wb, `${calendar.strategy.brand_name}_Content_Calendar.xlsx`);
    toast.success("Exported to Excel!");
  };

  const exportToPDF = () => {
    if (!calendar) return;

    const cleanText = (text) => {
      if (!text) return '';
      return text
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
        .replace(/[\u{2600}-\u{26FF}]/gu, '')
        .replace(/[\u{2700}-\u{27BF}]/gu, '')
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
        .replace(/[\u{200D}]/gu, '')
        .replace(/[\u{20E3}]/gu, '')
        .replace(/[\u{E0020}-\u{E007F}]/gu, '')
        .replace(/[^\x20-\x7E\n\r\t]/g, '')
        .trim();
    };

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Title page header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(cleanText(calendar.strategy.brand_name), margin, y + 8);
    y += 14;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Industry: ${cleanText(calendar.strategy.industry)}  |  Target: ${cleanText(calendar.strategy.target_audience)}  |  ${calendar.posts.length} posts`, margin, y);
    y += 4;
    doc.setDrawColor(43, 43, 214);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Render each post as a card
    calendar.posts.forEach((post, index) => {
      const contentText = cleanText(post.content);
      const wrappedContent = doc.splitTextToSize(contentText, contentWidth - 8);
      const contentHeight = wrappedContent.length * 4.5;
      const cardHeight = 18 + contentHeight + 8; // header + content + padding

      // Check if card fits on current page
      if (y + cardHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      // Card border
      doc.setDrawColor(200, 200, 210);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3);

      // Header bar
      doc.setFillColor(43, 43, 214);
      // Draw a top accent line
      doc.setDrawColor(43, 43, 214);
      doc.setLineWidth(1.5);
      doc.line(margin + 3, y, margin + contentWidth - 3, y);

      // Platform + Date + Type row
      const headerY = y + 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(43, 43, 214);
      doc.text(post.platform, margin + 5, headerY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      doc.setFontSize(8);
      doc.text(post.date, margin + 40, headerY);

      const typeLabel = CONTENT_TYPE_LABELS[post.content_type] || post.content_type;
      doc.text(typeLabel, margin + 75, headerY);

      const statusLabel = (post.status || 'draft').toUpperCase();
      doc.text(statusLabel, margin + contentWidth - 5 - doc.getTextWidth(statusLabel), headerY);

      // Pillar
      const pillarY = headerY + 6;
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.setFont('helvetica', 'italic');
      doc.text(cleanText(post.pillar), margin + 5, pillarY);

      // Content
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30);
      doc.setFontSize(8.5);
      const contentStartY = pillarY + 5;
      doc.text(wrappedContent, margin + 5, contentStartY);

      y += cardHeight + 5; // spacing between cards
    });

    doc.save(`${calendar.strategy.brand_name}_Content_Calendar.pdf`);
    toast.success("Exported to PDF!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue border-t-transparent mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6B7280] mb-4">Calendar not found</p>
          <Button onClick={() => navigate("/")} className="bg-brand-gradient text-white shadow-brand hover:brightness-110">Go Home</Button>
        </div>
      </div>
    );
  }

  const groupedPosts = {};
  calendar.posts.forEach(post => {
    if (!groupedPosts[post.date]) groupedPosts[post.date] = [];
    groupedPosts[post.date].push(post);
  });

  const filteredPosts = calendar.posts.filter(p => {
    const platformMatch = filterPlatform === "all" || p.platform === filterPlatform;
    const contentTypeMatch = filterContentType === "all" || p.content_type === filterContentType;
    return platformMatch && contentTypeMatch;
  });

  const dates = [...new Set(calendar.posts.map(p => p.date))].sort();
  const allContentTypes = [...new Set(calendar.posts.map(p => p.content_type))].sort();

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* ---- HEADER ---- */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button data-testid="back-to-dashboard-btn" onClick={() => navigate("/")} variant="outline" className="rounded-xl flex-shrink-0 border-[#E5E7EB] hover:bg-[#F5F7FB]">
                <ArrowLeft className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{calendar.strategy.brand_name}</h1>
                <p className="text-xs sm:text-sm text-[#6B7280]">{calendar.strategy.industry} • {calendar.posts.length} posts</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Bulk Actions */}
              {selectedPosts.size > 0 && (
                <div className="flex items-center gap-2 bg-brand-blue/5 px-3 py-1.5 rounded-xl border border-brand-blue/20">
                  <span className="text-xs font-medium text-brand-blue">{selectedPosts.size} selected</span>
                  <Button onClick={copyBulkPosts} size="sm" className="h-7 text-xs bg-brand-gradient hover:brightness-110 text-white rounded-lg">
                    <Copy className="w-3 h-3 mr-1" />Copy All
                  </Button>
                  <Button onClick={() => setSelectedPosts(new Set())} size="sm" variant="ghost" className="h-7 text-xs text-brand-blue">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <Button onClick={toggleSelectAll} size="sm" variant="outline" className="rounded-xl text-xs h-8 sm:h-9 border-[#E5E7EB]">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {selectedPosts.size === filteredPosts.length ? "Deselect" : "Select All"}
              </Button>
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger data-testid="platform-filter" className="w-[130px] sm:w-40 rounded-xl text-xs sm:text-sm h-8 sm:h-9 border-[#E5E7EB]">
                  <Filter className="w-3.5 h-3.5 mr-1" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterContentType} onValueChange={setFilterContentType}>
                <SelectTrigger data-testid="content-type-filter" className="w-[130px] sm:w-40 rounded-xl text-xs sm:text-sm h-8 sm:h-9 border-[#E5E7EB]">
                  <Filter className="w-3.5 h-3.5 mr-1" /><SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {allContentTypes.map(type => (
                    <SelectItem key={type} value={type}>{CONTENT_TYPE_LABELS[type] || type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button data-testid="export-excel-btn" onClick={exportToExcel} variant="outline" className="rounded-xl text-xs px-2.5 sm:px-4 h-8 sm:h-9 border-[#E5E7EB]">
                  <Download className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Excel</span>
                </Button>
                <Button data-testid="export-pdf-btn" onClick={exportToPDF} className="bg-brand-gradient hover:brightness-110 text-white rounded-xl text-xs px-2.5 sm:px-4 h-8 sm:h-9 shadow-brand">
                  <Download className="w-3.5 h-3.5 sm:mr-1.5" /><span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* ---- PILLARS ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {calendar.pillars.map((pillar, index) => (
            <Card key={index} data-testid={`pillar-card-${index}`} className="border-[#E5E7EB] shadow-card hover:shadow-md transition-shadow rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">{pillar.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#6B7280] mb-3">{pillar.description}</p>
                <div className="flex flex-wrap gap-1">
                  {pillar.platforms.map((platform, idx) => {
                    const Icon = platformColors[platform]?.icon;
                    return Icon ? <Icon key={idx} className="w-4 h-4 text-[#6B7280]/50" /> : null;
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ---- CONTENT GRID ---- */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <CalendarIcon className="w-5 h-5 text-brand-blue" />
          <h2 className="text-lg sm:text-xl font-bold text-[#111827]">Content Calendar</h2>
          <span className="text-xs text-[#6B7280] ml-auto">{filteredPosts.length} posts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map(post => {
            const { color, icon: Icon } = platformColors[post.platform] || {};
            const contentTypeColor = CONTENT_TYPE_COLORS[post.content_type] || "bg-gray-100 text-gray-700";
            const isEditing = editingContentType === post.id;
            const isEditingContent = editingPost === post.id;
            const isExpanded = expandedPost === post.id;
            const isSelected = selectedPosts.has(post.id);
            const currentStatus = post.status || "draft";
            const statusConf = STATUS_CONFIG[currentStatus];
            const StatusIcon = statusConf.icon;
            const bestTime = BEST_POST_TIMES[post.platform];
            const nextStatus = { draft: "scheduled", scheduled: "published", published: "draft" };

            // Format date
            const dateObj = parseISO(post.date);
            const dayName = format(dateObj, 'EEE');
            const dayNum = format(dateObj, 'd');
            const monthName = format(dateObj, 'MMM');

            return (
              <motion.div
                key={post.id}
                data-testid={`post-card-${post.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: "0 8px 25px -5px rgba(43,43,214,0.08)" }}
                className={`group bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden transition-all ${isSelected ? 'ring-2 ring-brand-blue bg-brand-blue/[0.02]' : ''}`}
              >
                {/* Card color accent bar */}
                <div className="h-1" style={{ backgroundColor: color }}></div>

                <div className="p-4">
                  {/* Header: Date + Platform + Checkbox + Actions */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePostSelection(post.id)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-blue border-brand-blue' : 'border-[#E5E7EB] hover:border-brand-blue/40'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />}
                      <span className="text-sm font-semibold text-[#111827]">{post.platform}</span>
                      {isEditing ? (
                        <Select value={post.content_type} onValueChange={(value) => updateContentType(post.id, value)}>
                          <SelectTrigger className="h-6 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PLATFORM_CONTENT_TYPES[post.platform]?.map(type => (
                              <SelectItem key={type} value={type} className="text-xs">{CONTENT_TYPE_LABELS[type] || type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`text-[10px] px-2 py-0.5 cursor-pointer font-medium ${contentTypeColor}`}
                          onClick={() => setEditingContentType(post.id)}>
                          {CONTENT_TYPE_LABELS[post.content_type] || post.content_type}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyToClipboard(post.content, "Post")} title="Copy"
                        className="p-1 hover:bg-[#F5F7FB] rounded-lg"><Copy className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                      <button onClick={() => copyPostFormatted(post)} title="Copy formatted"
                        className="p-1 hover:bg-[#F5F7FB] rounded-lg"><Send className="w-3.5 h-3.5 text-[#6B7280]" /></button>
                      <button data-testid={`regenerate-btn-${post.id}`} onClick={() => regeneratePost(post.id)}
                        disabled={regenerating === post.id} className="p-1 hover:bg-[#F5F7FB] rounded-lg">
                        <RefreshCw className={`w-3.5 h-3.5 text-[#6B7280] ${regenerating === post.id ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Date badge */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-[11px] font-semibold text-white bg-brand-gradient px-2 py-0.5 rounded-md shadow-brand">
                      {dayName} {monthName} {dayNum}
                    </span>
                    {bestTime && (
                      <span className="text-[11px] text-brand-blue flex items-center gap-0.5" title={bestTime.tip}>
                        <Clock className="w-3 h-3" />{bestTime.time}
                      </span>
                    )}
                  </div>

                  {/* MAIN CONTENT */}
                  {isEditingContent ? (
                    <div className="mb-2.5">
                      <textarea ref={editRef} value={editContent} onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-sm text-[#111827] border border-brand-blue/30 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-y min-h-[100px] bg-[#F5F7FB]"
                        rows={4} />
                      <div className="flex gap-2 mt-2">
                        <Button onClick={() => saveEdit(post.id)} size="sm" className="h-7 text-xs bg-brand-gradient hover:brightness-110 text-white px-3 rounded-lg shadow-brand">
                          <Check className="w-3 h-3 mr-1" />Save
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="ghost" className="h-7 text-xs px-3 rounded-lg">
                          <X className="w-3 h-3 mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2.5">
                      <div className="cursor-pointer group/content rounded-lg hover:bg-[#F5F7FB] p-1.5 -mx-1.5 transition-colors" onClick={() => startEditing(post)} title="Click to edit">
                        {/* Check if content has carousel slides */}
                        {/Slide\s*\d+\s*:/i.test(post.content) ? (
                          <div className={`space-y-2 transition-all duration-300 ${expandedContent.has(post.id) ? '' : 'max-h-[180px] overflow-hidden'}`}>
                            {post.content.split(/(?=Slide\s*\d+\s*:)/i).filter(s => s.trim()).map((slide, idx) => {
                              const slideMatch = slide.match(/^Slide\s*(\d+)\s*:\s*/i);
                              const slideNum = slideMatch ? slideMatch[1] : idx + 1;
                              const slideContent = slideMatch ? slide.replace(slideMatch[0], '').trim() : slide.trim();
                              const slideColors = ['bg-blue-50 border-blue-200', 'bg-purple-50 border-purple-200', 'bg-green-50 border-green-200'];
                              const badgeColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500'];
                              return (
                                <div key={idx} className={`rounded-lg border p-2.5 ${slideColors[idx % 3]}`}>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded ${badgeColors[idx % 3]}`}>
                                      Slide {slideNum}
                                    </span>
                                  </div>
                                  <p className="text-[13px] text-[#111827]/80 leading-relaxed whitespace-pre-line">
                                    {slideContent}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className={`text-[13px] text-[#111827]/80 leading-relaxed whitespace-pre-line transition-all duration-300 ${expandedContent.has(post.id) ? '' : 'line-clamp-4'}`}>
                            {post.content}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover/content:opacity-100 transition-opacity">
                          <Edit2 className="w-3 h-3 text-[#6B7280]" />
                          <span className="text-[10px] text-[#6B7280]">Click to edit</span>
                        </div>
                      </div>
                      {post.content.length > 150 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleContentExpand(post.id); }}
                          className="text-[12px] font-medium text-brand-blue hover:text-brand-purple mt-1 px-1.5 transition-colors"
                        >
                          {expandedContent.has(post.id) ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Meta row: Status + Pillar */}
                  <div className="flex items-center gap-2 flex-wrap mb-2.5 pb-2.5 border-b border-[#E5E7EB]/50">
                    <button onClick={() => updateStatus(post.id, nextStatus[currentStatus])}
                      className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${statusConf.color} hover:opacity-80 transition-opacity`}
                      title={`Click to change status`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConf.label}
                    </button>
                    <span className="text-xs text-[#6B7280]/50">•</span>
                    <span className="text-[11px] text-[#6B7280] font-medium truncate" title={post.pillar}>{post.pillar}</span>
                  </div>

                  {/* Footer: Char count + Actions */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-medium ${getCharacterStatus(post.content, post.platform).color}`}>
                      {post.content.length} chars
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                        className={`p-1 hover:bg-[#F5F7FB] rounded-lg transition-colors ${showEmojiPicker === post.id ? 'bg-brand-purple/5' : ''}`} title="Emojis">
                        <Smile className="w-3.5 h-3.5 text-[#6B7280]" />
                      </button>
                      <button onClick={() => generateHashtags(post)}
                        className={`p-1 hover:bg-[#F5F7FB] rounded-lg transition-colors ${isExpanded ? 'bg-brand-blue/5' : ''}`} title="Hashtags & CTA">
                        {loadingHashtags === post.id ? (
                          <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
                        ) : (
                          <Hash className="w-3.5 h-3.5 text-brand-blue" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable: Emoji Picker */}
                  <AnimatePresence>
                    {showEmojiPicker === post.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 p-2.5 bg-brand-purple/5 rounded-xl border border-brand-purple/15">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#6B7280] font-medium">Quick Emojis</span>
                          <button onClick={() => setShowEmojiPicker(null)} className="p-0.5 hover:bg-white rounded"><X className="w-3 h-3 text-[#6B7280]" /></button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {QUICK_EMOJIS.map((emoji, i) => (
                            <button key={i} onClick={() => insertEmoji(post.id, emoji)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg text-sm transition-colors">{emoji}</button>
                          ))}
                          {hashtagsData[post.id]?.emojis?.map((emoji, i) => (
                            <button key={`ai-${i}`} onClick={() => insertEmoji(post.id, emoji)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg text-sm ring-1 ring-brand-blue/20" title="AI suggested">{emoji}</button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expandable: Hashtags & CTA */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-2.5 p-2.5 bg-brand-blue/[0.03] rounded-xl border border-brand-blue/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-brand-blue flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Suggestions</span>
                          <button onClick={() => setExpandedPost(null)} className="p-0.5 hover:bg-white rounded"><X className="w-3 h-3 text-[#6B7280]" /></button>
                        </div>
                        {loadingHashtags === post.id ? (
                          <div className="flex items-center gap-2 py-2">
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
                            <span className="text-xs text-[#6B7280]">Generating suggestions...</span>
                          </div>
                        ) : hashtagsData[post.id] ? (
                          <div className="space-y-2.5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-[#6B7280] font-medium">Hashtags</span>
                                <button onClick={() => copyToClipboard(hashtagsData[post.id].hashtags.join(" "), "Hashtags")}
                                  className="text-[10px] text-brand-blue hover:text-brand-purple flex items-center gap-1">
                                  <Copy className="w-2.5 h-2.5" />Copy all
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {hashtagsData[post.id].hashtags.map((tag, i) => (
                                  <span key={i} onClick={() => copyToClipboard(tag, "Hashtag")}
                                    className="text-[11px] bg-white text-brand-blue px-1.5 py-0.5 rounded-md cursor-pointer hover:bg-brand-blue/5 transition-colors border border-brand-blue/10 font-medium">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {hashtagsData[post.id].cta && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-[#6B7280] font-medium">💬 Call to Action</span>
                                  <button onClick={() => copyToClipboard(hashtagsData[post.id].cta, "CTA")}
                                    className="text-[10px] text-brand-blue hover:text-brand-purple flex items-center gap-1">
                                    <Copy className="w-2.5 h-2.5" />Copy
                                  </button>
                                </div>
                                <p className="text-xs text-[#111827] bg-white p-2.5 rounded-lg border border-brand-purple/10 leading-relaxed">
                                  {hashtagsData[post.id].cta}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;