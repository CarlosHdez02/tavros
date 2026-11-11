"use client";

import React from "react";
import type { Reservation } from "@/types/Table.type";
import PlatformsMap from "./PlatformsMap.component";

interface ScrapedReservation {
  name?: string;
  last_name?: string;
  full_name?: string;
  nombre_plan?: string;
  fecha_creacion?: string;
  reserva_id?: number;
  status?: string;
  fila?: string;
}

interface ComparisonClass {
  classId: string;
  class?: string;
  boxmagicLabel?: string;
  hora_inicio?: string;
  hora_fin?: string;
  limite?: number;
  match?: boolean;
  nameMatch?: boolean;
  missing?: string[];
  extra?: string[];
  boxmagic?: { count?: number; names?: string[]; loaded?: boolean };
  scraped?: { count?: number; names?: string[]; reservations?: ScrapedReservation[] };
}

interface ComparisonReport {
  generatedAt?: string;
  summary?: {
    dates?: string[];
    classes?: number;
    matched?: number;
    boxmagicReservations?: number;
    scrapedReservations?: number;
    allMatch?: boolean;
  };
  notes?: string[];
  dates?: Record<string, { classes?: ComparisonClass[] }>;
}

interface ApiResponse {
  path?: string;
  modifiedAt?: string;
  report?: ComparisonReport;
  error?: string;
  detail?: string;
}

/** Fill the fields PlatformsMap's Reservation type requires but the report doesn't carry. */
const toReservation = (r: ScrapedReservation, i: number): Reservation => ({
  id: r.reserva_id ?? i,
  reserva_id: r.reserva_id ?? i,
  hash_reserva_id: String(r.reserva_id ?? i),
  name: r.name ?? "",
  last_name: r.last_name ?? "",
  full_name: r.full_name ?? `${r.name ?? ""} ${r.last_name ?? ""}`.trim(),
  email: "",
  telefono: "",
  status: r.status ?? "",
  nombre_plan: r.nombre_plan ?? "",
  canal: "",
  fecha_creacion: r.fecha_creacion ?? "",
  pago_pendiente: false,
  form_asistencia_url: false,
  mostrar_formulario: false,
  rating: null,
  imagen: "",
  fila: r.fila ?? "",
});

const formatDateTime = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }).format(new Date(iso))
    : "—";

