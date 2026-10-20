import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FlaskConical,
  MapPin,
  Shield,
  ExternalLink,
  PhoneCall,
  Cpu,
  Zap,
  Stethoscope,
  RotateCcw,
  User,
  HeartPulse,
  TrendingDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VoiceInput from "@/components/assistant/VoiceInput";
import { useAgentChat, type AgentChatResponse } from "@/hooks/useAssistantApi";
import type { HealthProfile } from "@/components/health/HealthProfileContext";
import { INDIAN_STATES, POPULAR_DISTRICTS } from "@/data/indiaLocations";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  data?: AgentChatResponse;
  timestamp: Date;
}

interface AgenticAssistantSectionProps {
  state: string;
  setState: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  profile: HealthProfile;
  onSwitchToForm?: () => void;
}

const SAMPLE_PROMPTS = [
  {
    icon: "🦟",
    label: "Dengue Warning",
    prompt: "I have had high fever for 3 days with severe pain behind my eyes, headache, and body aches in Wardha.",
  },
  {
    icon: "🚨",
    label: "Emergency Red Flag",
    prompt: "Sudden crushing chest pain radiating to my left arm with shortness of breath and cold sweat.",
  },
  {
    icon: "🗣️",
    label: "Bilingual (Hinglish)",
    prompt: "Mujhe 2 din se tez bukhar aur thand lag rahi hai, sath me ulti bhi ho rahi hai.",
  },
  {
    icon: "👶",
    label: "Pediatric Dehydration",
    prompt: "My 4-year-old child has had watery diarrhea and vomiting for 24 hours with very dry lips and fatigue.",
  },
];

