import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  CalendarDays,
  FileText,
  FolderLock,
  Download,
  Trash2,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { api, apiMessage } from "../../lib/api";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Select } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton, SkeletonRows } from "../../components/ui/Skeleton";
import {
  formatDate,
  formatDateTime,
  fileSize,
  initials,
  formatPhone,
  telHref,
  money,
  statusStyle,
} from "../../lib/utils";

const NEXT_STATUSES = {
  "Pending Review": [
    "Quotation Sent",
    "More Information Required",
    "Rejected",
    "Confirmed",
    "Cancelled",
  ],
  "More Information Required": [
    "Pending Review",
    "Quotation Sent",
    "Rejected",
    "Cancelled",
  ],
  "Quotation Sent": ["Awaiting Payment", "Rejected", "Cancelled"],
  "Awaiting Payment": ["Confirmed", "Cancelled"],
  Confirmed: ["In Progress", "Cancelled"],
  "In Progress": [
    "Awaiting Student Information",
    "Ready for Review",
    "Delivered",
    "Cancelled",
  ],
  "Awaiting Student Information": ["In Progress", "Cancelled"],
  "Ready for Review": ["Delivered", "In Progress"],
  Delivered: ["Completed", "Revision Requested"],
  "Revision Requested": ["In Progress", "Delivered"],
  Completed: ["Refund Pending"],
  "Refund Pending": ["Refunded", "Completed"],
};

const purposeLabel = (p) =>
  ({
    reference: "Student upload",
    "revision-reference": "Revision upload",
    deliverable: "Deliverable",
  })[p] || p;

/**
 * Admin → one student.
 *
 * Everything an admin needs to answer "where is this student's work?" in one
 * screen: their orders with the status change inline, and every document they
 * have uploaded, each individually deletable.
 *
 * Deleting a file here calls the same endpoint the rest of the app uses, so the
 * stored object is destroyed in Cloudinary — not just the database record.
 */
