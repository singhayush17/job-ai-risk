import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Share2, Sparkles, Brain, Check, Link2, Download } from "lucide-react";
import { analyzeJD, type AnalysisResult } from "@/lib/analyze.functions";
import { fetchJD } from "@/lib/fetch-jd.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Will AI Take My Job? — Paste a JD, get your risk score" },
      {
        name: "description",
        content:
          "Paste any job description and get an instant AI-takeover risk score for the next 10 years. Share the result with a public link.",
      },
      { property: "og:title", content: "Will AI Take My Job?" },
      {
        property: "og:description",
        content:
          "Paste a job description and get an instant AI-takeover risk score for the next 10 years.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    jd: typeof s.jd === "string" ? s.jd : undefined,
  }),
  component: Index,
});

function encodeJD(jd: string) {
  return btoa(unescape(encodeURIComponent(jd)));
}
function decodeJD(s: string) {
  try {
    return decodeURIComponent(escape(atob(s)));
  } catch {
    return "";
  }
}

function Index() {
  const { jd: jdParam } = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const analyze = useServerFn(analyzeJD);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (jdParam) {
      const decoded = decodeJD(jdParam);
      if (decoded) {
        setJd(decoded);
        run(decoded);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(text: string) {
    setLoading(true);
    setResult(null);
    try {
      const r = await analyze({ data: { jd: text } });
      setResult(r);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't analyze. Try a longer or clearer JD.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit() {
    if (jd.trim().length < 20) {
      toast.error("Paste a real job description (at least 20 characters).");
      return;
    }
    navigate({ search: { jd: encodeJD(jd.trim()) }, replace: true });
    run(jd.trim());
  }

  async function share() {
    const encoded = encodeJD(jd.trim());
    const url = `${window.location.origin}/?jd=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Public link copied!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy link.");
    }
  }

  const pct = result?.percentage ?? 0;
  const riskBand =
    pct >= 75 ? "Critical" : pct >= 55 ? "High" : pct >= 35 ? "Moderate" : pct >= 15 ? "Low" : "Minimal";
  const riskHue = pct >= 75 ? "var(--danger)" : pct >= 55 ? "var(--warn)" : pct >= 35 ? "var(--mid)" : "var(--safe)";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{ background: "radial-gradient(1200px 600px at 80% -10%, color-mix(in oklch, var(--accent-glow) 35%, transparent), transparent 60%), radial-gradient(900px 500px at -10% 110%, color-mix(in oklch, var(--accent-glow-2) 25%, transparent), transparent 60%)" }} />

      <header className="mx-auto max-w-5xl px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-background">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight">JobOrBot</span>
        </div>
        <a
          href="https://lovable.dev"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition"
        >
          built on Lovable
        </a>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <section className="text-center pt-6 pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            10-year AI displacement forecast
          </div>
          <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            Will AI take <span className="italic">your</span> job?
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Paste a job description. Get a calibrated risk score, what's at risk, what's safe — and a public link to share.
          </p>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-4 sm:p-6 shadow-sm">
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description here…"
            className="min-h-[200px] resize-y border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{jd.length} chars</span>
            <Button onClick={onSubmit} disabled={loading} size="lg" className="rounded-full px-6">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
              ) : (
                <>Estimate my risk</>
              )}
            </Button>
          </div>
        </section>

        {loading && !result && (
          <div className="mt-10 text-center text-sm text-muted-foreground animate-pulse">
            Reading the JD, weighing tasks against frontier AI capabilities…
          </div>
        )}

        {result && (
          <section className="mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    AI takeover likelihood · 10 yr
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span
                      className="text-7xl sm:text-8xl font-semibold tracking-tight tabular-nums"
                      style={{ color: riskHue }}
                    >
                      {pct}%
                    </span>
                    <span className="text-sm font-medium" style={{ color: riskHue }}>
                      {riskBand} risk
                    </span>
                  </div>
                  <p className="mt-3 text-base text-foreground/90 max-w-xl">{result.verdict}</p>
                </div>
                <Button onClick={share} variant="outline" className="rounded-full self-start sm:self-end">
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? "Copied" : "Share link"}
                </Button>
              </div>

              <div className="mt-6 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full transition-[width] duration-1000 ease-out"
                  style={{ width: `${pct}%`, background: riskHue }}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card title="At risk from AI" tone="danger" items={result.at_risk_tasks} />
              <Card title="Likely resilient" tone="safe" items={result.resilient_tasks} />
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Reasoning</h3>
              <p className="mt-2 text-foreground/90 leading-relaxed">{result.reasoning}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-foreground text-background p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest opacity-70">How to stay ahead</h3>
              <p className="mt-2 leading-relaxed">{result.advice}</p>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-2">
              This is a probabilistic estimate, not career advice. Models can be wrong — yours included.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function Card({ title, tone, items }: { title: string; tone: "danger" | "safe"; items: string[] }) {
  const color = tone === "danger" ? "var(--danger)" : "var(--safe)";
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-6">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.length === 0 && <li className="text-sm text-muted-foreground">—</li>}
        {items.map((t, i) => (
          <li key={i} className="text-sm text-foreground/90 leading-snug flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: color }} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
