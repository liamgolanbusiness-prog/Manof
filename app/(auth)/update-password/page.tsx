import { UpdateForm } from "./update-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "בחר סיסמה חדשה · אתר" };

export default function UpdatePasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">סיסמה חדשה</CardTitle>
        <CardDescription>בחר סיסמה חדשה כדי לסיים את תהליך האיפוס.</CardDescription>
      </CardHeader>
      <CardContent>
        <UpdateForm />
      </CardContent>
    </Card>
  );
}
