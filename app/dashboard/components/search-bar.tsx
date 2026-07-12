"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  // Sync state with url search param if it changes
  useEffect(() => {
    const searchVal = searchParams.get("search") || "";
    setQuery(searchVal);
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to the Asset Directory page with search query
    router.push(`/dashboard/assets?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full max-w-md relative group">
      <Search size={16} className="absolute left-3 text-[#9CA3AF] group-focus-within:text-[#6ecfa3] transition-colors" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search assets, serial number, vendor..."
        className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg pl-10 pr-12 py-2 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#6ecfa3]/50 focus:border-[#6ecfa3] transition-all shadow-sm"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
        <span className="text-[10px] font-bold text-[#6B7280] bg-white border border-[#E5E7EB] px-1.5 py-0.5 rounded shadow-sm">
          Ctrl+K
        </span>
      </div>
    </form>
  );
}