export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statusDraft, setStatusDraft] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "student", id],
    queryFn: async () => (await api.get(`/admin/students/${id}/overview`)).data,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <SkeletonRows count={4} />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Student unavailable"
        description="This account may have been deleted, or you may not have permission to view it."
        action={
          <Button className="mt-4" onClick={() => navigate("/admin/students")}>
            Back to directory
          </Button>
        }
      />
    );
  }

  const { student, orders, files, summary, storage } = data;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "student", id] });
    qc.invalidateQueries({ queryKey: ["admin", "students"] });
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  const changeStatus = async (order) => {
    const status = statusDraft[order._id] || NEXT_STATUSES[order.status]?.[0];
    if (!status) return;
    if (
      status === "Completed" &&
      !window.confirm(
        `Completing ${order.reference} also permanently deletes its uploaded files from ${storage}. Continue?`,
      )
    )
      return;
    try {
      const { data: res } = await api.patch(`/orders/${order._id}/status`, {
        status,
        note: "Updated from student detail view",
      });
      const purged = res?.purged?.purged?.length || 0;
      toast.success(`${order.reference} → ${status}`, {
        description: purged
          ? `${purged} file(s) deleted from ${res.purged.provider}.`
          : undefined,
      });
      setStatusDraft((d) => ({ ...d, [order._id]: undefined }));
      refresh();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const deleteFile = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/files/${deleteTarget._id}`);
      toast.success("File deleted", {
        description:
          deleteTarget.provider === "cloudinary"
            ? "Removed from Cloudinary and the database record marked deleted."
            : "Removed from storage and the database record marked deleted.",
      });
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const setAccountStatus = async (accountStatus) => {
    if (
      !window.confirm(
        `Set ${student.name}'s account status to "${accountStatus}"? This is recorded in the audit log.`,
      )
    )
      return;
    try {
      await api.patch(`/admin/students/${student._id}`, {
        accountStatus,
        note: "Changed from student detail view",
      });
      toast.success("Account updated");
      refresh();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to="/admin/students"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-forest"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Student directory
      </Link>

      {/* ---------- who ---------- */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-forest text-[15px] font-bold text-white">
              {initials(student.name)}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[22px] font-extrabold text-ink">
                {student.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
                <a
                  href={`mailto:${student.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-forest"
                >
                  <Mail className="size-3.5" aria-hidden /> {student.email}
                </a>
                {student.phone ? (
                  <a
                    href={`tel:${telHref(student.phone)}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline"
                    title={`Call ${student.name}`}
                  >
                    <Phone className="size-3.5" aria-hidden />{" "}
                    {formatPhone(student.phone)}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-700">
                    <Phone className="size-3.5" aria-hidden /> No mobile number
                  </span>
                )}
                {student.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden /> {student.city}
                  </span>
                )}
                {student.institution && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="size-3.5" aria-hidden />{" "}
                    {student.institution}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden /> Joined{" "}
                  {formatDate(student.createdAt)}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Badge
                  tone={
                    student.accountStatus === "active"
                      ? "success"
                      : student.accountStatus === "suspended"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {student.accountStatus.replace("_", " ")}
                </Badge>
                <Badge tone={student.emailVerified ? "success" : "warn"}>
                  {student.emailVerified ? "email verified" : "unverified"}
                </Badge>
                <Badge tone="neutral">
                  {summary.orders} order{summary.orders === 1 ? "" : "s"}
                </Badge>
                <Badge tone="neutral">
                  {summary.files} file{summary.files === 1 ? "" : "s"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {student.accountStatus !== "active" && (
              <Button
                size="sm"
                variant="soft"
                onClick={() => setAccountStatus("active")}
                icon={UserCheck}
              >
                Activate
              </Button>
            )}
            {student.accountStatus === "active" && (
              <Button
                size="sm"
                variant="ghost"
                className="text-danger hover:bg-red-50"
                onClick={() => setAccountStatus("suspended")}
                icon={ShieldAlert}
              >
                Suspend
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-4">
          {[
            ["Active work", summary.active, Clock],
            ["Completed", summary.completed, CheckCircle2],
            ["Cancelled / rejected", summary.cancelled, ShieldAlert],
            ["Stored files", summary.files, FolderLock],
          ].map(([label, value, Icon]) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2.5"
            >
              <Icon className="size-4 shrink-0 text-forest" aria-hidden />
              <span className="text-[12px] text-muted">{label}</span>
              <span className="ml-auto font-display text-[15px] font-extrabold text-ink">
                {value}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ---------- work ---------- */}
      <Card>
        <CardHeader
          title="Work & status"
          description="Change the status of any request here — the student is notified, and the change is audited."
          icon={FileText}
        />
        {orders.length ? (
          <ul className="divide-y divide-line">
            {orders.map((o) => {
              const next = NEXT_STATUSES[o.status] || [];
              const chosen = statusDraft[o._id] || next[0] || "";
              return (
                <li
                  key={o._id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/orders/${o._id}`}
                        className="truncate text-[13px] font-semibold text-ink hover:text-forest hover:underline"
                      >
                        {o.title}
                      </Link>
                      <span className="font-mono text-[11px] text-muted">
                        {o.reference}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      {o.serviceName} · deadline {formatDate(o.deadline)}
                      {o.agreedAmount
                        ? ` · ${money(o.agreedAmount, o.currency)}`
                        : ""}
                      {" · payment "}
                      {o.paymentStatus}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(o.status)}`}
                  >
                    {o.status}
                  </span>
                  {next.length ? (
                    <div className="flex items-center gap-1.5">
                      <Select
                        aria-label={`New status for ${o.reference}`}
                        value={chosen}
                        onChange={(e) =>
                          setStatusDraft((d) => ({
                            ...d,
                            [o._id]: e.target.value,
                          }))
                        }
                        className="w-44 text-[12px]"
                      >
                        {next.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => changeStatus(o)}
                        icon={RefreshCw}
                      >
                        Update
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[11.5px] text-muted">
                      Final status
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-5 py-8">
            <EmptyState
              icon={FileText}
              title="No requests yet"
              description="This student has not submitted a service request."
            />
          </div>
        )}
      </Card>

      {/* ---------- files ---------- */}
      <Card>
        <CardHeader
          title="Uploaded documents"
          description={`${summary.files} live file(s) · stored in ${storage}${summary.filesByProvider?.cloudinary ? ` (${summary.filesByProvider.cloudinary} in Cloudinary)` : ""}. Deleting a file removes the stored document itself.`}
          icon={FolderLock}
        />
        {files.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left text-[12.5px]">
              <caption className="sr-only">
                Files uploaded by this student
              </caption>
              <thead className="bg-canvas">
                <tr className="text-[10.5px] tracking-[0.08em] text-muted uppercase">
                  <th scope="col" className="px-5 py-2.5 font-bold">
                    File
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    Kind
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    Order
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    Stored in
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    Uploaded
                  </th>
                  <th scope="col" className="px-5 py-2.5 text-right font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {files.map((f) => (
                  <tr key={f._id} className="hover:bg-canvas/60">
                    <td className="px-5 py-3">
                      <p
                        className="max-w-[16rem] truncate font-semibold text-ink"
                        title={f.originalName}
                      >
                        {f.originalName}
                      </p>
                      <p className="text-[11px] text-muted">
                        {fileSize(f.size)} · {f.mimeType}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {purposeLabel(f.purpose)}
                    </td>
                    <td className="px-3 py-3">
                      {f.order ? (
                        <Link
                          to={`/admin/orders/${f.order._id}`}
                          className="font-mono text-[11.5px] text-forest hover:underline"
                        >
                          {f.order.reference}
                        </Link>
                      ) : (
                        <span className="text-[11.5px] text-muted">
                          Not on an order
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${f.provider === "cloudinary" ? "border-emerald/30 bg-mint text-forest" : "border-line bg-canvas text-muted"}`}
                      >
                        {f.provider}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-muted">
                      {formatDate(f.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          href={`${api.defaults.baseURL}/files/${f._id}/download`}
                          icon={Download}
                          aria-label={`Download ${f.originalName}`}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger hover:bg-red-50"
                          onClick={() => setDeleteTarget(f)}
                          icon={Trash2}
                          aria-label={`Delete ${f.originalName}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8">
            <EmptyState
              icon={FolderLock}
              title="No documents"
              description="This student has not uploaded any files, or the files were purged when their orders were completed."
            />
          </div>
        )}
      </Card>

      {/* ---------- delete confirmation ---------- */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete this file permanently?"
        description={deleteTarget?.originalName}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button onClick={deleteFile} loading={deleting} icon={CloudOff}>
              Delete file
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0 text-amber-600"
              aria-hidden
            />
            <p className="text-[12.5px] leading-relaxed text-amber-900">
              The document is destroyed in{" "}
              <strong>
                {deleteTarget?.provider === "cloudinary"
                  ? "Cloudinary"
                  : "file storage"}
              </strong>{" "}
              and the student can no longer download it. The database keeps a
              record that it was deleted, who deleted it and when. This cannot
              be undone.
            </p>
          </div>
          {deleteTarget && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 rounded-xl bg-canvas px-4 py-3 text-[12px]">
              <dt className="text-muted">Size</dt>
              <dd className="text-ink">{fileSize(deleteTarget.size)}</dd>
              <dt className="text-muted">Kind</dt>
              <dd className="text-ink">{purposeLabel(deleteTarget.purpose)}</dd>
              <dt className="text-muted">Order</dt>
              <dd className="text-ink">
                {deleteTarget.order?.reference || "Not on an order"}
              </dd>
              <dt className="text-muted">Uploaded</dt>
              <dd className="text-ink">
                {formatDateTime(deleteTarget.createdAt)}
              </dd>
            </dl>
          )}
        </div>
      </Modal>
    </div>
  );
}
