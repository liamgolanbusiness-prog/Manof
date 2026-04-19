"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function ShareReportButton({
  projectName,
  reportDate,
  weather,
  notes,
  attendance,
  photoCount,
  issues,
  totalHours,
}: {
  projectName: string;
  reportDate: string;
  weather: string | null;
  notes: string | null;
  attendance: { name: string; hours: number }[];
  photoCount: number;
  issues: { title: string; resolved: boolean }[];
  totalHours: number;
}) {
  const d = new Date(reportDate);
  const formattedDate = d.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const lines: string[] = [];
  lines.push(`*${projectName}* — דו״ח יום`);
  lines.push(formattedDate);
  if (weather) lines.push(`\nמזג אוויר: ${weather}`);
  if (notes) lines.push(`\n${notes}`);
  if (attendance.length > 0) {
    lines.push(`\n*נוכחות (${totalHours} שע׳)*`);
    for (const a of attendance) lines.push(`• ${a.name} — ${a.hours} שע׳`);
  }
  if (photoCount > 0) lines.push(`\n*תמונות*: ${photoCount}`);
  if (issues.length > 0) {
    lines.push(`\n*בעיות*`);
    for (const i of issues) lines.push(`• ${i.title}${i.resolved ? " (טופל)" : ""}`);
  }

  const text = encodeURIComponent(lines.join("\n"));
  const href = `https://wa.me/?text=${text}`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm" className="tap gap-1 bg-[#25D366] hover:bg-[#1fb855] border-transparent text-white hover:text-white">
        <MessageCircle className="h-4 w-4" />
        שלח בוואטסאפ
      </Button>
    </a>
  );
}
