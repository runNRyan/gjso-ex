import { Vote, Target, Coins } from "lucide-react";

const steps = [
  {
    step: "Step 1",
    icon: Vote,
    title: "투표하기",
    description: "A vs B, 당신의 선택은?",
  },
  {
    step: "Step 2",
    icon: Target,
    title: "예측하기",
    description: "다수의 선택을 맞혀보세요",
  },
  {
    step: "Step 3",
    icon: Coins,
    title: "포인트 획득",
    description: "투표 +10P, 초기 답변 +10P, 예측 적중 보너스!",
  },
];

export function HowItWorks() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {steps.map(({ step, icon: Icon, title, description }) => (
        <div
          key={step}
          className="rounded-lg border bg-card p-4 sm:p-6 text-center"
        >
          <p className="text-xs text-muted-foreground mb-2">{step}</p>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mx-auto mb-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base mb-1">{title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      ))}
    </div>
  );
}
