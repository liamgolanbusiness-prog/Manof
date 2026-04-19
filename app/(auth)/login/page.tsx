import Link from "next/link";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">ברוך שובך</CardTitle>
        <CardDescription>התחבר כדי להמשיך לנהל את הפרויקטים שלך</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoginForm next={searchParams.next ?? "/app/projects"} />
        <p className="text-sm text-muted-foreground text-center">
          עדיין אין לך חשבון?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            הרשמה
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
