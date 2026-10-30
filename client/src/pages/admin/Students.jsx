import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Users, ShieldAlert, UserCheck, Trash2, AlertTriangle, FileText, ReceiptText, MessageSquare, FolderLock, LifeBuoy, CalendarClock, Star, Bell, ScrollText, Phone, Eye } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { formatDate, initials, formatPhone, telHref } from '../../lib/utils';

const DELETE_ROWS = [
  { key: 'orders', label: 'Orders & requests', icon: FileText },
  { key: 'quotations', label: 'Quotations', icon: ReceiptText },
  { key: 'payments', label: 'Payments & receipts', icon: ReceiptText },
  { key: 'messages', label: 'Order & ticket messages', icon: MessageSquare },
  { key: 'files', label: 'Uploaded files (incl. stored copies)', icon: FolderLock },
  { key: 'tickets', label: 'Support tickets', icon: LifeBuoy },
  { key: 'bookings', label: 'Consultation bookings', icon: CalendarClock },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'privacyRequests', label: 'Privacy requests', icon: ShieldAlert },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'auditEntries', label: 'Audit entries authored by them', icon: ScrollText },
];

/** Confirmation dialog for permanently deleting a student and all related data. */
function DeleteStudentDialog({ student, onClose, onDeleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [working, setWorking] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'student-delete-preview', student?._id],
    enabled: Boolean(student?._id),
    queryFn: async () => (await api.get(`/admin/students/${student._id}/delete-preview`)).data,
    staleTime: 0,
  });

  const summary = data?.summary;
  const canDelete = confirmText.trim() === 'DELETE' && !working;

  const handleDelete = async () => {
    if (!canDelete) return;
    setWorking(true);
    try {
      const res = await api.delete(`/admin/students/${student._id}`, { data: { confirm: 'DELETE' } });
      const removed = res.data?.deleted || {};
      toast.success(`${student.name} deleted`, {
        description: `${removed.orders ?? 0} order(s), ${removed.payments ?? 0} payment(s) and ${res.data?.filesRemoved ?? 0} stored file(s) removed.`,
      });
      onDeleted?.(student);
      onClose();
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal
      open={Boolean(student)}
      onClose={working ? () => {} : onClose}
      title="Delete student permanently?"
      description="This removes the account and every record attached to it from the database. It cannot be undone."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={working}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={!canDelete} loading={working} icon={Trash2}>
            Delete permanently
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="text-[12.5px] leading-relaxed text-danger">
            <p className="font-semibold">{student?.name}</p>
            <p className="text-[11.5px] text-danger/80">{student?.email}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold tracking-[0.1em] text-muted uppercase">Will be permanently deleted</p>
          {isLoading ? (
            <p className="mt-2 text-[12px] text-muted">Counting records…</p>
          ) : (
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
              {DELETE_ROWS.map(({ key, label, icon: Icon }) => (
                <li key={key} className="flex items-center justify-between gap-3 px-3.5 py-2">
                  <span className="flex items-center gap-2 text-[12.5px] text-ink">
                    <Icon className="size-3.5 text-muted" aria-hidden /> {label}
                  </span>
                  <span className={`text-[12.5px] font-bold ${summary?.[key] ? 'text-danger' : 'text-slate-400'}`}>
                    {summary?.[key] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="block">
          <span className="text-[12px] font-semibold text-ink">
            Type <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-danger">DELETE</span> to confirm
          </span>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            aria-label="Type DELETE to confirm"
            className="mt-1.5"
            disabled={working}
          />
        </label>

        <p className="text-[11px] leading-relaxed text-muted">
          A masked audit entry (<span className="font-mono">student.deleted</span>) is kept so the removal itself stays accountable.
          Financial records are deleted with the account — export anything you must retain before continuing.
        </p>
      </div>
    </Modal>
  );
}

export default function AdminStudents() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'students', q, status, page],
    queryFn: async () => (await api.get('/admin/students', { params: { q, status: status || undefined, page, limit: 20 } })).data,
  });

  const setAccountStatus = async (student, accountStatus) => {
    if (!window.confirm(`Set ${student.name}'s account status to "${accountStatus}"? This is recorded in the audit log.`)) return;
    try {
      await api.patch(`/admin/students/${student._id}`, { accountStatus, note: 'Changed from admin directory' });
      toast.success('Account updated');
      qc.invalidateQueries({ queryKey: ['admin', 'students'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Student directory" description="Searchable student list with permitted details only. Sensitive account actions are permission-controlled and logged." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by name or email…" aria-label="Search students" className="pl-10" />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter status" className="sm:w-48">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
          <option value="pending_deletion">Pending deletion</option>
        </Select>
      </div>

      {isLoading ? <SkeletonRows count={6} /> : data?.students?.length ? (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {data.students.map((s) => (
              <li key={s._id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-mint text-[11px] font-bold text-forest">{initials(s.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{s.name}</p>
                  <p className="truncate text-[11.5px] text-muted">{s.email} · joined {formatDate(s.createdAt)}</p>
                  {s.phone ? (
                    <a
                      href={`tel:${telHref(s.phone)}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest hover:underline"
                      title={`Call ${s.name}`}
                    >
                      <Phone className="size-3" aria-hidden /> {formatPhone(s.phone)}
                    </a>
                  ) : (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-amber-700">
                      <Phone className="size-3" aria-hidden /> No mobile number on file
                    </span>
                  )}
                </div>
                <Badge tone={s.accountStatus === 'active' ? 'success' : s.accountStatus === 'suspended' ? 'danger' : 'neutral'}>{s.accountStatus.replace('_', ' ')}</Badge>
                <Badge tone={s.emailVerified ? 'success' : 'warn'}>{s.emailVerified ? 'verified' : 'unverified'}</Badge>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="secondary" to={`/admin/students/${s._id}`} icon={Eye}>Detail view</Button>
                  {s.accountStatus !== 'active' && <Button size="sm" variant="soft" onClick={() => setAccountStatus(s, 'active')} icon={UserCheck}>Activate</Button>}
                  {s.accountStatus === 'active' && <Button size="sm" variant="ghost" className="text-danger hover:bg-red-50" onClick={() => setAccountStatus(s, 'suspended')} icon={ShieldAlert}>Suspend</Button>}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-red-50"
                    onClick={() => setDeleteTarget(s)}
                    icon={Trash2}
                    aria-label={`Delete ${s.name}`}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <p className="text-[12px] text-muted">Page {data.page} of {data.pages} · {data.total} students</p>
              <div className="flex gap-1.5">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState icon={Users} title="No students found" description="Adjust your search or filters." />
      )}

      <DeleteStudentDialog
        student={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          qc.invalidateQueries({ queryKey: ['admin', 'students'] });
          qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
          qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
        }}
      />
    </div>
  );
}
