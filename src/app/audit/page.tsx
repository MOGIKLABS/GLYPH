"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

type AuditRow = {
  id: string;
  createdAt: string;
  type: string;
  subjectType: string;
  subjectId: string;
  takedownId: string | null;
  detailJson: string;
};

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/audit")
      .then((r) => r.json())
      .then((j: { ok: true; events: AuditRow[] } | { ok: false; error: string }) => {
        if (!j.ok) {
          setError(j.error);
          return;
        }
        setRows(j.events);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle>System Audit Log</CardTitle>
          <a href="/api/audit/export" download>
            <Button variant="outline">
              <Icon name="download" />
              Export CSV
            </Button>
          </a>
        </div>
        <CardDescription>
          Immutable record of generations, guardrail triggers, and rights actions.
        </CardDescription>
      </div>
      {error ? <div className="text-sm text-muted">{error}</div> : null}
      <div className="grid gap-2">
        {rows.length ? (
          rows.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="solid">{e.type}</Badge>
                  <Badge>{e.subjectType}</Badge>
                  {e.takedownId ? <Badge>Takedown linked</Badge> : <Badge>—</Badge>}
                </div>
                <div className="text-xs text-muted">{new Date(e.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted md:grid-cols-[140px_1fr]">
                <div>Subject</div>
                <div className="font-mono">{e.subjectId}</div>
                <div>Detail</div>
                <div className="font-mono break-all">{e.detailJson}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted">No audit events yet.</div>
        )}
      </div>
    </Card>
  );
}
