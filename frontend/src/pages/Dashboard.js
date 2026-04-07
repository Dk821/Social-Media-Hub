import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axiosConfig";
import { motion } from "framer-motion";
import { Sparkles, Target, Users, TrendingUp, Palette, ChevronRight, FileText, Calendar } from "lucide-react";
import { FaLinkedin, FaTwitter, FaInstagram, FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Available content types for each platform
const PLATFORM_CONTENT_TYPES = {
  LinkedIn: [
    { value: "text_post", label: "Text Post" },
    { value: "article", label: "Article" },
    { value: "carousel", label: "Carousel" },
    { value: "video", label: "Video" },
    { value: "poll", label: "Poll" }
  ],
  Twitter: [
    { value: "tweet", label: "Tweet" },
    { value: "thread", label: "Thread" },
    { value: "poll", label: "Poll" }
  ],
  Instagram: [
    { value: "post", label: "Post" },
    { value: "reel", label: "Reel" },
    { value: "carousel", label: "Carousel" },
    { value: "story", label: "Story" }
  ],
  Facebook: [
    { value: "post", label: "Post" },
    { value: "video", label: "Video" },
    { value: "story", label: "Story" },
    { value: "carousel", label: "Carousel" }
  ]
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // Start from 0 for generation mode selection
  const [formData, setFormData] = useState({
    brand_name: "",
    industry: "",
    target_audience: "",
    goals: [],
    tone: "",
    content_themes: [],
    preferred_content_types: {
      LinkedIn: ["text_post", "article", "carousel"],
      Twitter: ["tweet", "thread"],
      Instagram: ["post", "reel", "carousel"],
      Facebook: ["post", "video"]
    },
    content_length: "short",  // short, medium, long
    generation_mode: "all",  // all or single
    selected_platform: null,
    duration_days: 7  // 1-30 days
  });

  const [goalInput, setGoalInput] = useState("");
  const [themeInput, setThemeInput] = useState("");

  const addGoal = () => {
    if (goalInput.trim() && formData.goals.length < 5) {
      setFormData({ ...formData, goals: [...formData.goals, goalInput.trim()] });
      setGoalInput("");
    }
  };

  const removeGoal = (index) => {
    setFormData({ ...formData, goals: formData.goals.filter((_, i) => i !== index) });
  };

  const addTheme = () => {
    if (themeInput.trim() && formData.content_themes.length < 5) {
      setFormData({ ...formData, content_themes: [...formData.content_themes, themeInput.trim()] });
      setThemeInput("");
    }
  };

  const removeTheme = (index) => {
    setFormData({ ...formData, content_themes: formData.content_themes.filter((_, i) => i !== index) });
  };

  const toggleContentType = (platform, type) => {
    const currentTypes = formData.preferred_content_types[platform] || [];
    let newTypes;

    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type);
      // Ensure at least one type is selected
      if (newTypes.length === 0) {
        toast.error(`Please keep at least one content type selected for ${platform}`);
        return;
      }
    } else {
      newTypes = [...currentTypes, type];
    }

    setFormData({
      ...formData,
      preferred_content_types: {
        ...formData.preferred_content_types,
        [platform]: newTypes
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.brand_name || !formData.industry || !formData.target_audience ||
      formData.goals.length === 0 || !formData.tone || formData.content_themes.length === 0) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/strategy", formData);
      toast.success("Content calendar generated successfully!");
      navigate(`/calendar/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate calendar. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">


      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8 text-center">
            <h2 className="text-4xl font-bold tracking-tighter mb-3">Build Your Content Strategy</h2>
            <p className="text-[#6B7280]">Answer a few questions and let AI create your personalized content calendar</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {[0, 1, 2, 3, 4, 5, 6].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step >= s ? "bg-brand-gradient text-white shadow-brand" : "bg-[#E5E7EB] text-[#6B7280]"
                  }`}>
                  {s + 1}
                </div>
                {s < 6 && <div className={`w-10 h-0.5 transition-all duration-300 ${step > s ? "bg-brand-blue" : "bg-[#E5E7EB]"
                  }`} />}
              </div>
            ))}
          </div>

          <Card className="border-[#E5E7EB] shadow-card">
            <CardContent className="p-8">
              {step === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">Choose Generation Mode</h3>
                      <p className="text-[#6B7280] text-sm">Generate content for all platforms or focus on one</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setFormData({ ...formData, generation_mode: "all", selected_platform: null })}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${formData.generation_mode === "all"
                        ? "border-brand-blue bg-brand-blue/5 shadow-brand"
                        : "border-[#E5E7EB] hover:border-brand-blue/30"
                        }`}
                      data-testid="generation-mode-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-brand">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-semibold">All Platforms</h4>
                      </div>
                      <p className="text-[#6B7280] text-sm">
                        Generate a complete content calendar for LinkedIn, Twitter, Instagram, and Facebook
                      </p>
                      <div className="mt-4 flex gap-2">
                        <FaLinkedin className="w-5 h-5 text-[#0A66C2]" />
                        <FaTwitter className="w-5 h-5 text-black" />
                        <FaInstagram className="w-5 h-5 text-[#E1306C]" />
                        <FaFacebook className="w-5 h-5 text-[#1877F2]" />
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, generation_mode: "single" })}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${formData.generation_mode === "single"
                        ? "border-brand-purple bg-brand-purple/5 shadow-brand"
                        : "border-[#E5E7EB] hover:border-brand-purple/30"
                        }`}
                      data-testid="generation-mode-single"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-brand-purple text-white flex items-center justify-center" style={{ boxShadow: '0 4px 14px -3px rgba(123,44,191,0.3)' }}>
                          <Target className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-semibold">Single Platform</h4>
                      </div>
                      <p className="text-[#6B7280] text-sm">
                        Focus on one platform and generate targeted content for your specific needs
                      </p>
                      {formData.generation_mode === "single" && (
                        <div className="mt-4">
                          <Select
                            value={formData.selected_platform || ""}
                            onValueChange={(value) => setFormData({ ...formData, selected_platform: value })}
                          >
                            <SelectTrigger data-testid="platform-select" className="h-11 rounded-xl border-[#E5E7EB] bg-white">
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LinkedIn">
                                <div className="flex items-center gap-2">
                                  <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />
                                  LinkedIn
                                </div>
                              </SelectItem>
                              <SelectItem value="Twitter">
                                <div className="flex items-center gap-2">
                                  <FaTwitter className="w-4 h-4 text-black" />
                                  Twitter
                                </div>
                              </SelectItem>
                              <SelectItem value="Instagram">
                                <div className="flex items-center gap-2">
                                  <FaInstagram className="w-4 h-4 text-[#E1306C]" />
                                  Instagram
                                </div>
                              </SelectItem>
                              <SelectItem value="Facebook">
                                <div className="flex items-center gap-2">
                                  <FaFacebook className="w-4 h-4 text-[#1877F2]" />
                                  Facebook
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    data-testid="step-0-next-btn"
                    onClick={() => setStep(1)}
                    className="w-full h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium transition-all active:scale-[0.98] shadow-brand"
                    disabled={formData.generation_mode === "single" && !formData.selected_platform}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">Brand Basics</h3>
                      <p className="text-[#6B7280] text-sm">Tell us about your brand identity</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="brand_name" className="text-sm font-medium text-[#111827] mb-1.5 block">Brand Name</Label>
                      <Input
                        id="brand_name"
                        data-testid="brand-name-input"
                        placeholder="e.g., TechFlow Solutions"
                        value={formData.brand_name}
                        onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                        className="h-11 rounded-xl border-[#E5E7EB] bg-[#F5F7FB] focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="industry" className="text-sm font-medium text-[#111827] mb-1.5 block">Industry</Label>
                      <Input
                        id="industry"
                        data-testid="industry-input"
                        placeholder="e.g., SaaS, E-commerce, Healthcare"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="h-11 rounded-xl border-[#E5E7EB] bg-[#F5F7FB] focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                      />
                    </div>

                    <div>
                      <Label htmlFor="target_audience" className="text-sm font-medium text-[#111827] mb-1.5 block">Target Audience</Label>
                      <Textarea
                        id="target_audience"
                        data-testid="target-audience-input"
                        placeholder="Describe your ideal customer (age, interests, pain points)"
                        value={formData.target_audience}
                        onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                        className="min-h-24 rounded-xl border-[#E5E7EB] bg-[#F5F7FB] focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                      />
                    </div>
                  </div>

                  <Button
                    data-testid="step-1-next-btn"
                    onClick={() => setStep(2)}
                    className="w-full h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium transition-all active:scale-[0.98] shadow-brand"
                    disabled={!formData.brand_name || !formData.industry || !formData.target_audience}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">Goals & Objectives</h3>
                      <p className="text-[#6B7280] text-sm">What do you want to achieve?</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#111827] mb-1.5 block">Marketing Goals (up to 5)</Label>
                    <div className="flex gap-2">
                      <Input
                        data-testid="goal-input"
                        placeholder="e.g., Increase brand awareness"
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                        className="h-11 rounded-xl border-[#E5E7EB] bg-[#F5F7FB] focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                      />
                      <Button
                        data-testid="add-goal-btn"
                        onClick={addGoal}
                        disabled={formData.goals.length >= 5}
                        className="h-11 px-6 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.goals.map((goal, index) => (
                        <div key={index} data-testid={`goal-tag-${index}`} className="px-3 py-1.5 bg-brand-blue/10 text-brand-blue rounded-lg text-sm flex items-center gap-2 font-medium">
                          {goal}
                          <button onClick={() => removeGoal(index)} className="text-brand-blue/60 hover:text-brand-blue font-bold">×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tone" className="text-sm font-medium text-[#111827] mb-1.5 block">Brand Tone</Label>
                    <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
                      <SelectTrigger data-testid="tone-select" className="h-11 rounded-xl border-[#E5E7EB] bg-[#F5F7FB]">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="step-2-back-btn"
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F5F7FB]"
                    >
                      Back
                    </Button>
                    <Button
                      data-testid="step-2-next-btn"
                      onClick={() => setStep(3)}
                      className="flex-1 h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium shadow-brand"
                      disabled={formData.goals.length === 0 || !formData.tone}
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                      <Palette className="w-5 h-5 text-brand-purple" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">Content Themes</h3>
                      <p className="text-[#6B7280] text-sm">What topics will you cover?</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#111827] mb-1.5 block">Content Themes (up to 5)</Label>
                    <div className="flex gap-2">
                      <Input
                        data-testid="theme-input"
                        placeholder="e.g., Product tutorials, Industry news"
                        value={themeInput}
                        onChange={(e) => setThemeInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTheme()}
                        className="h-11 rounded-xl border-[#E5E7EB] bg-[#F5F7FB] focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                      />
                      <Button
                        data-testid="add-theme-btn"
                        onClick={addTheme}
                        disabled={formData.content_themes.length >= 5}
                        className="h-11 px-6 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.content_themes.map((theme, index) => (
                        <div key={index} data-testid={`theme-tag-${index}`} className="px-3 py-1.5 bg-brand-purple/10 text-brand-purple rounded-lg text-sm flex items-center gap-2 font-medium">
                          {theme}
                          <button onClick={() => removeTheme(index)} className="text-brand-purple/60 hover:text-brand-purple font-bold">×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="step-3-back-btn"
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F5F7FB]"
                    >
                      Back
                    </Button>
                    <Button
                      data-testid="step-3-next-btn"
                      onClick={() => setStep(4)}
                      className="flex-1 h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium shadow-brand"
                      disabled={formData.content_themes.length === 0}
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">Calendar Duration</h3>
                      <p className="text-[#6B7280] text-sm">How many days of content do you want to generate?</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl border-2 border-brand-blue bg-brand-blue/5">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-semibold text-[#111827]">Number of Days</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            data-testid="duration-days-input"
                            min={1}
                            max={30}
                            value={formData.duration_days}
                            onChange={(e) => {
                              let val = parseInt(e.target.value) || 1;
                              if (val < 1) val = 1;
                              if (val > 30) val = 30;
                              setFormData({ ...formData, duration_days: val });
                            }}
                            className="w-20 h-10 text-center rounded-xl border-[#E5E7EB] bg-white font-semibold text-lg"
                          />
                          <span className="text-sm text-[#6B7280] font-medium">days</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        data-testid="duration-days-slider"
                        min={1}
                        max={30}
                        value={formData.duration_days}
                        onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                        className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-blue-600"
                        style={{ accentColor: '#2563EB' }}
                      />
                      <div className="flex justify-between text-xs text-[#6B7280] mt-1">
                        <span>1 day</span>
                        <span>7 days</span>
                        <span>14 days</span>
                        <span>21 days</span>
                        <span>30 days</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[7, 14, 30].map((preset) => (
                        <div
                          key={preset}
                          onClick={() => setFormData({ ...formData, duration_days: preset })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center ${formData.duration_days === preset
                            ? "border-brand-blue bg-brand-blue/5 shadow-brand"
                            : "border-[#E5E7EB] hover:border-brand-blue/30"
                            }`}
                          data-testid={`duration-preset-${preset}`}
                        >
                          <h4 className="text-2xl font-bold text-[#111827]">{preset}</h4>
                          <p className="text-[#6B7280] text-sm mt-1">
                            {preset === 7 ? "1 Week" : preset === 14 ? "2 Weeks" : "1 Month"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <p className="text-amber-800 text-sm">
                        ⚠️ <strong>Note:</strong> Maximum duration is 30 days. Longer durations will take more time to generate.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="step-4-back-btn"
                      onClick={() => setStep(3)}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F5F7FB]"
                    >
                      Back
                    </Button>
                    <Button
                      data-testid="step-4-next-btn"
                      onClick={() => setStep(5)}
                      className="flex-1 h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium shadow-brand"
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">Content Length</h3>
                      <p className="text-[#6B7280] text-sm">Choose the ideal length for your content</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div
                      onClick={() => setFormData({ ...formData, content_length: "short" })}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${formData.content_length === "short"
                        ? "border-brand-blue bg-brand-blue/5 shadow-brand"
                        : "border-[#E5E7EB] hover:border-brand-blue/30"
                        }`}
                      data-testid="length-short"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold">Short & Engaging</h4>
                        <Badge className="bg-green-100 text-green-700">Recommended</Badge>
                      </div>
                      <p className="text-[#6B7280] text-sm mb-2">400-600 characters</p>
                      <p className="text-[#6B7280]/70 text-xs">Perfect for maximum engagement and quick reads. Ideal for most platforms.</p>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, content_length: "medium" })}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${formData.content_length === "medium"
                        ? "border-brand-blue bg-brand-blue/5 shadow-brand"
                        : "border-[#E5E7EB] hover:border-brand-blue/30"
                        }`}
                      data-testid="length-medium"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold">Balanced</h4>
                      </div>
                      <p className="text-[#6B7280] text-sm mb-2">600-1000 characters</p>
                      <p className="text-[#6B7280]/70 text-xs">Good balance between detail and brevity. Works well for storytelling.</p>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, content_length: "long" })}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${formData.content_length === "long"
                        ? "border-brand-blue bg-brand-blue/5 shadow-brand"
                        : "border-[#E5E7EB] hover:border-brand-blue/30"
                        }`}
                      data-testid="length-long"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold">Detailed</h4>
                      </div>
                      <p className="text-[#6B7280] text-sm mb-2">1000-1500 characters</p>
                      <p className="text-[#6B7280]/70 text-xs">In-depth content for thought leadership and comprehensive posts.</p>
                    </div>

                    <div className="mt-6 p-4 bg-brand-blue/5 border border-brand-blue/15 rounded-2xl">
                      <h5 className="font-semibold text-brand-blue mb-2">📏 Platform Character Limits</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />
                          <span className="text-[#111827]">LinkedIn: 3,000 max</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaTwitter className="w-4 h-4 text-black" />
                          <span className="text-[#111827]">Twitter: 280 max</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaInstagram className="w-4 h-4 text-[#E1306C]" />
                          <span className="text-[#111827]">Instagram: 2,200 max</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaFacebook className="w-4 h-4 text-[#1877F2]" />
                          <span className="text-[#111827]">Facebook: 63,206 max</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="step-5-back-btn"
                      onClick={() => setStep(4)}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F5F7FB]"
                    >
                      Back
                    </Button>
                    <Button
                      data-testid="step-5-next-btn"
                      onClick={() => setStep(6)}
                      className="flex-1 h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium shadow-brand"
                    >
                      Continue <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 6 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-brand-purple" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-1">Content Types</h3>
                      <p className="text-[#6B7280] text-sm">Select the types of content you want to create for each platform</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {(formData.generation_mode === "single" && formData.selected_platform
                      ? [formData.selected_platform]
                      : Object.keys(PLATFORM_CONTENT_TYPES)
                    ).map((platform) => (
                      <div key={platform} className="border border-[#E5E7EB] rounded-2xl p-4 bg-[#F5F7FB]">
                        <Label className="text-sm font-semibold text-[#111827] mb-3 block">{platform}</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {PLATFORM_CONTENT_TYPES[platform].map((type) => (
                            <div key={type.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${platform}-${type.value}`}
                                data-testid={`${platform}-${type.value}-checkbox`}
                                checked={formData.preferred_content_types[platform]?.includes(type.value)}
                                onCheckedChange={() => toggleContentType(platform, type.value)}
                              />
                              <label
                                htmlFor={`${platform}-${type.value}`}
                                className="text-sm text-[#111827] cursor-pointer"
                              >
                                {type.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="step-6-back-btn"
                      onClick={() => setStep(5)}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-[#E5E7EB] text-[#111827] hover:bg-[#F5F7FB]"
                    >
                      Back
                    </Button>
                    <Button
                      data-testid="generate-calendar-btn"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 h-12 rounded-xl bg-brand-gradient hover:brightness-110 text-white font-medium transition-all active:scale-[0.98] shadow-brand"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Calendar
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;