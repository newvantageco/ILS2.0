import * as React from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, Activity, Users, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SmartSearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  suggestions?: SearchResult[];
  className?: string;
}

export function SmartSearch({
  placeholder = "Search anything...",
  onSearch,
  suggestions = [],
  className,
}: SmartSearchProps) {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Mock search - replace with actual search logic
  React.useEffect(() => {
    if (query.length > 0) {
      // Simulate search
      const filtered = suggestions.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, suggestions]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.path) {
      window.location.href = result.path;
    }
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          className="pl-10 pr-16"
        />
        <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-semibold bg-muted rounded border">
          ⌘/
        </kbd>
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2 bg-popover border rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            {results.map((result, index) => {
              const Icon = result.icon || Package;
              return (
                <motion.button
                  key={result.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{result.category}</Badge>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {isOpen && query && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 w-full mt-2 bg-popover border rounded-lg shadow-lg p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
        </motion.div>
      )}
    </div>
  );
}

// Quick access search for common actions
export function QuickAccessSearch() {
  const quickActions: SearchResult[] = [
    {
      id: "1",
      title: "New Order",
      subtitle: "Create a new lens order",
      category: "Action",
      path: "/ecp/new-order",
      icon: Package,
    },
    {
      id: "2",
      title: "View Patients",
      subtitle: "Manage patient records",
      category: "Page",
      path: "/ecp/patients",
      icon: Users,
    },
    {
      id: "3",
      title: "Analytics",
      subtitle: "View business insights",
      category: "Page",
      path: "/ecp/bi-dashboard",
      icon: TrendingUp,
    },
    {
      id: "4",
      title: "Production Status",
      subtitle: "Monitor order production",
      category: "Page",
      path: "/lab/production",
      icon: Activity,
    },
  ];

  return <SmartSearch suggestions={quickActions} />;
}
