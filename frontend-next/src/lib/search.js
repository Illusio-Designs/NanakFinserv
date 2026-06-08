"use client";
import { createContext, useContext, useState } from "react";

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");
  return <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>;
}

// Safe default when used outside a provider (e.g. the /widgets showcase).
export function useSearch() {
  return useContext(SearchContext) || { query: "", setQuery: () => {} };
}
