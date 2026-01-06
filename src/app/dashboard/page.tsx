import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UploadDropzone } from "@/components/resumes/upload-dropzone";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FileText, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect("/login");

  const resumes = await prisma.resume.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
  });

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Upload Card */}
        <Card className="col-span-full md:col-span-1 border-dashed">
          <CardHeader>
            <CardTitle>Upload New Resume</CardTitle>
            <CardDescription>PDF files up to 5MB</CardDescription>
          </CardHeader>
          <CardContent>
            <UploadDropzone />
          </CardContent>
        </Card>

        {/* Existing Resumes */}
        {resumes.map((resume) => (
          <Card key={resume.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {resume.status === "COMPLETED" ? (
                  <span className="text-green-600">Completed</span>
                ) : resume.status === "PROCESSING" ? (
                  <span className="text-blue-600">Processing</span>
                ) : (
                  <span className="text-gray-500">Draft</span>
                )}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate mb-2">
                {resume.title}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Created {new Date(resume.created_at).toLocaleDateString()}
              </p>
              <Button asChild size="sm" className="w-full">
                <Link href={`/resumes/${resume.id}`}>View Analysis</Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {resumes.length === 0 && (
          <div className="col-span-full md:col-span-2 flex items-center justify-center p-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            You haven't uploaded any resumes yet.
          </div>
        )}
      </div>
    </div>
  );
}
