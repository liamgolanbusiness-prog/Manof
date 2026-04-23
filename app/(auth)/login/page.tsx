import Link from "next/link";
import { LoginForm } from "./login-form";
import { GoogleButton } from "../google-button";
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
        <GoogleButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">או</span>
          </div>
        </div>
        <LoginForm next={searchParams.next ?? "/app"} />
        <div className="flex items-center justify-between text-sm">
          <Link
            href="/reset-password"
            className="text-muted-foreground hover:text-primary hover:underline"
          >
            שכחתי סיסמה
          </Link>
          <Link href="/signup" className="text-primary font-medium hover:underline">
            הרשמה
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
