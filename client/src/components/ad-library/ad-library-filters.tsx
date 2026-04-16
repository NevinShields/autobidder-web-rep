import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

type FilterOptions = {
  categories: string[];
  styleTags: string[];
  serviceTags: string[];
};

export function AdLibraryFilters({
  search,
  category,
  styleTag,
  serviceTag,
  availability,
  sort,
  options,
  onChange,
}: {
  search: string;
  category: string;
  styleTag: string;
  serviceTag: string;
  availability: string;
  sort: string;
  options: FilterOptions;
  onChange: (next: {
    search?: string;
    category?: string;
    styleTag?: string;
    serviceTag?: string;
    availability?: string;
    sort?: string;
  }) => void;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        <SlidersHorizontal className="h-4 w-4" />
        Search and Filters
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(0,1fr))]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Search by title, service, style, or tag"
            className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <Select value={category || "all"} onValueChange={(value) => onChange({ category: value === "all" ? "" : value })}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {options.categories.map((value) => (
              <SelectItem key={value} value={value}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={styleTag || "all"} onValueChange={(value) => onChange({ styleTag: value === "all" ? "" : value })}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <SelectValue placeholder="Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Styles</SelectItem>
            {options.styleTags.map((value) => (
              <SelectItem key={value} value={value}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={serviceTag || "all"} onValueChange={(value) => onChange({ serviceTag: value === "all" ? "" : value })}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {options.serviceTags.map((value) => (
              <SelectItem key={value} value={value}>{value}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={availability || "all"} onValueChange={(value) => onChange({ availability: value === "all" ? "" : value })}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Access</SelectItem>
            <SelectItem value="free">Free Access</SelectItem>
            <SelectItem value="premium">Paid Only</SelectItem>
            <SelectItem value="downloadable">Downloadable</SelectItem>
            <SelectItem value="customizable">Customizable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort || "featured"} onValueChange={(value) => onChange({ sort: value })}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="most_popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
