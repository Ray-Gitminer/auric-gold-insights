import { createFileRoute } from "@tanstack/react-router";

import { auditLog } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

export const Route = createFileRoute("/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Append-only audit records showing actor, action, entity, before and after values, result and correlation ID.",
      },
      { property: "og:title", content: "Audit Log · AURIQ" },
      {
        property: "og:description",
        content: "Append-only audit trail with correlation IDs — demo data.",
      },
    ],
  }),
  component: AuditLog,
});

function AuditLog() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        title={t("audit.title")}
        description={t("audit.desc")}
        actions={<StatusBadge tone="info">{t("audit.badge")}</StatusBadge>}
      />

      <PanelCard title={`${t("audit.records")} (${auditLog.length})`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <caption className="sr-only">{t("audit.caption")}</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  {t("audit.timestamp")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("audit.actor")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("audit.action")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("audit.entity")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("audit.before")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("audit.after")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("audit.result")}
                </th>
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  {t("audit.correlation")}
                </th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="num px-4 py-2.5 whitespace-nowrap">{r.timestamp}</td>
                  <td className="px-2 py-2.5 text-xs">{r.actor}</td>
                  <td className="num px-2 py-2.5 text-xs text-info">{r.action}</td>
                  <td className="num px-2 py-2.5 text-xs text-muted-foreground">{r.entity}</td>
                  <td className="num px-2 py-2.5 text-xs text-muted-foreground">{r.before}</td>
                  <td className="num px-2 py-2.5 text-xs">{r.after}</td>
                  <td
                    className={cn(
                      "px-2 py-2.5 text-xs font-semibold",
                      r.result === "Success" && "text-positive",
                      r.result === "Blocked" && "text-primary",
                      r.result === "Failed" && "text-negative",
                    )}
                  >
                    {r.result}
                  </td>
                  <td className="num px-4 py-2.5 text-xs text-muted-foreground">
                    {r.correlationId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>
    </>
  );
}
