"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface ResumeAIActionProps {
  resumeId: string;
  status: "IDLE" | "PROCESSING" | "COMPLETED" | "FAILED";
  currentStep: "UPLOAD" | "SUMMARY" | "TRANSLATE" | "DONE";
  hasSummary: boolean;
}

export function ResumeAIActions({
  resumeId,
  status,
  currentStep,
  hasSummary,
}: ResumeAIActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: "summarize" | "translate") => {
    setLoadingAction(action);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/resumes/${resumeId}/${action}`, {
          method: "POST",
        });
        if (!res.ok) throw new Error("API Failed");

        router.refresh();
      } catch (e) {
        console.error(e);
        alert("작업 중 오류가 발생했습니다.");
      } finally {
        setLoadingAction(null);
      }
    });
  };

  return (
    <div className="flex gap-2">
      {/* Summary Button */}
      {(!hasSummary || currentStep === "UPLOAD") && (
        <Button onClick={() => handleAction("summarize")} disabled={isPending}>
          {loadingAction === "summarize" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          AI 요약 생성 (1 Quota)
        </Button>
      )}

      {/* Translate Button */}
      {hasSummary && currentStep !== "DONE" && (
        <Button
          variant="secondary"
          onClick={() => handleAction("translate")}
          disabled={isPending}
        >
          {loadingAction === "translate" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Languages className="mr-2 h-4 w-4" />
          )}
          영문 번역 (1 Quota)
        </Button>
      )}
    </div>
  );
}
