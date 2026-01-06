"use client";

import { useCallback, useState, useTransition } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, File, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

export function UploadDropzone() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setError(null);
      if (fileRejections.length > 0) {
        setError("PDF 파일만 업로드 가능합니다. (최대 5MB)");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/resumes/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const data = await response.json();
          console.log("Upload success:", data);

          router.push(`/resumes/${data.id}`);
        } catch (err) {
          console.error(err);
          setError("업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
      });
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: isPending,
  });

  return (
    <Card className="w-full max-w-xl mx-auto border-dashed border-2">
      <CardHeader>
        <CardTitle>이력서 업로드</CardTitle>
        <CardDescription>
          분석할 국문 이력서(PDF)를 업로드해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center p-10 cursor-pointer rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50",
            isDragActive && "bg-gray-50 dark:bg-gray-900/50",
            isPending && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          {isPending ? (
            <Loader2 className="h-10 w-10 text-gray-400 animate-spin mb-4" />
          ) : (
            <UploadCloud className="h-10 w-10 text-gray-400 mb-4" />
          )}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDragActive
              ? "여기에 파일을 놓으세요"
              : "클릭하거나 파일을 여기로 드래그하세요"}
          </p>
          <p className="text-xs text-gray-500 mt-2">PDF (최대 5MB)</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-4 text-sm text-red-500">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
