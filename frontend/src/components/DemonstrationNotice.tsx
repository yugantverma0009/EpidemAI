import { Database } from "lucide-react";

export default function DemonstrationNotice({ className = "" }: { className?: string }) {
  return <div className={`flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] font-medium text-muted-foreground ${className}`}>
    <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    <span>Sample dataset</span>
  </div>;
}
