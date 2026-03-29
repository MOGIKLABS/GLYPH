"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type TakedownResponse = { ok: true; takedownId: string } | { ok: false; error: string };
type TakedownRow = {
  id: string;
  createdAt: string;
  status: "OPEN" | "UNDER_REVIEW" | "ACTIONED" | "REJECTED";
  claimantName: string;
  generationId: string | null;
};

export default function TakedownPage() {
  const [claimantName, setClaimantName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [basis, setBasis] = useState("");
  const [generationId, setGenerationId] = useState("");
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "submitting" }
    | { state: "done"; takedownId: string }
    | { state: "error"; message: string }
  >({ state: "idle" });
  const [rows, setRows] = useState<TakedownRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);

  async function refresh() {
    setListError(null);
    const res = await fetch("/api/takedown");
    const json = (await res.json()) as
      | { ok: true; takedowns: TakedownRow[] }
      | { ok: false; error: string };
    if (!json.ok) {
      setListError(json.error);
      return;
    }
    setRows(json.takedowns);
  }

  useEffect(() => {
    refresh().catch(() => setListError("Failed to load takedowns."));
  }, []);

  async function submit() {
    setStatus({ state: "submitting" });
    const res = await fetch("/api/takedown", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        claimantName,
        contactEmail,
        workDescription,
        basis,
        generationId: generationId.trim() || null
      })
    });
    const json = (await res.json()) as TakedownResponse;
    if (!json.ok) {
      setStatus({ state: "error", message: json.error });
      return;
    }
    setStatus({ state: "done", takedownId: json.takedownId });
    refresh().catch(() => setListError("Failed to load takedowns."));
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <CardTitle>Notice / Takedown</CardTitle>
        <CardDescription>
          Record and triage rights claims with an audit trail and temporary restrictions.
        </CardDescription>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <div className="text-xs text-muted">Claimant name</div>
          <Input value={claimantName} onChange={(e) => setClaimantName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <div className="text-xs text-muted">Contact email</div>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-xs text-muted">Claimed work description</div>
        <Textarea
          value={workDescription}
          onChange={(e) => setWorkDescription(e.target.value)}
          placeholder="Identify the allegedly infringed work and supporting details."
        />
      </div>

      <div className="grid gap-2">
        <div className="text-xs text-muted">Basis of claim</div>
        <Textarea
          value={basis}
          onChange={(e) => setBasis(e.target.value)}
          placeholder="Explain ownership and the nature of infringement/derivation."
        />
      </div>

      <div className="grid gap-2">
        <div className="text-xs text-muted">Related generation (optional)</div>
        <Input
          value={generationId}
          onChange={(e) => setGenerationId(e.target.value)}
          placeholder="generationId"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={submit}
          disabled={
            status.state === "submitting" ||
            claimantName.trim().length < 2 ||
            contactEmail.trim().length < 4 ||
            workDescription.trim().length < 10 ||
            basis.trim().length < 10
          }
        >
          {status.state === "submitting" ? "Submitting…" : "Submit notice"}
        </Button>
        {status.state === "done" ? (
          <div className="text-sm text-muted">Recorded as {status.takedownId}</div>
        ) : null}
        {status.state === "error" ? (
          <div className="text-sm text-muted">{status.message}</div>
        ) : null}
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Recent notices</div>
          <Button variant="outline" onClick={() => refresh()} disabled={status.state === "submitting"}>
            Refresh
          </Button>
        </div>
        {listError ? <div className="mt-3 text-sm text-muted">{listError}</div> : null}
        <div className="mt-3 grid gap-2">
          {rows.length ? (
            rows.map((r) => (
              <div
                key={r.id}
                className="grid gap-2 rounded-xl border border-border bg-bg p-4 md:grid-cols-[1fr_auto]"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="solid">{r.status}</Badge>
                    {r.generationId ? <Badge>Linked generation</Badge> : <Badge>Unlinked</Badge>}
                  </div>
                  <div className="text-xs text-muted">{r.claimantName}</div>
                </div>
                <div className="space-y-1 text-xs text-muted md:text-right">
                  <div>{new Date(r.createdAt).toLocaleString()}</div>
                  <div className="font-mono">{r.id}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted">No notices yet.</div>
          )}
        </div>
      </div>
    </Card>
  );
}
