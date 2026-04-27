'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createQuestion,
  bulkCreateQuestions,
  fetchDraftQuestions,
  publishQuestion,
  deleteQuestion,
  fetchPublishedQuestions,
  fetchClosedQuestions,
  updateQuestion,
  unpublishQuestion,
  deletePublishedQuestion,
  getQuestionStats,
  fetchCommentsForAdmin,
  softDeleteComment,
  fetchSuggestedQuestions,
  updateSuggestionStatus,
  fetchAdminDashboard,
} from '@/lib/admin/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload, Plus, Trash2, Send, Download, List, Edit, EyeOff, MessageSquare, Lightbulb, Check, X } from 'lucide-react'
import Link from 'next/link'

type Tab = 'questions' | 'individual' | 'csv' | 'suggestions'
type QuestionFilter = 'all' | 'published' | 'scheduled' | 'closed' | 'drafts'
type Status = 'draft' | 'published'

interface ParsedQuestion {
  no: string
  category: string
  title: string
  option_a: string
  option_b: string
  start_date: string
  end_date: string
  status: Status
}

interface DraftQuestion {
  id: string
  title: string
  option_a: string
  option_b: string
  category: string | null
  status: string | null
  published_at: string | null
  close_at: string | null
  created_at: string | null
}

interface PublishedQuestion extends DraftQuestion {
  vote_count_a: number
  vote_count_b: number
  closed_at: string | null
  balance_type: string | null
  comment_count: number | null
}

interface QuestionStats {
  totalQuestions: number
  publishedCount: number
  draftCount: number
  closedCount: number
  activeCount: number
  scheduledCount: number
  totalVotes: number
}

