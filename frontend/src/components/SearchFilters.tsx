import { Search } from "lucide-react";
import { allDiseases } from "@/hooks/useApi";

interface Props {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedDisease: string;
  onDiseaseChange: (v: string) => void;
}

export default function SearchFilters({ searchQuery, onSearchChange, selectedDisease, onDiseaseChange }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search city..."
          className="h-9 w-full rounded-lg border border-border bg-secondary/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
      <select
        value={selectedDisease}
        onChange={(e) => onDiseaseChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none"
      >
        <option value="">All Diseases</option>
        {allDiseases.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}
