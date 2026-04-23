import Link from "next/link";
import { SignupForm } from "./signup-form";
import { GoogleButton } from "../google-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">פתיחת חשבון</CardTitle>
        <CardDescription>
          צור חשבון ב־30 שניות, תוסיף פרויקט ראשון, וזהו.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">או</span>
          </div>
        </div>
        <SignupForm />
        <p className="text-sm text-muted-foreground text-center">
          כבר יש לך חשבון?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            כניסה
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
