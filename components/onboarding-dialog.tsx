"use client";

import { useState, useEffect } from "react";
import { MessageSquareText, Target, Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "onboarding_completed";

const steps = [
  {
    icon: MessageSquareText,
    title: "결정소에 오신 것을 환영합니다!",
    content: "A vs B 질문에 투표하고 의견을 나누는 공간입니다",
  },
  {
    icon: Target,
    title: "예측에 도전하세요",
    content:
      "투표 후 다수의 선택을 예측하면 포인트를 획득할 수 있어요",
  },
  {
    icon: Coins,
    title: "포인트 획득 방법",
    content:
      "투표 참여 +10P · 초기 답변자 보너스 +10P · 예측 적중 시 추가 보너스!",
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      complete();
    }
  };

  const handleSkip = () => {
    complete();
  };

  const isLastStep = currentStep === steps.length - 1;
  const StepIcon = steps[currentStep].icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div
          key={currentStep}
          className="animate-in fade-in-0 slide-in-from-right-4 duration-300"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
            <StepIcon className="h-8 w-8 text-primary" />
          </div>

          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-center">
              {steps[currentStep].title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              {steps[currentStep].content}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`inline-block w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 mt-4">
          <Button className="w-full" onClick={handleNext}>
            {isLastStep ? "시작하기" : "다음"}
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            건너뛰기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