const Pill = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
      ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
    }`}
  >
    {children}
  </span>
);

const NameList = ({ names, highlight }: { names: string[]; highlight: Set<string> }) =>
  names.length === 0 ? (
    <p className="text-sm italic text-neutral-500">Sin reservas</p>
  ) : (
    <ol className="space-y-0.5 text-sm">
      {names.map((n, i) => (
        <li key={`${n}-${i}`} className={highlight.has(n) ? "font-semibold text-red-400" : "text-neutral-300"}>
          <span className="mr-2 inline-block w-5 text-right text-neutral-500">{i + 1}.</span>
          {n}
        </li>
      ))}
    </ol>
  );

const ClassRow = ({ c }: { c: ComparisonClass }) => {
  const [showMap, setShowMap] = React.useState(false);
  const bmNames = c.boxmagic?.names ?? [];
  const scNames = c.scraped?.names ?? [];
  const missing = c.missing ?? bmNames.filter((n) => !scNames.includes(n));
  const extra = c.extra ?? scNames.filter((n) => !bmNames.includes(n));
  const bmCount = c.boxmagic?.count ?? bmNames.length;
  const scCount = c.scraped?.count ?? scNames.length;
  const ok = c.match ?? (bmCount === scCount && missing.length === 0 && extra.length === 0);
  const labelDiffers = c.boxmagicLabel != null && c.class != null && c.boxmagicLabel !== c.class;
  const reservations = (c.scraped?.reservations ?? []).map(toReservation);

  return (
    <div className={`rounded-xl border p-4 ${ok ? "border-neutral-800 bg-[#1c1c1c]" : "border-red-500/50 bg-red-950/20"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-[#E8B44F]">
              {c.hora_inicio ?? "??:??"}–{c.hora_fin ?? "??:??"}
            </span>
            <Pill ok={ok}>{ok ? "Coincide" : "Diferencia"}</Pill>
            {c.boxmagic?.loaded === false && <Pill ok={false}>BoxMagic UI no cargó</Pill>}
            {c.nameMatch === false && <Pill ok={false}>Nombres distintos</Pill>}
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-neutral-100">{c.class ?? c.classId}</h3>
          {labelDiffers && (
            <p className="text-xs text-red-400">Etiqueta BoxMagic: {c.boxmagicLabel}</p>
          )}
          <p className="font-mono text-xs text-neutral-500">{c.classId}</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-neutral-400">
            BoxMagic <span className="font-bold text-neutral-100">{bmCount}</span> · Scraper{" "}
            <span className={`font-bold ${bmCount === scCount ? "text-neutral-100" : "text-red-400"}`}>{scCount}</span>
          </div>
          <div className="text-xs text-neutral-500">Límite {c.limite ?? "—"}</div>
        </div>
      </div>

      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">BoxMagic (check-in UI)</h4>
          <NameList names={bmNames} highlight={new Set(missing)} />
        </div>
        <div>
          <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-500">Scraper</h4>
          <NameList names={scNames} highlight={new Set(extra)} />
        </div>
      </div>

      {(missing.length > 0 || extra.length > 0) && (
        <div className="mt-3 space-y-1 text-sm">
          {missing.length > 0 && <p className="text-red-400">Faltan en scraper: {missing.join(", ")}</p>}
          {extra.length > 0 && <p className="text-red-400">Sobran en scraper: {extra.join(", ")}</p>}
        </div>
      )}

      {reservations.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="text-sm font-semibold text-[#E8B44F] hover:underline"
          >
            {showMap ? "Ocultar plataformas" : "Ver cómo se verá en pantalla"}
          </button>
          {showMap && (
            <div className="mt-2 flex h-[900px] flex-col overflow-hidden rounded-lg">
              <PlatformsMap
                reservations={reservations}
                sessionTime={`${c.hora_inicio} - ${c.hora_fin}`}
                size="large"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ScraperComparison = () => {
  const [state, setState] = React.useState<{ loading: boolean; data?: ApiResponse }>({ loading: true });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/dev/scraper-comparison", { cache: "no-store" });
      setState({ loading: false, data: (await res.json()) as ApiResponse });
    } catch (e) {
      setState({ loading: false, data: { error: e instanceof Error ? e.message : "Error" } });
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const { loading, data } = state;
  const report = data?.report;
  const summary = report?.summary;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 text-neutral-200">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-[#E8B44F] pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#E8B44F]">Comparación scraper vs BoxMagic</h1>
          <p className="text-sm text-neutral-400">
            Generado {formatDateTime(report?.generatedAt)}
            {data?.path && <span className="ml-2 font-mono text-xs text-neutral-600">{data.path}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm font-semibold hover:border-[#E8B44F] hover:text-[#E8B44F]"
        >
          {loading ? "Cargando…" : "Recargar"}
        </button>
      </div>

      {data?.error && !report && (
        <div className="mt-6 rounded-xl border border-red-500/50 bg-red-950/20 p-4 text-sm">
          <p className="font-semibold text-red-400">{data.error}</p>
          {data.detail && <p className="mt-1 font-mono text-xs text-neutral-400">{data.detail}</p>}
        </div>
      )}

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Resultado", value: summary.allMatch ? "Todo coincide" : "Con diferencias", ok: !!summary.allMatch },
            { label: "Clases", value: `${summary.matched ?? "—"}/${summary.classes ?? "—"}`, ok: summary.matched === summary.classes },
            {
              label: "Reservas",
              value: `${summary.scrapedReservations ?? "—"}/${summary.boxmagicReservations ?? "—"}`,
              ok: summary.scrapedReservations === summary.boxmagicReservations,
            },
            { label: "Fechas", value: (summary.dates ?? []).join(", ") || "—", ok: true },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-neutral-800 bg-[#1c1c1c] p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">{s.label}</div>
              <div className={`mt-1 text-lg font-bold ${s.ok ? "text-emerald-400" : "text-red-400"}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {report?.notes && report.notes.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-400">
          {report.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      {Object.entries(report?.dates ?? {}).map(([date, d]) => {
        const classes = [...(d.classes ?? [])].sort((a, b) => (a.hora_inicio ?? "").localeCompare(b.hora_inicio ?? ""));
        return (
          <div key={date} className="mt-8">
            <h2 className="mb-3 text-xl font-bold text-neutral-100">
              {date} <span className="text-sm font-normal text-neutral-500">· {classes.length} clases</span>
            </h2>
            <div className="space-y-3">
              {classes.map((c) => (
                <ClassRow key={c.classId} c={c} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default ScraperComparison;
