"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SessionTimeoutDialogProps {
  remainingSeconds: number;
  onLogout: () => void;
  onContinue: () => void;
}

export function SessionTimeoutDialog({
  remainingSeconds,
  onLogout,
  onContinue,
}: SessionTimeoutDialogProps) {
  return (
    <Dialog open={true}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>세션 만료 안내</DialogTitle>
          <DialogDescription>
            비활동으로 인해 {remainingSeconds}초 후 자동 로그아웃됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onLogout}>
            로그아웃
          </Button>
          <Button onClick={onContinue}>계속 사용하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