interface AdminComment {
  id: string
  content: string
  is_deleted: boolean | null
  created_at: string | null
  user_id: string | null
  guest_nickname: string | null
  question_id: string
  parent_id: string | null
  questions: {
    title: string
  } | null
  profiles: {
    nickname: string
  } | null
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCSV(text: string): ParsedQuestion[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  return lines.slice(1).reduce<ParsedQuestion[]>((acc, line) => {
    const fields = parseCSVLine(line)
    if (fields.length >= 5 && fields[2] && fields[3] && fields[4]) {
      const publish = (fields[7] || '').trim().toUpperCase()
      acc.push({
        no: fields[0] || '',
        category: fields[1] || '',
        title: fields[2],
        option_a: fields[3],
        option_b: fields[4],
        start_date: normalizeDate(fields[5] || ''),
        end_date: normalizeDate(fields[6] || ''),
        status: publish === 'O' ? 'published' : 'draft',
      })
    }
    return acc
  }, [])
}

function getTodayDateString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function calcDaysBetween(start: string, end: string): number | null {
  if (!start || !end) return null
  const s = new Date(start)
  const e = new Date(end)
  const diff = e.getTime() - s.getTime()
  if (diff <= 0) return null
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm'

function DateRangeFields({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string
  endDate: string
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
}) {
  const days = calcDaysBetween(startDate, endDate)

  const endError = endDate && startDate && endDate <= startDate

  return (
    <div className="space-y-3 rounded-md border border-input p-4 bg-muted/30">
      <p className="text-sm font-medium">게시 기간</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">시작일</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">종료일</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
          {endError && (
            <p className="text-xs text-red-500">종료일은 시작일 이후여야 합니다</p>
          )}
        </div>
      </div>
      {days !== null && !endError && (
        <p className="text-sm text-primary font-medium text-center">
          {days}일간 진행
        </p>
      )}
    </div>
  )
}

function isDateRangeValid(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return true
  if (endDate <= startDate) return false
  return true
}

function buildAdminCommentTree(comments: AdminComment[]): (AdminComment & { replies: AdminComment[] })[] {
  const map = new Map<string, AdminComment & { replies: AdminComment[] }>()
  const roots: (AdminComment & { replies: AdminComment[] })[] = []

  comments.forEach(c => map.set(c.id, { ...c, replies: [] }))

  comments.forEach(c => {
    const node = map.get(c.id)!
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export default function AdminQuestionsPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('questions')
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('all')

  const [title, setTitle] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<Status>('draft')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [creating, setCreating] = useState(false)

  const [csvQuestions, setCsvQuestions] = useState<ParsedQuestion[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [drafts, setDrafts] = useState<DraftQuestion[]>([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Published questions state
  const [publishedQuestions, setPublishedQuestions] = useState<PublishedQuestion[]>([])
  const [loadingPublished, setLoadingPublished] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Closed questions state
  const [closedQuestions, setClosedQuestions] = useState<PublishedQuestion[]>([])
  const [loadingClosed, setLoadingClosed] = useState(false)

  // Dashboard state
  const [stats, setStats] = useState<QuestionStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Per-question comments state
  const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null)
  const [questionComments, setQuestionComments] = useState<Record<string, AdminComment[]>>({})
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Suggestions state
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; option_a: string; option_b: string; status: string | null; created_at: string | null; user_id: string; profiles: { nickname: string } | null }[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'new' | 'reviewed' | 'used'>('all')
  const [adoptingId, setAdoptingId] = useState<string | null>(null)
  const [adoptForm, setAdoptForm] = useState({ title: '', option_a: '', option_b: '' })

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setIsAdmin(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()
      setIsAdmin(profile?.user_type === 'admin')
    }
    checkAdmin()
  }, [])

  const loadDashboard = async () => {
    setLoadingPublished(true)
    setLoadingClosed(true)
    setLoadingDrafts(true)
    setLoadingStats(true)

    const result = await fetchAdminDashboard({
      filter: questionFilter,
      search: searchQuery || undefined,
      category: filterCategory || undefined,
    })

    if (!result.error) {
      if (result.stats) setStats(result.stats)
      if (result.published) setPublishedQuestions(result.published as PublishedQuestion[])
      if (result.closed) setClosedQuestions(result.closed as PublishedQuestion[])
      if (result.drafts) setDrafts(result.drafts)
    }

    setLoadingPublished(false)
    setLoadingClosed(false)
    setLoadingDrafts(false)
    setLoadingStats(false)
  }

  const loadQuestionComments = async (questionId: string) => {
    setCommentsLoading(true)
    const result = await fetchCommentsForAdmin({ questionId })
    if (!result.error) {
      setQuestionComments((prev) => ({ ...prev, [questionId]: result.data }))
    }
    setCommentsLoading(false)
  }

  const loadSuggestions = async () => {
    setLoadingSuggestions(true)
    const result = await fetchSuggestedQuestions({
      status: suggestionFilter === 'all' ? undefined : suggestionFilter as 'new' | 'reviewed' | 'used',
    })
    if (!result.error) {
      setSuggestions(result.data as typeof suggestions)
    }
    setLoadingSuggestions(false)
  }

  useEffect(() => {
    if (isAdmin && activeTab === 'questions') {
      void loadDashboard()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, questionFilter])

  useEffect(() => {
    if (isAdmin && activeTab === 'questions') {
      const timer = setTimeout(() => {
        void loadDashboard()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery, filterCategory])

  useEffect(() => {
    if (isAdmin && activeTab === 'suggestions') {
      void loadSuggestions()
    }
  }, [isAdmin, activeTab, suggestionFilter])

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">관리자 권한이 필요합니다.</p>
        <Link href="/" className="text-primary underline">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if ((startDate || endDate) && !isDateRangeValid(startDate, endDate)) {
      setMessage({ type: 'error', text: '날짜를 확인해주세요. 시작일은 미래, 종료일은 시작일 이후여야 합니다.' })
      return
    }

    setCreating(true)

    const result = await createQuestion({
      title,
      option_a: optionA,
      option_b: optionB,
      category: category || undefined,
      status,
      published_at: startDate ? new Date(startDate).toISOString() : undefined,
      close_at: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
    })

    setCreating(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: '질문이 생성되었습니다.' })
    setTitle('')
    setOptionA('')
    setOptionB('')
    setCategory('')
    setStartDate('')
    setEndDate('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null)
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setMessage({ type: 'error', text: 'CSV 파일에서 유효한 질문을 찾을 수 없습니다.' })
        return
      }
      setCsvQuestions(parsed)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleBulkUpload = async () => {
    setMessage(null)

    const invalidDate = csvQuestions.find(
      (q) => (q.start_date || q.end_date) && !isDateRangeValid(q.start_date, q.end_date)
    )
    if (invalidDate) {
      setMessage({ type: 'error', text: `"${invalidDate.title}" 날짜가 유효하지 않습니다. 시작일은 오늘부터, 종료일은 시작일 이후여야 합니다.` })
      return
    }

    setUploading(true)

    const questions = csvQuestions.map((q) => ({
      title: q.title,
      option_a: q.option_a,
      option_b: q.option_b,
      category: q.category || undefined,
      status: q.status,
      published_at: q.start_date ? new Date(q.start_date).toISOString() : undefined,
      close_at: q.end_date ? new Date(q.end_date + 'T23:59:59').toISOString() : undefined,
    }))

    const result = await bulkCreateQuestions(questions)

    setUploading(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: `${result.count}건의 질문이 생성되었습니다.` })
    setCsvQuestions([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePublish = async (id: string) => {
    setMessage(null)
    setPublishingId(id)

    const result = await publishQuestion(id)

    setPublishingId(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: '질문이 게시되었습니다.' })
    setEditingId(null)
    setDrafts((prev) => prev.filter((d) => d.id !== id))
    await loadDashboard()
  }

  const handleDelete = async (id: string) => {
    setMessage(null)
    setDeletingId(id)

    const result = await deleteQuestion(id)

    setDeletingId(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: '질문이 삭제되었습니다.' })
    setDrafts((prev) => prev.filter((d) => d.id !== id))
  }

  const handleUnpublish = async (id: string) => {
    if (!confirm('이 질문을 비공개 처리하시겠습니까?')) return

    setMessage(null)
    setPublishingId(id)

    const result = await unpublishQuestion(id)

    setPublishingId(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: '질문이 비공개 처리되었습니다.' })
    await loadDashboard()
  }

  const handleDeletePublished = async (id: string) => {
    if (!confirm('이 질문을 삭제하시겠습니까? 투표가 있는 질문은 삭제할 수 없습니다.')) return

    setMessage(null)
    setDeletingId(id)

    const result = await deletePublishedQuestion(id)

    setDeletingId(null)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      return
    }

    setMessage({ type: 'success', text: '질문이 삭제되었습니다.' })
    await loadDashboard()
  }

  const handleSoftDeleteComment = async (id: string, questionId: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return

    setMessage(null)
    const result = await softDeleteComment(id)
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
      return
    }
    setMessage({ type: 'success', text: '댓글이 삭제되었습니다.' })
    await loadQuestionComments(questionId)
  }



  const previewQuestions = csvQuestions.slice(0, 10)
  const remainingCount = csvQuestions.length - previewQuestions.length

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'questions', label: '질문 목록', icon: <List className="inline-block h-4 w-4 mr-1" /> },
    { key: 'suggestions', label: '제보 관리', icon: <Lightbulb className="inline-block h-4 w-4 mr-1" /> },
    { key: 'individual', label: '개별 생성', icon: <Plus className="inline-block h-4 w-4 mr-1" /> },
    { key: 'csv', label: 'CSV 업로드', icon: <Upload className="inline-block h-4 w-4 mr-1" /> },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">질문 관리</h1>

          {message && (
            <div
              className={`rounded-md px-4 py-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-2 border-b overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key)
                  setMessage(null)
                }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* 질문 목록 (대시보드 + 게시된/종료된 질문 통합) */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              {/* 통계 카드 */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('all')}
                    className={`rounded-lg border p-6 text-left transition-colors cursor-pointer ${questionFilter === 'all' ? 'ring-2 ring-primary' : 'bg-card'}`}
                  >
                    <div className="text-sm text-muted-foreground mb-2">총 질문 수</div>
                    <div className="text-3xl font-bold">{stats.totalQuestions}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('published')}
                    className={`rounded-lg border p-6 text-left transition-colors cursor-pointer ${questionFilter === 'published' ? 'ring-2 ring-primary' : 'bg-card'}`}
                  >
                    <div className="text-sm text-muted-foreground mb-2">Live 질문</div>
                    <div className="text-3xl font-bold text-green-600">{stats.activeCount}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('scheduled')}
                    className={`rounded-lg border p-6 text-left transition-colors cursor-pointer ${questionFilter === 'scheduled' ? 'ring-2 ring-primary' : 'bg-card'}`}
                  >
                    <div className="text-sm text-muted-foreground mb-2">예약됨</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.scheduledCount}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('drafts')}
                    className={`rounded-lg border p-6 text-left transition-colors cursor-pointer ${questionFilter === 'drafts' ? 'ring-2 ring-primary' : 'bg-card'}`}
                  >
                    <div className="text-sm text-muted-foreground mb-2">검토 중</div>
                    <div className="text-3xl font-bold text-amber-600">{stats.draftCount}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionFilter('closed')}
                    className={`rounded-lg border p-6 text-left transition-colors cursor-pointer ${questionFilter === 'closed' ? 'ring-2 ring-primary' : 'bg-card'}`}
                  >
                    <div className="text-sm text-muted-foreground mb-2">종료된 질문</div>
                    <div className="text-3xl font-bold text-gray-600">{stats.closedCount}</div>
                  </button>
                </div>
              )}

              {/* 검색 */}
              <div className="flex gap-2">
                <Input
                  placeholder="질문 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="카테고리 필터..."
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-40"
                />
              </div>

              {/* 질문 리스트 */}
              {(loadingPublished || loadingClosed) ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 예약된 질문 (published_at > now) */}
                  {(questionFilter === 'all' || questionFilter === 'scheduled') && publishedQuestions
                    .filter((q) => q.published_at && new Date(q.published_at) > new Date())
                    .map((question) => {
                    const totalVotes = question.vote_count_a + question.vote_count_b
                    const percentA = totalVotes > 0 ? Math.round((question.vote_count_a / totalVotes) * 100) : 0
                    const percentB = totalVotes > 0 ? Math.round((question.vote_count_b / totalVotes) * 100) : 0
                    const isEditing = editingId === question.id

                    return (
                      <div
                        key={question.id}
                        className="rounded-md border p-4 space-y-3 border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/20"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              예약됨
                            </span>
                            {question.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {question.category}
                              </span>
                            )}
                            {question.published_at && (
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                게시일: {new Date(question.published_at).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </div>
                          <p
                            className="font-medium hover:text-primary cursor-pointer transition-colors"
                            onClick={() => router.push(`/questions/${question.id}`)}
                          >
                            {question.title}
                          </p>
                          <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                            <span>A: {question.option_a}</span>
                            <span>B: {question.option_b}</span>
                          </div>
                        </div>

                        {question.close_at && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                            <span>
                              종료 예정: {new Date(question.close_at).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(isEditing ? null : question.id)}
                            disabled={publishingId === question.id || deletingId === question.id}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {isEditing ? '취소' : '수정'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnpublish(question.id)}
                            disabled={publishingId === question.id || deletingId === question.id}
                          >
                            {publishingId === question.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <EyeOff className="h-3 w-3 mr-1" />
                            )}
                            비공개
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePublished(question.id)}
                            disabled={publishingId === question.id || deletingId === question.id}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            {deletingId === question.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            삭제
                          </Button>
                        </div>

                        {isEditing && (
                          <div className="mt-4 p-4 border-t space-y-3">
                            <p className="text-sm font-medium mb-2">질문 수정</p>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-title-${question.id}`}>제목</Label>
                              <Input
                                id={`edit-title-${question.id}`}
                                defaultValue={question.title}
                                onBlur={async (e) => {
                                  if (e.target.value !== question.title) {
                                    const result = await updateQuestion(question.id, { title: e.target.value })
                                    if (result.error) {
                                      setMessage({ type: 'error', text: result.error })
                                    } else {
                                      setMessage({ type: 'success', text: '제목이 수정되었습니다.' })
                                      await loadDashboard()
                                    }
                                  }
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor={`edit-option-a-${question.id}`}>선택지 A</Label>
                                <Input
                                  id={`edit-option-a-${question.id}`}
                                  defaultValue={question.option_a}
                                  onBlur={async (e) => {
                                    if (e.target.value !== question.option_a) {
                                      const result = await updateQuestion(question.id, { option_a: e.target.value })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '선택지 A가 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`edit-option-b-${question.id}`}>선택지 B</Label>
                                <Input
                                  id={`edit-option-b-${question.id}`}
                                  defaultValue={question.option_b}
                                  onBlur={async (e) => {
                                    if (e.target.value !== question.option_b) {
                                      const result = await updateQuestion(question.id, { option_b: e.target.value })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '선택지 B가 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-category-${question.id}`}>카테고리</Label>
                              <Input
                                id={`edit-category-${question.id}`}
                                defaultValue={question.category || ''}
                                onBlur={async (e) => {
                                  if (e.target.value !== (question.category || '')) {
                                    const result = await updateQuestion(question.id, { category: e.target.value || undefined })
                                    if (result.error) {
                                      setMessage({ type: 'error', text: result.error })
                                    } else {
                                      setMessage({ type: 'success', text: '카테고리가 수정되었습니다.' })
                                      await loadDashboard()
                                    }
                                  }
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor={`edit-start-${question.id}`}>시작일</Label>
                                <Input
                                  id={`edit-start-${question.id}`}
                                  type="date"
                                  defaultValue={question.published_at ? normalizeDate(question.published_at) : ''}
                                  onBlur={async (e) => {
                                    const newVal = e.target.value
                                    const oldVal = question.published_at ? normalizeDate(question.published_at) : ''
                                    if (newVal !== oldVal) {
                                      const result = await updateQuestion(question.id, {
                                        published_at: newVal ? new Date(newVal).toISOString() : undefined,
                                      })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '시작일이 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`edit-end-${question.id}`}>종료일</Label>
                                <Input
                                  id={`edit-end-${question.id}`}
                                  type="date"
                                  defaultValue={question.close_at ? normalizeDate(question.close_at) : ''}
                                  onBlur={async (e) => {
                                    const newVal = e.target.value
                                    const oldVal = question.close_at ? normalizeDate(question.close_at) : ''
                                    if (newVal !== oldVal) {
                                      const result = await updateQuestion(question.id, {
                                        close_at: newVal ? new Date(newVal + 'T23:59:59').toISOString() : undefined,
                                      })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '종료일이 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Live 질문 (published_at <= now) */}
                  {(questionFilter === 'all' || questionFilter === 'published') && publishedQuestions
                    .filter((q) => !q.published_at || new Date(q.published_at) <= new Date())
                    .map((question) => {
                    const totalVotes = question.vote_count_a + question.vote_count_b
                    const percentA = totalVotes > 0 ? Math.round((question.vote_count_a / totalVotes) * 100) : 0
                    const percentB = totalVotes > 0 ? Math.round((question.vote_count_b / totalVotes) * 100) : 0
                    const isEditing = editingId === question.id

                    return (
                      <div
                        key={question.id}
                        className="rounded-md border p-4 space-y-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Live
                            </span>
                            {question.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {question.category}
                              </span>
                            )}
                            {question.balance_type && question.balance_type !== 'normal' && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                question.balance_type === 'golden' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {question.balance_type}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {question.published_at
                                ? new Date(question.published_at).toLocaleDateString('ko-KR')
                                : ''}
                            </span>
                          </div>
                          <p
                            className="font-medium hover:text-primary cursor-pointer transition-colors"
                            onClick={() => router.push(`/questions/${question.id}`)}
                          >
                            {question.title}
                          </p>
                          <div className="text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-2">
                              <span>A: {question.option_a}</span>
                              <span className="text-xs text-green-600 font-medium">
                                {question.vote_count_a}표 ({percentA}%)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>B: {question.option_b}</span>
                              <span className="text-xs text-red-600 font-medium">
                                {question.vote_count_b}표 ({percentB}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        {question.close_at && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                            <span>
                              종료일: {new Date(question.close_at).toLocaleDateString('ko-KR')}
                            </span>
                            {question.closed_at && (
                              <span className="text-red-600">
                                (종료됨: {new Date(question.closed_at).toLocaleDateString('ko-KR')})
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(isEditing ? null : question.id)}
                            disabled={publishingId === question.id || deletingId === question.id}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {isEditing ? '취소' : '수정'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnpublish(question.id)}
                            disabled={publishingId === question.id || deletingId === question.id}
                          >
                            {publishingId === question.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <EyeOff className="h-3 w-3 mr-1" />
                            )}
                            비공개
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePublished(question.id)}
                            disabled={publishingId === question.id || deletingId === question.id}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            {deletingId === question.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            삭제
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (commentsOpenId === question.id) {
                                setCommentsOpenId(null)
                              } else {
                                setCommentsOpenId(question.id)
                                void loadQuestionComments(question.id)
                              }
                            }}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            댓글 {question.comment_count || 0}
                          </Button>
                        </div>

                        {commentsOpenId === question.id && (
                          <div className="border-t pt-3 space-y-2">
                            <p className="text-sm font-medium">댓글</p>
                            {commentsLoading ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : (questionComments[question.id] || []).length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">댓글이 없습니다.</p>
                            ) : (
                              (() => {
                                const tree = buildAdminCommentTree(questionComments[question.id] || [])
                                return tree.map((comment) => {
                                  const authorName = comment.profiles?.nickname || comment.guest_nickname || '익명'
                                  const isDeleted = comment.is_deleted
                                  return (
                                    <div key={comment.id} className="space-y-1">
                                      <div className={`flex items-start justify-between gap-2 rounded px-3 py-2 text-sm ${isDeleted ? 'bg-muted/30' : 'bg-muted/50'}`}>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium">{authorName}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {comment.created_at ? new Date(comment.created_at).toLocaleDateString('ko-KR') : ''}
                                            </span>
                                            {isDeleted && (
                                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">삭제됨</span>
                                            )}
                                          </div>
                                          <p className={`text-sm ${isDeleted ? 'text-muted-foreground line-through' : ''}`}>
                                            {isDeleted ? '삭제된 댓글입니다' : comment.content}
                                          </p>
                                        </div>
                                        {!isDeleted && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSoftDeleteComment(comment.id, question.id)}
                                            className="text-red-500 hover:text-red-600 h-7 px-2 flex-shrink-0"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      {comment.replies.length > 0 && (
                                        <div className="ml-6 border-l-2 border-muted pl-3 space-y-1">
                                          {comment.replies.map((reply) => {
                                            const replyAuthor = reply.profiles?.nickname || reply.guest_nickname || '익명'
                                            const replyDeleted = reply.is_deleted
                                            return (
                                              <div key={reply.id} className={`flex items-start justify-between gap-2 rounded px-3 py-2 text-sm ${replyDeleted ? 'bg-muted/20' : 'bg-muted/30'}`}>
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs text-muted-foreground">↳</span>
                                                    <span className="text-xs font-medium">{replyAuthor}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                      {reply.created_at ? new Date(reply.created_at).toLocaleDateString('ko-KR') : ''}
                                                    </span>
                                                    {replyDeleted && (
                                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">삭제됨</span>
                                                    )}
                                                  </div>
                                                  <p className={`text-sm ${replyDeleted ? 'text-muted-foreground line-through' : ''}`}>
                                                    {replyDeleted ? '삭제된 댓글입니다' : reply.content}
                                                  </p>
                                                </div>
                                                {!replyDeleted && (
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSoftDeleteComment(reply.id, question.id)}
                                                    className="text-red-500 hover:text-red-600 h-7 px-2 flex-shrink-0"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })
                              })()
                            )}
                          </div>
                        )}

                        {isEditing && (
                          <div className="mt-4 p-4 border-t space-y-3">
                            <p className="text-sm font-medium mb-2">질문 수정</p>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-title-${question.id}`}>제목</Label>
                              <Input
                                id={`edit-title-${question.id}`}
                                defaultValue={question.title}
                                onBlur={async (e) => {
                                  if (e.target.value !== question.title) {
                                    const result = await updateQuestion(question.id, { title: e.target.value })
                                    if (result.error) {
                                      setMessage({ type: 'error', text: result.error })
                                    } else {
                                      setMessage({ type: 'success', text: '제목이 수정되었습니다.' })
                                      await loadDashboard()
                                    }
                                  }
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor={`edit-option-a-${question.id}`}>선택지 A</Label>
                                <Input
                                  id={`edit-option-a-${question.id}`}
                                  defaultValue={question.option_a}
                                  onBlur={async (e) => {
                                    if (e.target.value !== question.option_a) {
                                      const result = await updateQuestion(question.id, { option_a: e.target.value })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '선택지 A가 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`edit-option-b-${question.id}`}>선택지 B</Label>
                                <Input
                                  id={`edit-option-b-${question.id}`}
                                  defaultValue={question.option_b}
                                  onBlur={async (e) => {
                                    if (e.target.value !== question.option_b) {
                                      const result = await updateQuestion(question.id, { option_b: e.target.value })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '선택지 B가 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-category-${question.id}`}>카테고리</Label>
                              <Input
                                id={`edit-category-${question.id}`}
                                defaultValue={question.category || ''}
                                onBlur={async (e) => {
                                  if (e.target.value !== (question.category || '')) {
                                    const result = await updateQuestion(question.id, { category: e.target.value || undefined })
                                    if (result.error) {
                                      setMessage({ type: 'error', text: result.error })
                                    } else {
                                      setMessage({ type: 'success', text: '카테고리가 수정되었습니다.' })
                                      await loadDashboard()
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* 종료된 질문 */}
                  {(questionFilter === 'all' || questionFilter === 'closed') && closedQuestions.map((question) => {
                    const totalVotes = question.vote_count_a + question.vote_count_b
                    const percentA = totalVotes > 0 ? Math.round((question.vote_count_a / totalVotes) * 100) : 0
                    const percentB = totalVotes > 0 ? Math.round((question.vote_count_b / totalVotes) * 100) : 0

                    return (
                      <div
                        key={question.id}
                        className="rounded-md border p-4 space-y-3 bg-muted/20"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              종료됨
                            </span>
                            {question.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {question.category}
                              </span>
                            )}
                            {question.balance_type && question.balance_type !== 'normal' && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                question.balance_type === 'golden' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {question.balance_type}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {question.closed_at
                                ? `종료: ${new Date(question.closed_at).toLocaleDateString('ko-KR')}`
                                : ''}
                            </span>
                          </div>
                          <p
                            className="font-medium hover:text-primary cursor-pointer transition-colors"
                            onClick={() => router.push(`/questions/${question.id}`)}
                          >
                            {question.title}
                          </p>
                          <div className="text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-2">
                              <span>A: {question.option_a}</span>
                              <span className="text-xs text-green-600 font-medium">
                                {question.vote_count_a}표 ({percentA}%)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>B: {question.option_b}</span>
                              <span className="text-xs text-red-600 font-medium">
                                {question.vote_count_b}표 ({percentB}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                          {question.published_at && (
                            <span>
                              시작: {new Date(question.published_at).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                          {question.close_at && (
                            <span>
                              종료 예정: {new Date(question.close_at).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                          <span className="text-purple-600 font-medium">
                            총 {totalVotes}표
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (commentsOpenId === question.id) {
                                setCommentsOpenId(null)
                              } else {
                                setCommentsOpenId(question.id)
                                void loadQuestionComments(question.id)
                              }
                            }}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            댓글 {question.comment_count || 0}
                          </Button>
                        </div>

                        {commentsOpenId === question.id && (
                          <div className="border-t pt-3 space-y-2">
                            <p className="text-sm font-medium">댓글</p>
                            {commentsLoading ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : (questionComments[question.id] || []).length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">댓글이 없습니다.</p>
                            ) : (
                              (() => {
                                const tree = buildAdminCommentTree(questionComments[question.id] || [])
                                return tree.map((comment) => {
                                  const authorName = comment.profiles?.nickname || comment.guest_nickname || '익명'
                                  const isDeleted = comment.is_deleted
                                  return (
                                    <div key={comment.id} className="space-y-1">
                                      <div className={`flex items-start justify-between gap-2 rounded px-3 py-2 text-sm ${isDeleted ? 'bg-muted/30' : 'bg-muted/50'}`}>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium">{authorName}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {comment.created_at ? new Date(comment.created_at).toLocaleDateString('ko-KR') : ''}
                                            </span>
                                            {isDeleted && (
                                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">삭제됨</span>
                                            )}
                                          </div>
                                          <p className={`text-sm ${isDeleted ? 'text-muted-foreground line-through' : ''}`}>
                                            {isDeleted ? '삭제된 댓글입니다' : comment.content}
                                          </p>
                                        </div>
                                        {!isDeleted && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleSoftDeleteComment(comment.id, question.id)}
                                            className="text-red-500 hover:text-red-600 h-7 px-2 flex-shrink-0"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      {comment.replies.length > 0 && (
                                        <div className="ml-6 border-l-2 border-muted pl-3 space-y-1">
                                          {comment.replies.map((reply) => {
                                            const replyAuthor = reply.profiles?.nickname || reply.guest_nickname || '익명'
                                            const replyDeleted = reply.is_deleted
                                            return (
                                              <div key={reply.id} className={`flex items-start justify-between gap-2 rounded px-3 py-2 text-sm ${replyDeleted ? 'bg-muted/20' : 'bg-muted/30'}`}>
                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs text-muted-foreground">↳</span>
                                                    <span className="text-xs font-medium">{replyAuthor}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                      {reply.created_at ? new Date(reply.created_at).toLocaleDateString('ko-KR') : ''}
                                                    </span>
                                                    {replyDeleted && (
                                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">삭제됨</span>
                                                    )}
                                                  </div>
                                                  <p className={`text-sm ${replyDeleted ? 'text-muted-foreground line-through' : ''}`}>
                                                    {replyDeleted ? '삭제된 댓글입니다' : reply.content}
                                                  </p>
                                                </div>
                                                {!replyDeleted && (
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleSoftDeleteComment(reply.id, question.id)}
                                                    className="text-red-500 hover:text-red-600 h-7 px-2 flex-shrink-0"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                )}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })
                              })()
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* 검토 중 (Draft) 질문 */}
                  {(questionFilter === 'all' || questionFilter === 'drafts') && drafts.map((draft) => {
                    const savedDays = calcDaysBetween(
                      draft.published_at?.slice(0, 10) || '',
                      draft.close_at?.slice(0, 10) || ''
                    )

                    return (
                      <div
                        key={draft.id}
                        className="rounded-md border p-4 space-y-3 border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                              검토 중
                            </span>
                            {draft.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {draft.category}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {draft.created_at
                                ? new Date(draft.created_at).toLocaleDateString('ko-KR')
                                : ''}
                            </span>
                          </div>
                          <p className="font-medium">{draft.title}</p>
                          <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                            <span>A: {draft.option_a}</span>
                            <span>B: {draft.option_b}</span>
                          </div>
                        </div>

                        {(draft.published_at || draft.close_at) && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                            {draft.published_at && (
                              <span>시작: {new Date(draft.published_at).toLocaleDateString('ko-KR')}</span>
                            )}
                            {draft.close_at && (
                              <span>종료: {new Date(draft.close_at).toLocaleDateString('ko-KR')}</span>
                            )}
                            {savedDays !== null && (
                              <span className="text-primary font-medium">{savedDays}일간</span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(editingId === draft.id ? null : draft.id)}
                            disabled={publishingId === draft.id || deletingId === draft.id}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {editingId === draft.id ? '취소' : '수정'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePublish(draft.id)}
                            disabled={publishingId === draft.id || deletingId === draft.id}
                          >
                            {publishingId === draft.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Send className="h-3 w-3 mr-1" />
                            )}
                            게시
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(draft.id)}
                            disabled={publishingId === draft.id || deletingId === draft.id}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            {deletingId === draft.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            삭제
                          </Button>
                        </div>
                        {editingId === draft.id && (
                          <div className="mt-4 p-4 border-t space-y-3">
                            <p className="text-sm font-medium mb-2">질문 수정</p>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-title-${draft.id}`}>제목</Label>
                              <Input
                                id={`edit-title-${draft.id}`}
                                defaultValue={draft.title}
                                onBlur={async (e) => {
                                  if (e.target.value !== draft.title) {
                                    const result = await updateQuestion(draft.id, { title: e.target.value })
                                    if (result.error) {
                                      setMessage({ type: 'error', text: result.error })
                                    } else {
                                      setMessage({ type: 'success', text: '제목이 수정되었습니다.' })
                                      await loadDashboard()
                                    }
                                  }
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor={`edit-option-a-${draft.id}`}>선택지 A</Label>
                                <Input
                                  id={`edit-option-a-${draft.id}`}
                                  defaultValue={draft.option_a}
                                  onBlur={async (e) => {
                                    if (e.target.value !== draft.option_a) {
                                      const result = await updateQuestion(draft.id, { option_a: e.target.value })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '선택지 A가 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`edit-option-b-${draft.id}`}>선택지 B</Label>
                                <Input
                                  id={`edit-option-b-${draft.id}`}
                                  defaultValue={draft.option_b}
                                  onBlur={async (e) => {
                                    if (e.target.value !== draft.option_b) {
                                      const result = await updateQuestion(draft.id, { option_b: e.target.value })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '선택지 B가 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-category-${draft.id}`}>카테고리</Label>
                              <Input
                                id={`edit-category-${draft.id}`}
                                defaultValue={draft.category || ''}
                                onBlur={async (e) => {
                                  if (e.target.value !== (draft.category || '')) {
                                    const result = await updateQuestion(draft.id, { category: e.target.value || undefined })
                                    if (result.error) {
                                      setMessage({ type: 'error', text: result.error })
                                    } else {
                                      setMessage({ type: 'success', text: '카테고리가 수정되었습니다.' })
                                      await loadDashboard()
                                    }
                                  }
                                }}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor={`edit-start-${draft.id}`}>시작일</Label>
                                <Input
                                  id={`edit-start-${draft.id}`}
                                  type="date"
                                  defaultValue={draft.published_at ? normalizeDate(draft.published_at) : ''}
                                  onBlur={async (e) => {
                                    const newVal = e.target.value
                                    const oldVal = draft.published_at ? normalizeDate(draft.published_at) : ''
                                    if (newVal !== oldVal) {
                                      const result = await updateQuestion(draft.id, {
                                        published_at: newVal ? new Date(newVal).toISOString() : undefined,
                                      })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '시작일이 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`edit-end-${draft.id}`}>종료일</Label>
                                <Input
                                  id={`edit-end-${draft.id}`}
                                  type="date"
                                  defaultValue={draft.close_at ? normalizeDate(draft.close_at) : ''}
                                  onBlur={async (e) => {
                                    const newVal = e.target.value
                                    const oldVal = draft.close_at ? normalizeDate(draft.close_at) : ''
                                    if (newVal !== oldVal) {
                                      const result = await updateQuestion(draft.id, {
                                        close_at: newVal ? new Date(newVal + 'T23:59:59').toISOString() : undefined,
                                      })
                                      if (result.error) {
                                        setMessage({ type: 'error', text: result.error })
                                      } else {
                                        setMessage({ type: 'success', text: '종료일이 수정되었습니다.' })
                                        await loadDashboard()
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {publishedQuestions.length === 0 && closedQuestions.length === 0 && drafts.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">
                      질문이 없습니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 제보 관리 */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                회원이 제보한 질문을 검토하고, 채택하면 질문 목록에 자동 추가됩니다.
              </p>

              <div className="flex gap-2">
                {(['all', 'new', 'used', 'reviewed'] as const).map((filter) => {
                  const labels = { all: '전체', new: '접수', used: '채택', reviewed: '반려' }
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSuggestionFilter(filter)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        suggestionFilter === filter
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {labels[filter]}
                    </button>
                  )
                })}
              </div>

              {loadingSuggestions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">제보가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((s) => {
                    const statusStyles: Record<string, string> = {
                      new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                      reviewed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                      used: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                    }
                    const statusLabels: Record<string, string> = {
                      new: '접수',
                      reviewed: '반려',
                      used: '채택',
                    }
                    const currentStatus = s.status || 'new'
                    const isAdopting = adoptingId === s.id

                    return (
                      <div
                        key={s.id}
                        className={`rounded-md border p-4 space-y-3 ${
                          currentStatus === 'used'
                            ? 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/20'
                            : currentStatus === 'reviewed'
                            ? 'border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20'
                            : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyles[currentStatus] || statusStyles.new}`}>
                              {statusLabels[currentStatus] || currentStatus}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {s.profiles?.nickname || '알 수 없음'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {s.created_at ? new Date(s.created_at).toLocaleDateString('ko-KR') : ''}
                            </span>
                          </div>
                          <p className="font-medium">{s.title}</p>
                          <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                            <span>A: {s.option_a}</span>
                            <span>B: {s.option_b}</span>
                          </div>
                        </div>

                        {/* Actions for pending suggestions */}
                        {currentStatus === 'new' && !isAdopting && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setAdoptingId(s.id)
                                setAdoptForm({ title: s.title, option_a: s.option_a, option_b: s.option_b })
                              }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              채택
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={async () => {
                                if (!confirm('이 제보를 반려하시겠습니까?')) return
                                const result = await updateSuggestionStatus(s.id, 'reviewed')
                                if (result.error) {
                                  setMessage({ type: 'error', text: result.error })
                                } else {
                                  setMessage({ type: 'success', text: '반려 처리되었습니다.' })
                                  await loadSuggestions()
                                }
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              반려
                            </Button>
                          </div>
                        )}

                        {/* Inline adoption form */}
                        {isAdopting && (
                          <div className="border-t pt-3 space-y-3">
                            <p className="text-sm font-medium">질문 내용 수정 후 채택</p>
                            <div className="space-y-2">
                              <Label htmlFor={`adopt-title-${s.id}`}>제목</Label>
                              <Input
                                id={`adopt-title-${s.id}`}
                                value={adoptForm.title}
                                onChange={(e) => setAdoptForm(prev => ({ ...prev, title: e.target.value }))}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label htmlFor={`adopt-a-${s.id}`}>선택지 A</Label>
                                <Input
                                  id={`adopt-a-${s.id}`}
                                  value={adoptForm.option_a}
                                  onChange={(e) => setAdoptForm(prev => ({ ...prev, option_a: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`adopt-b-${s.id}`}>선택지 B</Label>
                                <Input
                                  id={`adopt-b-${s.id}`}
                                  value={adoptForm.option_b}
                                  onChange={(e) => setAdoptForm(prev => ({ ...prev, option_b: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={!adoptForm.title.trim() || !adoptForm.option_a.trim() || !adoptForm.option_b.trim()}
                                onClick={async () => {
                                  const result = await updateSuggestionStatus(s.id, 'used', {
                                    title: adoptForm.title.trim(),
                                    option_a: adoptForm.option_a.trim(),
                                    option_b: adoptForm.option_b.trim(),
                                  })
                                  if (result.error) {
                                    setMessage({ type: 'error', text: result.error })
                                  } else if ((result as any).questionCreated) {
                                    setMessage({ type: 'success', text: '채택 완료! 질문이 검토 중(draft)으로 자동 생성되었습니다.' })
                                  } else {
                                    setMessage({ type: 'success', text: (result as any).warning || '채택되었습니다.' })
                                  }
                                  setAdoptingId(null)
                                  await loadSuggestions()
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                채택 확정
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAdoptingId(null)}
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Adopted: show link to drafts */}
                        {currentStatus === 'used' && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            질문 목록 → 검토 중(draft)에서 확인하세요.
                          </div>
                        )}

                        {/* Rejected: allow undo */}
                        {currentStatus === 'reviewed' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground"
                              onClick={async () => {
                                const result = await updateSuggestionStatus(s.id, 'new')
                                if (result.error) {
                                  setMessage({ type: 'error', text: result.error })
                                } else {
                                  setMessage({ type: 'success', text: '접수 상태로 되돌렸습니다.' })
                                  await loadSuggestions()
                                }
                              }}
                            >
                              접수로 되돌리기
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 개별 생성 */}
          {activeTab === 'individual' && (
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="질문 제목을 입력하세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionA">선택지 A</Label>
                <Input
                  id="optionA"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="선택지 A를 입력하세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionB">선택지 B</Label>
                <Input
                  id="optionB"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="선택지 B를 입력하세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 부동산, 정치, 경제..."
                />
              </div>

              <DateRangeFields
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className={selectClassName}
                >
                  <option value="draft">임시저장 (draft)</option>
                  <option value="published">바로 게시 (published)</option>
                </select>
              </div>

              <Button type="submit" disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    생성 중...
                  </>
                ) : (
                  '질문 생성'
                )}
              </Button>
            </form>
          )}

          {/* CSV 업로드 */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="csvFile">CSV 파일 선택</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const header = 'No,Category,Question,Option_A,Option_B,Start_Date,End_Date,Publish'
                      const sample = '1,부동산,강남 아파트 투자 어떻게 보나?,긍정적 (시세 상승 기대),부정적 (리스크 회피),2026-02-01,2026-02-10,O'
                      const blob = new Blob(
                        ['\uFEFF' + header + '\n' + sample + '\n'],
                        { type: 'text/csv;charset=utf-8;' }
                      )
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'question_template.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    템플릿 다운로드
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  형식: No,Category,Question,Option_A,Option_B,Start_Date,End_Date,Publish (첫 줄은 헤더)
                </p>
                <Input
                  id="csvFile"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>

              {csvQuestions.length > 0 && (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">No</th>
                          <th className="px-3 py-2 text-left font-medium">카테고리</th>
                          <th className="px-3 py-2 text-left font-medium">제목</th>
                          <th className="px-3 py-2 text-left font-medium">선택지A</th>
                          <th className="px-3 py-2 text-left font-medium">선택지B</th>
                          <th className="px-3 py-2 text-left font-medium">시작일</th>
                          <th className="px-3 py-2 text-left font-medium">종료일</th>
                          <th className="px-3 py-2 text-left font-medium">게시</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewQuestions.map((q, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="px-3 py-2">{q.no}</td>
                            <td className="px-3 py-2">{q.category}</td>
                            <td className="px-3 py-2 max-w-[200px] truncate">{q.title}</td>
                            <td className="px-3 py-2 max-w-[120px] truncate">{q.option_a}</td>
                            <td className="px-3 py-2 max-w-[120px] truncate">{q.option_b}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{q.start_date ? formatDateDisplay(q.start_date) : '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{q.end_date ? formatDateDisplay(q.end_date) : '-'}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`text-xs font-medium ${q.status === 'published' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {q.status === 'published' ? 'O' : 'X'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {remainingCount > 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      외 {remainingCount}건
                    </p>
                  )}

                  <Button onClick={handleBulkUpload} disabled={uploading} className="w-full">
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        업로드 중...
                      </>
                    ) : (
                      `${csvQuestions.length}건 업로드`
                    )}
                  </Button>
                </>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
