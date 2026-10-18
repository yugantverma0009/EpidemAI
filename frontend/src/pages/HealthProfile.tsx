import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Check, MapPin, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HealthPortalLayout } from "@/components/health/HealthPortalLayout";
import { useHealthProfile } from "@/components/health/HealthProfileContext";

const fieldClass = "min-h-11 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function HealthProfile() {
  const { profile, setProfile, clearProfile } = useHealthProfile();
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof typeof draft, value: string) => {
    setDraft((old) => ({ ...old, [key]: value }));
    setSaved(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfile(draft);
    setSaved(true);
  };

  const clear = () => {
    clearProfile();
    setDraft({ displayName: "", ageGroup: "", gender: "", preferredLanguage: "en", state: "", district: "" });
    setSaved(false);
  };

  return <HealthPortalLayout>
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 sm:px-6 sm:pt-10">
      <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"><UserRound className="h-3.5 w-3.5" /> Individual Health Portal</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">My profile</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Add optional details to personalize this visit. You can use the health assistant without completing this profile.</p>

      <div className="mt-6 rounded-xl border border-primary/25 bg-primary/10 p-4 text-sm leading-6 text-foreground">
        <p className="flex items-center gap-2 font-semibold text-primary"><ShieldCheck className="h-4 w-4 text-primary" /> Profile privacy</p>
        <p className="mt-1 text-muted-foreground">These details stay in app memory and are cleared when you reload or close this page. Your name and preferred language are not sent to the backend. If you enter symptoms and request local context, state, district, age group, and gender are used to predict likely diseases and recommend targeted diagnostic tests to reduce unnecessary lab costs. No account or secure profile storage is configured.</p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-7">
        <section aria-labelledby="personal-details-heading">
          <h2 id="personal-details-heading" className="text-base font-semibold text-foreground">Personal details <span className="font-normal text-muted-foreground">(optional)</span></h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-foreground">Display name
              <Input className={fieldClass} value={draft.displayName} maxLength={80} autoComplete="given-name" onChange={(event) => update("displayName", event.target.value)} placeholder="Name to use in this visit" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-foreground">Age group
              <select className={fieldClass + " w-full"} value={draft.ageGroup} onChange={(event) => update("ageGroup", event.target.value)}>
                <option value="">Prefer not to say</option><option value="under-18">Under 18</option><option value="18-29">18–29</option><option value="30-44">30–44</option><option value="45-59">45–59</option><option value="60-plus">60 or older</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-foreground">Gender
              <select className={fieldClass + " w-full"} value={draft.gender} onChange={(event) => update("gender", event.target.value)}>
                <option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-foreground">Preferred language
              <select className={fieldClass + " w-full"} value={draft.preferredLanguage} onChange={(event) => update("preferredLanguage", event.target.value)}>
                <option value="en">English</option><option value="hi">Hindi</option>
              </select>
              <span className="block text-xs font-normal text-muted-foreground">Used for clinical guidance display when translations are enabled.</span>
            </label>
          </div>
        </section>

        <section aria-labelledby="approximate-location-heading" className="border-t border-border pt-5">
          <h2 id="approximate-location-heading" className="flex items-center gap-2 text-base font-semibold text-foreground"><MapPin className="h-4 w-4 text-primary" /> Approximate location <span className="font-normal text-muted-foreground">(optional)</span></h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">When you request local context with a symptom report, state and district are used to find available historical health records for your area. The source data is district-level, so a street address or house number would not improve the result and is not collected.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-foreground">State / Union Territory
              <Input className={fieldClass} value={draft.state} maxLength={100} autoComplete="address-level1" onChange={(event) => update("state", event.target.value)} placeholder="e.g. Delhi" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-foreground">District
              <Input className={fieldClass} value={draft.district} maxLength={100} autoComplete="address-level2" onChange={(event) => update("district", event.target.value)} placeholder="e.g. New Delhi" />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <Button type="submit" className="min-h-11 bg-primary text-primary-foreground hover:bg-primary/90"><Check className="mr-2 h-4 w-4" />Save for this visit</Button>
          <Button type="button" variant="outline" onClick={clear} className="min-h-11 border-border text-foreground hover:bg-secondary"><Trash2 className="mr-2 h-4 w-4" />Clear profile</Button>
          {saved && <p role="status" className="w-full text-sm font-medium text-primary">Profile details are available for this visit only and will clear when you leave or reload.</p>}
        </div>
      </form>
      <p className="mt-5 text-sm text-muted-foreground">Continue to <Link to="/health-assistant" className="font-semibold text-primary underline underline-offset-2">report symptoms</Link> or return to the <Link to="/health-portal" className="font-semibold text-primary underline underline-offset-2">portal home</Link>.</p>
    </div>
  </HealthPortalLayout>;
}
