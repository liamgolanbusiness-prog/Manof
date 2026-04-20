import Link from "next/link";
import { ResetForm } from "./reset-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "איפוס סיסמה · אתר" };

export default function ResetPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">שכחת סיסמה?</CardTitle>
        <CardDescription>
          הכנס את האימייל ונשלח אליך קישור לאיפוס הסיסמה.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResetForm />
        <p className="text-sm text-muted-foreground text-center">
          נזכרת?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            כניסה
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
