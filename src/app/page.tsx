import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, FileText, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 lg:py-40 bg-gradient-to-b from-background to-gray-50 dark:to-gray-900/10">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
              <Sparkles className="mr-1 h-3 w-3" />
              <span>AI-Powered Resume Builder</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white">
              Craft Your Perfect Resume <br className="hidden sm:inline" />
              with{" "}
              <span className="text-blue-600 dark:text-blue-400">
                Intelligent AI
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Lesume analyzes your experience and automatically generates
              professional summaries and translations. Build a world-class
              resume in minutes.
            </p>
          </div>
          <div className="space-x-4">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 text-lg rounded-full"
            >
              <Link href="/login">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 text-lg rounded-full"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="flex flex-col items-start space-y-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Smart Extraction</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Upload your raw PDF resume. Our AI extracts structure and
                content instantly, organizing your career history.
              </p>
            </div>
            <div className="flex flex-col items-start space-y-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold">AI Summarization</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Automatically generate impactful 3-4 bullet points for each
                role, focusing on achievements and metrics.
              </p>
            </div>
            <div className="flex flex-col items-start space-y-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Languages className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold">Professional Translation</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Convert your Korean resume to a native-level English resume
                using industry-standard Action Verbs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 border-t text-center text-sm text-gray-500">
        © 2026 Lesume. All rights reserved.
      </footer>
    </div>
  );
}

function Languages(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}
