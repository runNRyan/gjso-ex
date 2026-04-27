"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRef } from "react"

interface SearchFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  categories: string[]
  isLoadingCategories?: boolean
}

export function SearchFilterBar({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  isLoadingCategories,
}: SearchFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="질문 검색..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange("all")}
          className="rounded-full shrink-0"
        >
          전체
        </Button>
        {isLoadingCategories ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 w-16 animate-pulse rounded-full bg-muted shrink-0"
              />
            ))}
          </>
        ) : (
          categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(category)}
              className="rounded-full shrink-0"
            >
              {category}
            </Button>
          ))
        )}
      </div>
    </div>
  )
}
