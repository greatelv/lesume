import { GoogleLoginForm } from "@/components/auth/google-login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-100 via-gray-50 to-gray-50 dark:from-sky-900/20 dark:via-gray-950 dark:to-gray-950">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Lesume</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        <Card className="border-muted/40 shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Login with your Google account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <GoogleLoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
