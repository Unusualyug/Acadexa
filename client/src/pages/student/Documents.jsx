import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download,
  FileText,
  Trash2,
  FolderLock,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { api, apiMessage } from "../../lib/api";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { SkeletonRows } from "../../components/ui/Skeleton";
import { PageHeader } from "../../components/ui/PageHeader";
import { PillTabs } from "../../components/ui/Tabs";
import { Link } from "react-router-dom";
import { fileSize, formatDate } from "../../lib/utils";

const PURPOSES = {
  reference: "Reference",
  deliverable: "Delivered",
  "revision-reference": "Revision reference",
  "message-attachment": "Message attachment",
};

export default function Documents() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("All");
  const { data, isLoading } = useQuery({
    queryKey: ["files", "mine"],
    queryFn: async () => (await api.get("/files")).data.files,
  });

  const files = (data || []).filter(
    (f) =>
      filter === "All" ||
      (filter === "Delivered"
        ? f.purpose === "deliverable"
        : f.purpose === "reference"),
  );

  const remove = async (f) => {
    if (
      !window.confirm(
        `Delete ${f.originalName}? This removes the stored file permanently.`,
      )
    )
      return;
    try {
      await api.delete(`/files/${f._id}`);
      toast.success("File deleted");
      qc.invalidateQueries({ queryKey: ["files"] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Your reference uploads and delivered files. Every download is authorised on the server and counted."
      />

      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-emerald/25 bg-mint p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            className="mt-0.5 size-4.5 shrink-0 text-forest"
            aria-hidden
          />
          <p className="text-[12.5px] leading-relaxed text-forest">
            Files are stored privately, outside the public web root. Retention
            is 24 months by default, after which they are purged automatically.
          </p>
        </div>
        <Button to="/dashboard/privacy" size="sm" variant="secondary">
          Privacy Center
        </Button>
      </div>

      <PillTabs
        options={["All", "Reference", "Delivered"]}
        value={filter}
        onChange={setFilter}
        className="mb-4 w-fit"
        layoutId="documents-tab"
      />

      {isLoading ? (
        <SkeletonRows count={4} />
      ) : files.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {files.map((f) => (
            <Card key={f._id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-forest">
                  <FileText className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {f.originalName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {fileSize(f.size)} · {PURPOSES[f.purpose] || f.purpose}{" "}
                    {f.version > 1 && `· v${f.version}`}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-slate-400">
                    Uploaded {formatDate(f.createdAt)}
                    {f.retentionUntil
                      ? ` · retained until ${formatDate(f.retentionUntil)}`
                      : ""}
                  </p>
                  {f.order && (
                    <Link
                      to={`/dashboard/orders/${f.order._id || f.order}`}
                      className="mt-1 inline-block font-mono text-[10.5px] text-forest hover:underline"
                    >
                      {f.order.reference || "View order"}
                    </Link>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    href={`/api/files/${f._id}/download`}
                    icon={Download}
                    aria-label={`Download ${f.originalName}`}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-red-50"
                    onClick={() => remove(f)}
                    icon={Trash2}
                    aria-label={`Delete ${f.originalName}`}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderLock}
          title="No documents"
          description="Reference files you attach to a request, and deliverables uploaded to your orders, appear here."
          actionLabel="Create a request"
          actionTo="/dashboard/requests/new"
        />
      )}
    </div>
  );
}
