import Link from "next/link";
import { SignupForm } from "./signup-form";
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
