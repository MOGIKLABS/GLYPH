"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type RightsRow = {
  id: string;
  createdAt: string;
  generationId: string;
  commercialUse: boolean;
  status: "DRAFT" | "CLEARED" | "RESTRICTED";
  declaredStyleReferences: string[];
  licenseNotes: string;
};

type BlockedTermRow = { id: string; term: string; createdAt: string };

export default function RightsPage() {
  const [rows, setRows] = useState<RightsRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
  const [editCommercialUse, setEditCommercialUse] = useState(true);
  const [editStatus, setEditStatus] = useState<RightsRow["status"]>("DRAFT");
  const [editLicenseNotes, setEditLicenseNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [blockedTerms, setBlockedTerms] = useState<BlockedTermRow[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [termsError, setTermsError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rights")
      .then((r) => r.json())
      .then((j: { ok: true; rights: RightsRow[] } | { ok: false; error: string }) => {
        if (!j.ok) {
          setError(j.error);
          return;
        }
        setRows(j.rights);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  useEffect(() => {
    fetch("/api/blocked-terms")
      .then((r) => r.json())
      .then((j: { ok: true; terms: BlockedTermRow[] } | { ok: false; error: string }) => {
        if (!j.ok) {
          setTermsError(j.error);
          return;
        }
        setBlockedTerms(j.terms);
      })
      .catch((e: unknown) => setTermsError(e instanceof Error ? e.message : "Unknown error"));
  }, []);

  const selected = useMemo(
    () => rows.find((r) => r.generationId === selectedGenerationId) ?? null,
    [rows, selectedGenerationId]
  );

  useEffect(() => {
    if (!selected) return;
    setEditCommercialUse(selected.commercialUse);
    setEditStatus(selected.status);
    setEditLicenseNotes(selected.licenseNotes);
  }, [selected]);

  async function saveRights() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/rights", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          generationId: selected.generationId,
          commercialUse: editCommercialUse,
          status: editStatus,
          licenseNotes: editLicenseNotes
        })
      });
      const json = (await res.json()) as
        | { ok: true; rights: RightsRow }
        | { ok: false; error: string };
      if (!json.ok) {
        setError(json.error);
        return;
      }
      setRows((prev) =>
        prev.map((r) => (r.generationId === json.rights.generationId ? json.rights : r))
      );
    } finally {
      setSaving(false);
    }
  }

  async function addTerm() {
    setTermsError(null);
    const term = newTerm.trim();
    if (term.length < 2) return;
    const res = await fetch("/api/blocked-terms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ term })
    });
    const json = (await res.json()) as
      | { ok: true; term: BlockedTermRow }
      | { ok: false; error: string };
    if (!json.ok) {
      setTermsError(json.error);
      return;
    }
    setBlockedTerms((prev) => [json.term, ...prev.filter((t) => t.id !== json.term.id)]);
    setNewTerm("");
  }

  async function removeTerm(term: string) {
    setTermsError(null);
    const res = await fetch("/api/blocked-terms", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ term })
    });
    const json = (await res.json()) as { ok: true } | { ok: false; error: string };
    if (!json.ok) {
      setTermsError(json.error);
      return;
    }
    setBlockedTerms((prev) => prev.filter((t) => t.term !== term));
  }

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <CardTitle>Rights</CardTitle>
        <CardDescription>
          Tracks intended use, declared references, and review status per generation.
        </CardDescription>
      </div>

      {error ? <div className="text-sm text-muted">{error}</div> : null}

      <div className="grid gap-3">
        {rows.length ? (
          rows.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-bg p-4"
              onClick={() => setSelectedGenerationId(r.generationId)}
              role="button"
              tabIndex={0}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="solid">{r.status}</Badge>
                  <Badge>{r.commercialUse ? "Commercial" : "Non-commercial"}</Badge>
                  {r.declaredStyleReferences.length ? (
                    <Badge>Declared refs</Badge>
                  ) : (
                    <Badge>No refs</Badge>
                  )}
                </div>
                <div className="text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted md:grid-cols-[140px_1fr]">
                <div>Generation</div>
                <div className="font-mono">{r.generationId}</div>
                <div>References</div>
                <div>{r.declaredStyleReferences.join(", ") || "—"}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted">No rights records yet.</div>
        )}
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-bg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Edit rights</div>
          {selected ? <Badge>{selected.status}</Badge> : <Badge>Select a record</Badge>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <div className="text-xs text-muted">Generation</div>
            <Input value={selected?.generationId ?? ""} readOnly />
          </div>
          <div className="grid gap-2">
            <div className="text-xs text-muted">Status</div>
            <select
              className="h-10 w-full rounded-xl border border-border bg-bg px-3 text-sm"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as RightsRow["status"])}
              disabled={!selected}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="CLEARED">CLEARED</option>
              <option value="RESTRICTED">RESTRICTED</option>
            </select>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel p-3">
          <div className="grid gap-0.5">
            <div className="text-sm font-medium">Commercial use intended</div>
            <div className="text-xs text-muted">Stored as a licensing flag.</div>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 accent-[hsl(var(--accent))]"
            checked={editCommercialUse}
            onChange={(e) => setEditCommercialUse(e.target.checked)}
            disabled={!selected}
          />
        </label>

        <div className="grid gap-2">
          <div className="text-xs text-muted">License notes</div>
          <Textarea
            value={editLicenseNotes}
            onChange={(e) => setEditLicenseNotes(e.target.value)}
            placeholder="Document license terms, assignments, or review notes."
            disabled={!selected}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={saveRights} disabled={!selected || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-border bg-bg p-4">
        <div className="space-y-1">
          <div className="text-sm font-medium">Blocked terms</div>
          <div className="text-xs text-muted">
            Used to reject prompts containing artist/label names.
          </div>
        </div>

        {termsError ? <div className="text-sm text-muted">{termsError}</div> : null}

        <div className="flex items-center gap-3">
          <Input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder="Add a blocked term"
          />
          <Button variant="outline" onClick={addTerm} disabled={newTerm.trim().length < 2}>
            Add
          </Button>
        </div>

        <div className="grid gap-2">
          {blockedTerms.length ? (
            blockedTerms.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-border bg-panel px-3 py-2 text-sm"
              >
                <div className="font-mono text-xs">{t.term}</div>
                <Button variant="ghost" onClick={() => removeTerm(t.term)}>
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted">No blocked terms configured.</div>
          )}
        </div>
      </div>
    </Card>
  );
}
