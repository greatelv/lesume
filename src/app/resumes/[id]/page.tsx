import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeAIActions } from "@/components/resumes/resume-ai-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResumeDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/login");

  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id, user_id: session.user.id },
    include: { workExperiences: true },
  });

  if (!resume) return notFound();

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-3.5rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight truncate max-w-xl">
            {resume.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resume Analysis & Translation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Download PDF
          </Button>
          <ResumeAIActions
            resumeId={resume.id}
            status={resume.status}
            currentStep={resume.current_step}
            hasSummary={resume.workExperiences.length > 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left: Original Text */}
        <Card className="flex flex-col h-full overflow-hidden border-muted/60 shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-medium">
              Original Text (Parsed)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4 bg-muted/10">
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed">
              {resume.raw_text}
            </pre>
          </CardContent>
        </Card>

        {/* Right: AI Results */}
        <Card className="flex flex-col h-full overflow-hidden border-blue-100 dark:border-blue-900/30 shadow-md">
          <CardHeader className="pb-3 border-b bg-blue-50/50 dark:bg-blue-900/10">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                AI Analysis
              </span>
              Summary & Translation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4 space-y-6">
            {resume.workExperiences.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                  <span className="text-4xl">✨</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ready to Analyze</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Click the "AI Summary" button to analyze your career
                    history.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {resume.workExperiences.map((exp) => (
                  <div key={exp.id} className="relative group">
                    <div className="absolute left-[-17px] top-2 bottom-0 w-px bg-gray-200 dark:bg-gray-800 last:hidden"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                          {exp.company_name_kr}
                        </h3>
                        <div className="flex gap-2 items-center text-sm text-muted-foreground">
                          <span>{exp.role_kr}</span>
                          <span>•</span>
                          <span>
                            {exp.start_date} - {exp.end_date}
                          </span>
                        </div>
                      </div>
                      {exp.role_en && (
                        <div className="text-right bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded text-xs font-medium text-blue-700 dark:text-blue-300">
                          {exp.role_en}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                          Korean Summary
                        </p>
                        <ul className="list-disc pl-4 text-sm space-y-1.5 text-gray-700 dark:text-gray-300">
                          {(exp.bullets_kr as string[])?.map(
                            (b: string, i: number) => (
                              <li key={i} className="leading-relaxed">
                                {b}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {exp.bullets_en && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                            English Translation{" "}
                            <span className="text-[10px] opacity-70">
                              (Action Verbs)
                            </span>
                          </p>
                          <ul className="list-disc pl-4 text-sm space-y-1.5 text-gray-900 dark:text-gray-100">
                            {(exp.bullets_en as string[])?.map(
                              (b: string, i: number) => (
                                <li key={i} className="leading-relaxed">
                                  {b}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
