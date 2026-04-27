'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateNickname } from '@/lib/auth/actions'
import { Pencil, Check, X, Loader2 } from 'lucide-react'

interface NicknameEditorProps {
  initialNickname: string
}

export function NicknameEditor({ initialNickname }: NicknameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(initialNickname)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setNickname(initialNickname)
    setError('')
  }

  const handleSave = async () => {
    // 유효성 검사
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.')
      return
    }

    if (nickname.length < 2 || nickname.length > 20) {
      setError('닉네임은 2~20자 사이여야 합니다.')
      return
    }

    if (/\s/.test(nickname)) {
      setError('닉네임에 공백을 포함할 수 없습니다.')
      return
    }

    if (nickname === initialNickname) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    setError('')

    const result = await updateNickname(nickname)

    setIsLoading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    // 성공
    setIsEditing(false)
    window.location.reload() // 페이지 새로고침으로 변경사항 반영
  }

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">닉네임</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{initialNickname}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-7 w-7 p-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">닉네임</span>
        <div className="flex items-center gap-2">
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 입력"
            disabled={isLoading}
            className="h-9 w-48"
            maxLength={20}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive text-right">{error}</p>
      )}
    </div>
  )
}
