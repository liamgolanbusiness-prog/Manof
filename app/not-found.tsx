import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="text-6xl font-bold text-primary">404</div>
        <h1 className="text-2xl font-bold">הדף לא נמצא</h1>
        <p className="text-muted-foreground">
          הקישור שגוי או שהדף נמחק. לחזור לדף הבית?
        </p>
        <Link href="/">
          <Button size="lg" className="tap">לדף הבית</Button>
        </Link>
      </div>
    </main>
  );
}