export default function AgenticAssistantSection({
  state,
  setState,
  district,
  setDistrict,
  profile,
  onSwitchToForm,
}: AgenticAssistantSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your Personal Health Assistant. You can describe your symptoms, ask health and medical questions, or check eligible healthcare schemes in English, Hindi, or Hinglish.\n\nI can help you with:\n1. 💬 Answering health and preventative questions\n2. 🚨 Red-Flag Emergency Triage (Instant 108/112 detection)\n3. 🔬 Symptom Analysis & Targeted Diagnostic Guidance\n4. 🏛️ Ayushman Bharat PM-JAY & State Welfare Schemes\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  // Tab state per message: 'tests' | 'surveillance' | 'schemes'
  const [messageTabs, setMessageTabs] = useState<Record<string, "tests" | "surveillance" | "schemes">>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const agentChat = useAgentChat();
  const stateDistricts = state ? POPULAR_DISTRICTS[state] || [] : [];

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    if (messages.length > 1 || agentChat.isPending) {
      scrollToBottom();
    }
  }, [messages.length, agentChat.isPending]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query || agentChat.isPending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) {
      setInputText("");
    }

    try {
      const response = await agentChat.mutateAsync({
        message: query,
        conversation_history: history,
        state: state || profile.state || null,
        district: district || profile.district || null,
        age_group: profile.ageGroup || null,
        income_band: null,
        occupation: null,
      });

      const newId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: newId,
        role: "assistant",
        content: response.reply,
        data: response,
        timestamp: new Date(),
      };

      // Default active tab: tests if predictions exist, otherwise surveillance or schemes
      const defaultTab =
        response.top_predictions && response.top_predictions.length > 0
          ? "tests"
          : response.local_context
          ? "surveillance"
          : "schemes";

      setMessageTabs((prev) => ({ ...prev, [newId]: defaultTab }));
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `I encountered an issue processing your request: ${err?.message || "Please check your network or try again."}. If you are in urgent distress, call 108 or 112 immediately.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Conversation cleared. Describe any symptoms, timeline, or concerns in English, Hindi, or Hinglish to begin an autonomous clinical assessment.",
        timestamp: new Date(),
      },
    ]);
    setMessageTabs({});
  };

  return (
    <div className="space-y-4">
      {/* Sleek Top Header & Location Bar */}
      <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Agent Identity & Status */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-500 text-primary-foreground shadow-sm shadow-primary/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                Personalized Clinical Copilot
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Personal Copilot Active
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Track 2
              </span>
            </div>
          </div>

          {/* Region Selectors & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-secondary/50 rounded-xl px-2.5 py-1 border border-border text-xs">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setDistrict("");
                }}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer max-w-[110px]"
              >
                <option value="">State</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s} className="bg-card text-foreground">
                    {s}
                  </option>
                ))}
              </select>
              <span className="text-muted-foreground/40">/</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!state}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer max-w-[120px] disabled:opacity-40"
              >
                <option value="">District</option>
                {stateDistricts.map((d) => (
                  <option key={d} value={d} className="bg-card text-foreground">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="h-8 px-2.5 border-border text-xs text-muted-foreground hover:text-foreground rounded-lg"
              title="Clear conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {onSwitchToForm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSwitchToForm}
                className="h-8 px-2.5 border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 rounded-lg"
              >
                <HeartPulse className="mr-1.5 h-3.5 w-3.5" /> Form Mode
              </Button>
            ) : (
              <Link
                to="/health-assistant"
                className="inline-flex items-center h-8 px-2.5 border border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 rounded-lg transition-colors"
              >
                <HeartPulse className="mr-1.5 h-3.5 w-3.5" /> Report symptoms
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Dialogue Container */}
      <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden flex flex-col">
        {/* Scrollable Conversation Stream */}
        <div ref={chatContainerRef} className="p-4 sm:p-6 space-y-5 min-h-[300px] max-h-[540px] overflow-y-auto scrollbar-thin">
          {messages.map((msg) => {
            const isAssistant = msg.role === "assistant";
            const hasPredictions = Boolean(msg.data?.top_predictions && msg.data.top_predictions.length > 0);
            const hasContext = Boolean(msg.data?.local_context);
            const hasSchemes = Boolean(msg.data?.matched_schemes && msg.data.matched_schemes.length > 0);
            const hasAnyTabs = hasPredictions || hasContext || hasSchemes;

            const defaultTab = hasPredictions ? "tests" : hasContext ? "surveillance" : "schemes";
            const activeTab = messageTabs[msg.id] || defaultTab;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
              >
                {isAssistant && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/20 border border-primary/30 text-primary">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${
                    isAssistant
                      ? "bg-secondary/40 border border-border/80 text-foreground"
                      : "bg-primary text-primary-foreground font-medium ml-auto"
                  }`}
                >
                  {/* Assistant Engine & Triage Header */}
                  {isAssistant && msg.data && (
                    <div className="mb-3 space-y-2 border-b border-border/50 pb-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Sparkles className="h-2.5 w-2.5" />
                          {msg.data.engine || "Personal Health Assistant"}
                        </span>

                        {msg.data.triage_level && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              msg.data.triage_level === "EMERGENCY"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : msg.data.triage_level === "URGENT"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : msg.data.triage_level === "ROUTINE"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : msg.data.triage_level === "INFORMATIONAL" || msg.data.triage_level === "GENERAL_INQUIRY"
                                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {msg.data.triage_level === "EMERGENCY" && <ShieldAlert className="h-2.5 w-2.5" />}
                            {msg.data.triage_level === "URGENT" && <AlertTriangle className="h-2.5 w-2.5" />}
                            {msg.data.triage_level === "ROUTINE" && <Clock className="h-2.5 w-2.5" />}
                            {msg.data.triage_level === "SELF_CARE" && <ShieldCheck className="h-2.5 w-2.5" />}
                            {(msg.data.triage_level === "INFORMATIONAL" || msg.data.triage_level === "GENERAL_INQUIRY") && <Sparkles className="h-2.5 w-2.5" />}
                            {msg.data.triage_level === "INFORMATIONAL"
                              ? "Info"
                              : msg.data.triage_level === "GENERAL_INQUIRY"
                              ? "Health Guide"
                              : `Triage: ${msg.data.triage_level}`}
                          </span>
                        )}
                      </div>

                      {/* Executed Tools Tags */}
                      {msg.data.tools_executed && msg.data.tools_executed.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                            <Cpu className="h-3 w-3 text-primary" /> Tools:
                          </span>
                          {msg.data.tools_executed.map((tool) => (
                            <span
                              key={tool}
                              className="inline-flex items-center gap-1 rounded-md bg-card/80 border border-border px-1.5 py-0.5 text-[10px] font-mono text-foreground font-medium"
                            >
                              <Zap className="h-2.5 w-2.5 text-amber-400" />
                              {tool.replace("_tool_", "").replace("check_", "").replace("predict_", "")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Primary Reply Body */}
                  <div className="whitespace-pre-line text-xs sm:text-sm leading-relaxed">
                    {msg.content}
                  </div>

                  {/* 🚨 Emergency Alert Banner (Pinned if triggered) */}
                  {isAssistant && msg.data?.red_flag_triggered && (
                    <div className="mt-3.5 rounded-2xl border-2 border-rose-500/50 bg-rose-500/10 p-3.5">
                      <div className="flex items-start gap-2.5">
                        <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                            Critical Red Flag Alert Detected
                          </h4>
                          <p className="mt-1 text-xs text-rose-200/90 leading-relaxed">
                            {typeof msg.data.emergency_action === "string"
                              ? msg.data.emergency_action
                              : (msg.data.emergency_action as any)?.emergency_message ||
                                "Immediate emergency medical attention required. Do not wait or self-medicate."}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <a
                              href="tel:108"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition-colors"
                            >
                              <PhoneCall className="h-3.5 w-3.5" /> Call 108 (Ambulance)
                            </a>
                            <a
                              href="tel:112"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-rose-500/20 transition-colors"
                            >
                              <PhoneCall className="h-3.5 w-3.5 text-rose-400" /> Call 112 (National Emergency)
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Sub-Tabs for Clinical Details */}
                  {isAssistant && hasAnyTabs && (
                    <div className="mt-4 pt-3 border-t border-border/60">
                      {/* Segmented Tab Headers */}
                      <div className="flex items-center gap-1.5 bg-secondary/60 p-1 rounded-xl border border-border/60 text-xs">
                        {hasPredictions && (
                          <button
                            type="button"
                            onClick={() =>
                              setMessageTabs((prev) => ({ ...prev, [msg.id]: "tests" }))
                            }
                            className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              activeTab === "tests"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Stethoscope className="h-3.5 w-3.5 text-primary" />
                            <span>Differential & Tests</span>
                          </button>
                        )}

                        {hasContext && (
                          <button
                            type="button"
                            onClick={() =>
                              setMessageTabs((prev) => ({ ...prev, [msg.id]: "surveillance" }))
                            }
                            className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              activeTab === "surveillance"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <MapPin className="h-3.5 w-3.5 text-teal-400" />
                            <span>Surveillance</span>
                          </button>
                        )}

                        {hasSchemes && (
                          <button
                            type="button"
                            onClick={() =>
                              setMessageTabs((prev) => ({ ...prev, [msg.id]: "schemes" }))
                            }
                            className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              activeTab === "schemes"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Shield className="h-3.5 w-3.5 text-emerald-400" />
                            <span>PM-JAY Schemes</span>
                          </button>
                        )}
                      </div>

                      {/* Tab 1 Content: Differential & Targeted Lab Tests */}
                      {activeTab === "tests" && hasPredictions && (
                        <div className="mt-3 space-y-2.5">
                          <div className="flex items-center justify-between text-xs px-1">
                            <span className="font-semibold text-muted-foreground">
                              Disease Probabilities
                            </span>
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                              <TrendingDown className="h-3 w-3" /> Targeted Lab Cost Savings
                            </span>
                          </div>

                          <div className="space-y-2">
                            {msg.data!.top_predictions!.slice(0, 3).map((pred, i) => {
                              const matchPercentage =
                                (pred as any).probability !== undefined
                                  ? Math.round((pred as any).probability)
                                  : Math.round((pred.match_score ?? 0) * (pred.match_score <= 1 ? 100 : 1));
                              return (
                                <div
                                  key={i}
                                  className="rounded-xl border border-border/80 bg-card/80 p-3 shadow-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground text-xs sm:text-sm">
                                      {pred.disease}
                                    </span>
                                    <span className="text-xs font-bold text-primary">
                                      {matchPercentage}% Match
                                    </span>
                                  </div>

                                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-500"
                                      style={{ width: `${Math.min(100, matchPercentage)}%` }}
                                    />
                                  </div>

                                  <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                                    {pred.description}
                                  </p>

                                  {pred.targeted_tests && pred.targeted_tests.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-border/50 space-y-1">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                        Targeted Diagnostic Tests (Avoid ₹3,000–₹5,000 blanket panels):
                                      </span>
                                      {pred.targeted_tests.map((test, ti) => (
                                        <div
                                          key={ti}
                                          className="flex items-center justify-between text-[11px] rounded-lg bg-secondary/50 p-1.5 border border-border/40"
                                        >
                                          <div className="min-w-0 pr-2">
                                            <p className="font-medium text-foreground truncate flex items-center gap-1">
                                              <FlaskConical className="h-3 w-3 text-teal-400 shrink-0" />
                                              {test.test_name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate">
                                              {test.purpose}
                                            </p>
                                          </div>
                                          <span className="font-bold text-emerald-400 shrink-0">
                                            ₹{test.estimated_cost_inr}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tab 2 Content: EpiClim Surveillance */}
                      {activeTab === "surveillance" && hasContext && (
                        <div className="mt-3 rounded-xl border border-border/80 bg-card/80 p-3.5 text-xs shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              {msg.data!.local_context!.district}, {msg.data!.local_context!.state}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              EpiClim 2009–2022
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            District epidemiological surveillance dataset records seasonal endemicity and outbreak cases for vector-borne and enteric pathogens during this time of year.
                          </p>
                          {msg.data!.local_context!.matched_outbreak_items &&
                            msg.data!.local_context!.matched_outbreak_items.length > 0 && (
                              <div className="pt-1 flex flex-wrap gap-1.5">
                                {msg.data!.local_context!.matched_outbreak_items.map((item, ii) => (
                                  <span
                                    key={ii}
                                    className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] text-primary font-medium"
                                  >
                                    {item.disease} ({item.source})
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                      )}

                      {/* Tab 3 Content: Government Healthcare Schemes */}
                      {activeTab === "schemes" && hasSchemes && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs px-1">
                            <span className="font-semibold text-emerald-400 flex items-center gap-1">
                              <Shield className="h-3.5 w-3.5" /> Matched Welfare Entitlements
                            </span>
                            <span className="text-[10px] text-muted-foreground">National & State</span>
                          </div>
                          <div className="space-y-2">
                            {msg.data!.matched_schemes!.map((scheme, si) => (
                              <div
                                key={si}
                                className="rounded-xl border border-emerald-500/20 bg-card/90 p-3 shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-foreground text-xs">
                                    {scheme.name}
                                  </span>
                                  {scheme.source_url && (
                                    <a
                                      href={scheme.source_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
                                    >
                                      Official Portal <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                                  {scheme.summary}
                                </p>
                                <p className="mt-1.5 text-[11px] font-semibold text-emerald-400">
                                  Coverage: {scheme.benefit}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`mt-2 text-[10px] ${
                      isAssistant ? "text-muted-foreground" : "text-primary-foreground/75 text-right"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {!isAssistant && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
                    {profile.displayName ? profile.displayName[0].toUpperCase() : <User className="h-4 w-4" />}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pending Loading State */}
          {agentChat.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/20 border border-primary/30 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-border/80 bg-secondary/40 p-4 shadow-sm flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">
                  Running clinical tools: checking red-flags, EpiClim surveillance, and disease correlations…
                </span>
              </div>
            </div>
          )}

          {/* End of conversation stream */}
        </div>

        {/* Suggested Prompts Pills (Docked above input) */}
        <div className="px-4 py-2.5 border-t border-border/60 bg-secondary/20">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="h-3 w-3 text-primary" /> Quick:
            </span>
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                disabled={agentChat.isPending}
                onClick={() => void handleSendMessage(sample.prompt)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-foreground hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50 shadow-sm"
              >
                <span>{sample.icon}</span>
                <span className="font-medium">{sample.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sleek Floating Chat Input Dock */}
        <div className="p-3 sm:p-4 border-t border-border bg-card/90">
          <div className="relative rounded-2xl border border-border bg-secondary/30 p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms (e.g. fever for 3 days with chills and nausea in Wardha)... Press Enter to send."
              rows={2}
              maxLength={1000}
              className="w-full resize-none border-0 bg-transparent text-xs sm:text-sm text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground min-h-[50px]"
            />

            <div className="flex items-center justify-between pt-1.5 border-t border-border/40 px-1">
              {/* Left Action: Compact Voice Input */}
              <div className="flex items-center gap-2">
                <VoiceInput
                  value={inputText}
                  onChange={(val) => setInputText((prev) => (prev ? `${prev} ${val}` : val))}
                  compact={true}
                />
              </div>

              {/* Right Action: Character Count & Send Button */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {inputText.length}/1000
                </span>
                <Button
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={!inputText.trim() || agentChat.isPending}
                  size="sm"
                  className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-3.5 font-semibold shadow-sm"
                >
                  {agentChat.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <span className="text-xs">Send</span>
                      <Send className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-center text-muted-foreground">
            Clinical decision support only. Not a medical diagnosis or prescription. Always consult a certified healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}
