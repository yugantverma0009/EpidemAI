import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bot, HeartPulse, Sparkles, User, ExternalLink, MapPin } from "lucide-react";
import { HealthPortalLayout } from "@/components/health/HealthPortalLayout";
import { useHealthProfile } from "@/components/health/HealthProfileContext";
import AgenticAssistantSection from "@/components/assistant/AgenticAssistantSection";

export default function AiAssistant() {
  const { profile, completion } = useHealthProfile();
  const [state, setState] = useState(profile.state || "");
  const [district, setDistrict] = useState(profile.district || "");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    if (profile.state && !state) setState(profile.state);
    if (profile.district && !district) setDistrict(profile.district);
  }, [profile.state, profile.district]);

  return (
    <HealthPortalLayout>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        {/* Top Header Card */}
        <header className="mb-6 rounded-3xl border border-border bg-gradient-to-b from-card to-card/70 p-6 sm:p-8 backdrop-blur-md shadow-[var(--shadow-card)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Bot className="h-3.5 w-3.5" /> Personal Health Assistant
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
                Personalized{" "}
                <span className="text-primary">
                  AI Assistance
                </span>
              </h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground max-w-3xl">
                Interactive clinical consultation with your <strong>Personal Health Assistant</strong>. Autonomously answers health inquiries, screens for red-flag emergencies, cross-references regional disease surveillance, and matches government welfare schemes.
              </p>
            </div>

            {/* Quick Context Card */}
            <div className="lg:w-80 rounded-2xl border border-border/80 bg-secondary/30 p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Personal Copilot Active
                </span>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Track 2
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Autonomous multi-tool orchestration with sub-millisecond local rule fallback for zero offline failure.
              </p>
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Prefer manual form?</span>
                <Link
                  to="/health-assistant"
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <HeartPulse className="h-3 w-3" /> Report symptoms
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Patient Profile Context Chip */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/25 to-teal-500/10 border border-primary/30 text-primary font-bold">
                {profile.displayName ? profile.displayName[0].toUpperCase() : <User className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">
                    {profile.displayName || "Guest Patient"}
                  </span>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {profile.ageGroup ? `${profile.ageGroup.replace("_", " ")} yrs` : "All ages"}
                    {profile.gender ? ` • ${profile.gender}` : ""}
                    {profile.bloodGroup ? ` • ${profile.bloodGroup}` : ""}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    ({completion}% profile ready)
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {profile.address ? `${profile.address}, ` : ""}
                  {district ? `${district}, ` : ""}{state || "Area not selected"}
                </p>
              </div>
            </div>

            <Link
              to="/health-profile"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              Update Profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Dedicated Agentic AI Section */}
        <AgenticAssistantSection
          state={state}
          setState={setState}
          district={district}
          setDistrict={setDistrict}
          profile={profile}
        />
      </main>
    </HealthPortalLayout>
  );
}
