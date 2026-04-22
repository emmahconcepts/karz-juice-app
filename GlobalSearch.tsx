import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, User, Calendar, Receipt, Package, DollarSign, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type ResultType = "client" | "function" | "receipt" | "product" | "account" | "transaction";

interface SearchResult {
  id: string | number;
  type: ResultType;
  title: string;
  subtitle?: string;
  path: string;
}

const TYPE_META: Record<ResultType, { icon: React.ElementType; color: string; label: string }> = {
  client:      { icon: User,     color: "text-blue-400",   label: "Client" },
  function:    { icon: Calendar, color: "text-amber-400",  label: "Event" },
  receipt:     { icon: Receipt,  color: "text-secondary",  label: "Receipt" },
  product:     { icon: Package,  color: "text-purple-400", label: "Product" },
  account:     { icon: DollarSign, color: "text-cyan-400", label: "Account" },
  transaction: { icon: ArrowRight, color: "text-muted-foreground", label: "Transaction" },
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const searchQuery = trpc.search?.globalSearch?.useQuery?.(
    { query },
    { enabled: query.length >= 2, staleTime: 5000 }
  );

  // Map API results to unified format
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    if (searchQuery?.isLoading) { setLoading(true); return; }
    setLoading(false);

    const raw = searchQuery?.data;
    if (!raw) {
      // Fallback: client-side stub so UI is always usable even without API
      setResults([]);
      return;
    }

    const mapped: SearchResult[] = [
      ...(raw.clients ?? []).map((c: any) => ({ id: c.id, type: "client" as ResultType, title: c.clientName, subtitle: c.phone, path: `/receivables?client=${c.id}` })),
      ...(raw.functions ?? []).map((f: any) => ({ id: f.id, type: "function" as ResultType, title: f.clientName, subtitle: f.eventType, path: `/functions?id=${f.id}` })),
      ...(raw.receipts ?? []).map((r: any) => ({ id: r.id, type: "receipt" as ResultType, title: r.receiptNumber, subtitle: r.clientName, path: `/client-receipts?id=${r.id}` })),
      ...(raw.products ?? []).map((p: any) => ({ id: p.id, type: "product" as ResultType, title: p.name, subtitle: p.sku, path: `/products?id=${p.id}` })),
      ...(raw.accounts ?? []).map((a: any) => ({ id: a.id, type: "account" as ResultType, title: a.accountName ?? a.name, subtitle: a.accountCode ?? a.code, path: `/accounts?id=${a.id}` })),
      ...(raw.transactions ?? []).map((t: any) => ({ id: t.id, type: "transaction" as ResultType, title: t.description, subtitle: `UGX ${Number(t.amount).toLocaleString()}`, path: `/accounts` })),
    ];
    setResults(mapped.slice(0, 12));
  }, [searchQuery?.data, searchQuery?.isLoading, query]);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(result: SearchResult) {
    navigate(result.path);
    setOpen(false);
    setQuery("");
  }

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Trigger */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden sm:flex items-center gap-0.5 text-xs bg-background border border-border rounded px-1 py-0.5 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-[420px] max-w-[95vw] z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search size={14} className="text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search clients, events, receipts, products…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto">
            {query.length < 2 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No results for "<strong>{query}</strong>"
              </div>
            ) : (
              <ul>
                {results.map((r, i) => {
                  const meta = TYPE_META[r.type];
                  const Icon = meta.icon;
                  return (
                    <li key={`${r.type}-${r.id}-${i}`}>
                      <button
                        onClick={() => handleSelect(r)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 text-left transition-colors"
                      >
                        <Icon size={14} className={`flex-shrink-0 ${meta.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded bg-muted/40 ${meta.color} flex-shrink-0`}>
                          {meta.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}
