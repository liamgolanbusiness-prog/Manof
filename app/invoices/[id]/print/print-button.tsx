"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()} className="tap gap-1">
      <Printer className="h-4 w-4" />
      הדפס / PDF
    </Button>
  );
}
