"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Copy, ExternalLink, MessageCircle, Share2 } from "lucide-react";

export function ClientShareCard({
  project,
}: {
  project: {
    name: string;
    client_name: string | null;
    client_phone: string | null;
    portal_token: string;
    progress_pct: number | null;
  };
}) {
  const [copied, setCopied] = useState(false);

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const portalUrl = `${base.replace(/\/$/, "")}/portal/${project.portal_token}`;
  const message = `שלום${project.client_name ? ` ${project.client_name}` : ""}, הנה קישור לעדכון חי על הפרויקט "${project.name}":\n${portalUrl}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  function whatsappHref() {
    const to = (project.client_phone || "").replace(/[^\d+]/g, "");
    const text = encodeURIComponent(message);
    return to
      ? `https://wa.me/${to.replace(/^\+/, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Share2 className="h-5 w-5 text-primary" />
          קישור ללקוח
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          כל לקוח רואה דף מותאם עם תמונות, אחוז התקדמות ומצב תשלומים. אין צורך
          בהתחברות.
        </p>
        <div className="rounded-xl bg-muted p-3 text-sm break-all" dir="ltr">
          {portalUrl}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copyLink} variant="outline" className="tap">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                הועתק
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                העתק קישור
              </>
            )}
          </Button>
          <a href={whatsappHref()} target="_blank" rel="noopener noreferrer">
            <Button className="tap bg-[#25D366] hover:bg-[#1fb855] text-white">
              <MessageCircle className="h-4 w-4" />
              שלח בוואטסאפ
            </Button>
          </a>
          <a href={portalUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" className="tap">
              <ExternalLink className="h-4 w-4" />
              תצוגה מקדימה
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
