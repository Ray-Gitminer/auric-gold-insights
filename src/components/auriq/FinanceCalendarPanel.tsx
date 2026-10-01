import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

import { fetchFinanceCalendar } from "@/lib/economic-calendar/financecalendar.functions";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";

const tone = { High: "bg-negative", Medium: "bg-warning", Low: "bg-primary" } as const;

export function FinanceCalendarPanel() {
  const { lang } = useI18n();
  const q = useQuery({ queryKey: ["financecalendar"], queryFn: () => fetchFinanceCalendar(), staleTime: 60 * 60_000, retry: 0 });
  const th = lang === "th";
  return (
    <section className="auric-glass min-w-0 overflow-hidden rounded-lg p-3">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{th ? "FinanceCalendar · สัปดาห์นี้และถัดไป" : "FinanceCalendar · this & next week"}</h2>
        <span className="rounded-sm border border-info/40 px-1.5 py-0.5 text-[10px] text-info">{th ? "แหล่ง: financecalendar.com" : "Source: financecalendar.com"}</span>
        {q.data?.fetchedAt && <span className="ml-auto text-[10px] text-muted-foreground">{new Date(q.data.fetchedAt).toLocaleString("en-GB", { timeZone: "Asia/Bangkok" })}</span>}
      </header>
      {q.isLoading && <p className="text-xs text-muted-foreground">{th ? "กำลังโหลด…" : "Loading…"}</p>}
      {q.data && !q.data.ok && <p className="text-xs text-negative">{th ? "ดึงข้อมูลไม่สำเร็จ ใช้ข้อมูลทางการด้านล่างแทน" : "Could not load — official data below still applies."} ({q.data.error})</p>}
      {q.data?.ok && (
        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="text-left text-[10px] text-muted-foreground uppercase">
              <tr><th className="py-1 pr-2">{th ? "วัน" : "Date"}</th><th className="pr-2">ET</th><th className="pr-2">{th ? "ประเทศ" : "Country"}</th><th className="pr-2">{th ? "เหตุการณ์" : "Event"}</th><th className="pr-2 text-right">Actual</th><th className="pr-2 text-right">Forecast</th><th className="text-right">Prior</th></tr>
            </thead>
            <tbody>
              {q.data.events.map((e, i) => (
                <tr key={`${e.name}-${i}`} className="border-t border-border/50">
                  <td className="num py-1.5 pr-2 text-muted-foreground">{e.date}</td>
                  <td className="num pr-2 text-muted-foreground">{e.timeEt}</td>
                  <td className="pr-2">{e.country}</td>
                  <td className="pr-2"><span className={cn("mr-1.5 inline-block size-2 rounded-sm", tone[e.impact] ?? "bg-muted")} />{e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{e.name} <ExternalLink className="inline size-3" /></a> : e.name}</td>
                  <td className="num pr-2 text-right">{e.actual ?? "—"}</td>
                  <td className="num pr-2 text-right">{e.forecast ?? "—"}</td>
                  <td className="num text-right">{e.prior ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
