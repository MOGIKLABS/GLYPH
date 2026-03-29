"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type ReceiptRow = {
  id: string;
  createdAt: string;
  modelProvider: string;
  modelName: string;
  promptHash: string;
  outputHash: string | null;
};

export default function ReceiptsPage() {
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/receipts")
      .then((r) => r.json())
      .then((j: { ok: true; receipts: ReceiptRow[] } | { ok: false; error: string }) => {
        if (!j.ok) {
          setError(j.error);
          return;
        }
        setRows(j.receipts);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <CardTitle>Receipts</CardTitle>
        <CardDescription>Immutable metadata snapshots for each generation request.</CardDescription>
      </div>

      {error ? <div className="text-sm text-muted">{error}</div> : null}

      <div className="grid gap-3">
        {rows.length ? (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid gap-2 rounded-xl border border-border bg-bg p-4 md:grid-cols-[1fr_auto]"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="solid">{r.modelProvider}</Badge>
                  <Badge>{r.modelName}</Badge>
                  {r.outputHash ? <Badge>Output hashed</Badge> : <Badge>Pending output</Badge>}
                </div>
                <div className="text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="space-y-2 text-xs text-muted md:text-right">
                <div className="font-mono">prompt:{r.promptHash}</div>
                <div className="font-mono">
                  output:{r.outputHash ?? "—"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted">No receipts yet.</div>
        )}
      </div>
    </Card>
  );
}

