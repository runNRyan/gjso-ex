"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import type { QuestionTab, QuestionSort } from "@/hooks/use-questions"

interface QuestionToolbarProps {
  tab: QuestionTab
  onTabChange: (tab: QuestionTab) => void
  sortBy: QuestionSort
  onSortChange: (sort: QuestionSort) => void
  showMyVotes?: boolean
  onShowMyVotesChange?: (show: boolean) => void
  voteFilterMode?: 'hide' | 'only'
}

export function QuestionToolbar({
  tab,
  onTabChange,
  sortBy,
  onSortChange,
  showMyVotes = false,
  onShowMyVotesChange,
  voteFilterMode = 'hide',
}: QuestionToolbarProps) {
  return (
    <div className="space-y-3">
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as QuestionTab)}>
        <TabsList className="w-full">
          <TabsTrigger value="live" className="flex-1 font-bold text-green-500 data-[state=active]:bg-green-500 data-[state=active]:text-white">실시간</TabsTrigger>
          <TabsTrigger value="new" className="flex-1 font-bold text-blue-500 data-[state=active]:bg-blue-500 data-[state=active]:text-white">신규</TabsTrigger>
          <TabsTrigger value="closed" className="flex-1 font-bold text-gray-500 dark:text-gray-400 data-[state=active]:bg-gray-500 data-[state=active]:text-white">마감</TabsTrigger>
          <TabsTrigger value="legend" className="flex-1 font-bold text-amber-500 data-[state=active]:bg-amber-500 data-[state=active]:text-white">레전드</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'live' && (
        <p className="text-sm font-bold text-green-600 dark:text-green-400 text-center">
          현재 진행 중인 투표/예측 질문 리스트
        </p>
      )}
      {tab === 'new' && (
        <p className="text-sm font-bold text-blue-600 dark:text-blue-400 text-center">
          오늘 업데이트된 새로운 투표/예측 질문 리스트
        </p>
      )}
      {tab === 'closed' && (
        <p className="text-sm font-bold text-gray-600 dark:text-gray-400 text-center">
          투표와 예측이 종료된 질문 리스트
        </p>
      )}
      {tab === 'legend' && (
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400 text-center">
          황금밸런스 달성 질문은 '레전드'에서 이어 영구적 투표 진행!
        </p>
      )}

      <div className="flex items-center justify-between">
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as QuestionSort)}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">최신순</SelectItem>
            <SelectItem value="popular">투표수 많은 순</SelectItem>
          </SelectContent>
        </Select>

        {onShowMyVotesChange && (
          <Button
            variant={showMyVotes ? "secondary" : "ghost"}
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => onShowMyVotesChange(!showMyVotes)}
          >
            {showMyVotes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {voteFilterMode === 'only' ? '내 투표만' : '투표한 질문'}
          </Button>
        )}
      </div>
    </div>
  )
}
