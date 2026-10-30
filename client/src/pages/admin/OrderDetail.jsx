import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft, FileText, UploadCloud, Users, CalendarClock, MessageCircle, StickyNote, Send, Download, Clock, ShieldCheck,
  CheckCircle2, CloudOff, TriangleAlert,
} from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UnderlineTabs } from '../../components/ui/Tabs';
import { FormField, Input, Select, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { OrderTimeline } from '../../components/dashboard/OrderTimeline';
import { MessageThread } from '../../components/dashboard/MessageThread';
import { useDropzone } from 'react-dropzone';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { fileSize, formatDate, formatDateTime, money, statusStyle } from '../../lib/utils';

const NEXT_STATUSES = {
  'Pending Review': ['Quotation Sent', 'More Information Required', 'Rejected', 'Confirmed', 'Cancelled'],
  'More Information Required': ['Pending Review', 'Quotation Sent', 'Rejected', 'Cancelled'],
  'Quotation Sent': ['Awaiting Payment', 'Rejected', 'Cancelled'],
  'Awaiting Payment': ['Confirmed', 'Cancelled'],
  Confirmed: ['In Progress', 'Cancelled'],
  'In Progress': ['Awaiting Student Information', 'Ready for Review', 'Delivered', 'Cancelled'],
  'Awaiting Student Information': ['In Progress', 'Cancelled'],
  'Ready for Review': ['Delivered', 'In Progress'],
  Delivered: ['Completed', 'Revision Requested'],
  'Revision Requested': ['In Progress', 'Delivered'],
  Completed: ['Refund Pending'],
  'Refund Pending': ['Refunded', 'Completed'],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('Overview');
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [deliverFiles, setDeliverFiles] = useState([]);
  const [note, setNote] = useState('');
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [purgeList, setPurgeList] = useState(null);
  const quoteForm = useForm({ defaultValues: { revisionLimit: 2, validDays: 7 } });
  const statusForm = useForm();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: async () => (await api.get(`/orders/staff/${id}`)).data,
  });
  const { data: consultants } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => (await api.get('/users/consultants')).data.consultants,
    enabled: ['admin', 'owner'].includes(user?.role),
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 8,
    maxSize: 10 * 1024 * 1024,
    onDrop: (accepted) => setDeliverFiles((prev) => [...prev, ...accepted].slice(0, 8)),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;
  if (isError) return <EmptyState title="Order unavailable" description="You may not have access to this order." actionLabel="Back" actionTo="/admin/orders" />;

  const { order, quotations, files, messages } = data;
  const latest = quotations?.[0];
  const canQuote = ['Pending Review', 'More Information Required', 'Quotation Sent', 'Awaiting Payment'].includes(order.status);
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  const changeStatus = async (values) => {
    try {
      await api.patch(`/orders/${order._id}/status`, { status: values.status, note: values.note || undefined });
      toast.success(`Status updated to ${values.status}`);
      statusForm.reset();
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const openComplete = async () => {
    setCompleteOpen(true);
    setPurgeList(null);
    try {
      const { data } = await api.get(`/files/order/${order._id}/purge-preview`);
      setPurgeList(data);
    } catch (e) {
      setPurgeList({ count: 0, files: [], error: apiMessage(e) });
    }
  };

  const markCompleted = async () => {
    setCompleting(true);
    try {
      const { data } = await api.patch(`/orders/${order._id}/status`, { status: 'Completed' });
      const n = data?.purged?.purged?.length || 0;
      const where = data?.purged?.provider === 'cloudinary' ? 'Cloudinary' : 'storage';
      toast.success(`Order completed — ${n} file${n === 1 ? '' : 's'} deleted from ${where}`);
      setCompleteOpen(false);
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setCompleting(false);
    }
  };

  const createQuotation = async (values) => {
    try {
      await api.post('/quotations', {
        orderId: order._id,
        amount: Number(values.amount),
        scope: values.scope,
        deliverables: String(values.deliverables).split('\n').map((s) => s.trim()).filter(Boolean),
        estimatedDelivery: new Date(values.estimatedDelivery).toISOString(),
        revisionLimit: Number(values.revisionLimit),
        validDays: Number(values.validDays),
        paymentTerms: values.paymentTerms,
        terms: values.terms,
      });
      toast.success('Quotation sent to the student');
      setQuoteOpen(false);
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const uploadDeliverables = async () => {
    if (!deliverFiles.length) return toast.error('Attach at least one deliverable.');
    try {
      const form = new FormData();
      deliverFiles.forEach((f) => form.append('files', f));
      await api.post(`/files/order/${order._id}/deliverables`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Deliverables uploaded and student notified');
      setDeliverOpen(false);
      setDeliverFiles([]);
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const assign = async (consultantId) => {
    try {
      await api.patch(`/orders/${order._id}/assign`, { consultantId });
      toast.success('Consultant assigned');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const updateDeadline = async (deadline) => {
    try {
      await api.patch(`/orders/${order._id}/deadline`, { deadline, reason: 'Adjusted by staff' });
      toast.success('Deadline updated and student notified');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post(`/orders/${order._id}/internal-notes`, { note: note.trim() });
      toast.success('Internal note saved');
      setNote('');
      qc.invalidateQueries();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  return (
    <div className="space-y-5">
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-forest">
        <ArrowLeft className="size-3.5" aria-hidden /> Orders
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle(order.status)}`}>{order.status}</span>
              <span className="font-mono text-[11px] text-muted">{order.reference}</span>
              <Badge tone={order.paymentStatus === 'Paid' ? 'success' : 'warn'}>{order.paymentStatus}</Badge>
            </div>
            <h1 className="mt-2 font-display text-[22px] font-extrabold text-ink">{order.title}</h1>
            <p className="mt-1 text-[12.5px] text-muted">
              {order.student?.name} ({order.student?.email}) · {order.serviceName} · submitted {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canQuote && <Button onClick={() => setQuoteOpen(true)} icon={FileText}>{latest ? 'Revise quotation' : 'Create quotation'}</Button>}
            {['In Progress', 'Revision Requested', 'Ready for Review'].includes(order.status) && (
              <Button variant="secondary" onClick={() => setDeliverOpen(true)} icon={UploadCloud}>Upload deliverables</Button>
            )}
            {nextStatuses.includes('Completed') && (
              <Button onClick={openComplete} icon={CheckCircle2}>Mark completed</Button>
            )}
          </div>
        </div>
      </Card>

      <UnderlineTabs options={['Overview', 'Quotation', 'Files', 'Messages', 'Internal']} value={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader title="Request details" icon={FileText} />
              <div className="space-y-3 p-5 text-[13px]">
                <p className="whitespace-pre-wrap text-ink">{order.instructions}</p>
                {order.deliverablesRequired && <div><p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">Deliverables</p><p className="text-muted">{order.deliverablesRequired}</p></div>}
                {order.institutionalGuidelines && <div><p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">Guidelines</p><p className="text-muted">{order.institutionalGuidelines}</p></div>}
                <div className="grid gap-2 border-t border-line pt-3 text-[12px] sm:grid-cols-2">
                  <p className="text-muted">Deadline: <span className="font-semibold text-ink">{formatDate(order.deadline)}</span></p>
                  <p className="text-muted">Preferred contact: <span className="font-semibold text-ink">{order.preferredCommunication}</span></p>
                  <p className="text-muted">Revisions used: <span className="font-semibold text-ink">{order.revisionCount} / {latest?.revisionLimit ?? '—'}</span></p>
                  <p className="text-muted">Agreed amount: <span className="font-semibold text-ink">{order.agreedAmount ? money(order.agreedAmount, order.currency) : '—'}</span></p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Order timeline" description="Full audit trail including internal actions" icon={Clock} />
              <div className="p-5"><OrderTimeline activity={order.activity} /></div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Change status" icon={Send} />
              <div className="space-y-3 p-5">
                {nextStatuses.length ? (
                  <form onSubmit={statusForm.handleSubmit(changeStatus)} className="space-y-3">
                    <FormField label="Next status" htmlFor="status">
                      <Select id="status" {...statusForm.register('status', { required: true })}>
                        {nextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </FormField>
                    <FormField label="Note for the student" htmlFor="status-note" hint="Optional">
                      <Textarea id="status-note" rows={2} {...statusForm.register('note')} />
                    </FormField>
                    <Button type="submit" className="w-full" size="sm">Update status</Button>
                  </form>
                ) : <p className="text-[12.5px] text-muted">This order has reached a final status.</p>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Assignment & deadline" icon={Users} />
              <div className="space-y-3 p-5">
                <FormField label="Assigned consultant" htmlFor="consultant">
                  <Select id="consultant" value={order.assignedConsultant?._id || ''} onChange={(e) => assign(e.target.value)} disabled={!['admin', 'owner'].includes(user?.role)}>
                    <option value="">Unassigned</option>
                    {consultants?.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.role})</option>)}
                  </Select>
                </FormField>
                <FormField label="Delivery deadline" htmlFor="deadline">
                  <input
                    id="deadline"
                    type="date"
                    defaultValue={new Date(order.deadline).toISOString().slice(0, 10)}
                    onChange={(e) => updateDeadline(new Date(e.target.value).toISOString())}
                    className="h-11 w-full rounded-xl border border-line px-3.5 text-sm"
                  />
                </FormField>
                <p className="text-[11px] leading-relaxed text-muted">Deadline changes are recorded in the order history and notify the student.</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'Quotation' && (
        <div className="space-y-3">
          {quotations?.length ? quotations.map((q) => (
            <Card key={q._id}>
              <CardHeader title={`${q.reference} · v${q.version}`} description={`Sent ${formatDateTime(q.sentAt || q.createdAt)} · expires ${formatDate(q.expiresAt)}`} icon={FileText} action={<Badge status={q.status}>{q.status}</Badge>} />
              <div className="grid gap-4 p-5 sm:grid-cols-[1.5fr_0.5fr]">
                <div className="space-y-2 text-[12.5px]">
                  <p className="text-muted"><span className="font-semibold text-ink">Scope: </span>{q.scope}</p>
                  <p className="text-muted"><span className="font-semibold text-ink">Deliverables: </span>{q.deliverables?.join(', ')}</p>
                  <p className="text-muted"><span className="font-semibold text-ink">Revisions: </span>{q.revisionLimit} · <span className="font-semibold text-ink">Est. delivery: </span>{formatDate(q.estimatedDelivery)}</p>
                  <p className="text-muted"><span className="font-semibold text-ink">Terms: </span>{q.paymentTerms}</p>
                  {q.acceptedAt && <p className="text-emerald">Accepted {formatDateTime(q.acceptedAt)}</p>}
                  {q.rejectedAt && <p className="text-danger">Rejected {formatDateTime(q.rejectedAt)}</p>}
                </div>
                <p className="text-right font-display text-2xl font-extrabold text-forest sm:text-right">{money(q.amount, q.currency)}</p>
              </div>
            </Card>
          )) : <EmptyState icon={FileText} title="No quotation issued" description="Create a quotation to send the scope, price and delivery terms for approval." action={<Button className="mt-4" onClick={() => setQuoteOpen(true)}>Create quotation</Button>} />}
        </div>
      )}

      {tab === 'Files' && (
        <Card>
          <CardHeader title="Files on this order" description={`${files?.length || 0} file(s)`} icon={Download} action={<Button size="sm" variant="secondary" onClick={() => setDeliverOpen(true)} icon={UploadCloud}>Upload deliverable</Button>} />
          <ul className="divide-y divide-line">
            {files?.length ? files.map((f) => (
              <li key={f._id} className="flex items-center gap-3 px-5 py-3">
                <FileText className="size-4 shrink-0 text-forest" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{f.originalName}</p>
                  <p className="text-[10.5px] text-muted">{f.purpose} · {fileSize(f.size)} · v{f.version} · {formatDate(f.createdAt)}</p>
                </div>
                <Button size="sm" variant="ghost" href={`/api/files/${f._id}/download`} icon={Download} aria-label={`Download ${f.originalName}`} />
              </li>
            )) : <li className="px-5 py-8 text-center text-[12.5px] text-muted">No files attached.</li>}
          </ul>
        </Card>
      )}

      {tab === 'Messages' && (
        <Card>
          <CardHeader title="Conversation with student" icon={MessageCircle} action={<Badge tone="neutral">{messages?.length || 0} messages</Badge>} />
          <div className="p-4"><MessageThread orderId={order._id} /></div>
        </Card>
      )}

      {tab === 'Internal' && (
        <Card>
          <CardHeader title="Internal notes" description="Never shown to the student" icon={StickyNote} />
          <div className="space-y-3 p-5">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal context, quality checks, escalation notes…" />
            <div className="flex justify-end"><Button size="sm" onClick={addNote} disabled={!note.trim()}>Save note</Button></div>
            <ul className="divide-y divide-line border-t border-line pt-3">
              {order.internalNotes?.length ? [...order.internalNotes].reverse().map((n, i) => (
                <li key={i} className="py-2.5">
                  <p className="text-[12.5px] text-ink">{n.note}</p>
                  <p className="text-[10.5px] text-muted">{formatDateTime(n.at)}</p>
                </li>
              )) : <li className="py-3 text-[12px] text-muted">No internal notes yet.</li>}
            </ul>
            <p className="flex items-start gap-2 rounded-xl bg-canvas px-3.5 py-2.5 text-[11px] text-muted">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald" aria-hidden />
              Internal notes stay visible to staff only. Sensitive actions are recorded in the audit log.
            </p>
          </div>
        </Card>
      )}

      <Modal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        title={latest ? 'Revise quotation' : 'Create quotation'}
        description="The student must approve this before work starts. Any revision supersedes the previous version."
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setQuoteOpen(false)}>Cancel</Button><Button loading={quoteForm.formState.isSubmitting} onClick={quoteForm.handleSubmit(createQuotation)}>Send quotation</Button></>}
      >
        <form onSubmit={quoteForm.handleSubmit(createQuotation)} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Amount (INR)" htmlFor="amount" required>
            <Input id="amount" type="number" min="0" step="1" {...quoteForm.register('amount', { required: true, min: 0 })} />
          </FormField>
          <FormField label="Estimated delivery" htmlFor="estimatedDelivery" required>
            <Input id="estimatedDelivery" type="date" {...quoteForm.register('estimatedDelivery', { required: true })} />
          </FormField>
          <FormField label="Revision limit" htmlFor="revisionLimit">
            <Input id="revisionLimit" type="number" min="0" max="20" {...quoteForm.register('revisionLimit')} />
          </FormField>
          <FormField label="Valid for (days)" htmlFor="validDays">
            <Input id="validDays" type="number" min="1" max="60" {...quoteForm.register('validDays')} />
          </FormField>
          <FormField label="Agreed scope" htmlFor="scope" required className="sm:col-span-2">
            <Textarea id="scope" rows={3} placeholder="Exactly what will be delivered, and what is out of scope." {...quoteForm.register('scope', { required: true, minLength: 20 })} />
          </FormField>
          <FormField label="Deliverables (one per line)" htmlFor="deliverables" required className="sm:col-span-2">
            <Textarea id="deliverables" rows={3} placeholder={'Formatted DOCX\nPrint-ready PDF'} {...quoteForm.register('deliverables', { required: true })} />
          </FormField>
          <FormField label="Payment terms" htmlFor="paymentTerms" className="sm:col-span-2">
            <Input id="paymentTerms" defaultValue="Full payment before work begins. 100% advance." {...quoteForm.register('paymentTerms')} />
          </FormField>
          <FormField label="Additional terms" htmlFor="terms" className="sm:col-span-2">
            <Textarea id="terms" rows={2} {...quoteForm.register('terms')} />
          </FormField>
        </form>
      </Modal>

      <Modal
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        title="Upload deliverables"
        description="Uploading marks the order Delivered and notifies the student. Previous versions stay accessible."
        footer={<><Button variant="secondary" onClick={() => setDeliverOpen(false)}>Cancel</Button><Button onClick={uploadDeliverables} icon={UploadCloud}>Upload & notify</Button></>}
      >
        <div className="space-y-3">
          <div {...getRootProps()} className={`cursor-pointer rounded-2xl border-2 border-dashed px-5 py-7 text-center ${isDragActive ? 'border-emerald bg-mint' : 'border-line bg-canvas hover:border-emerald/50'}`}>
            <input {...getInputProps()} aria-label="Attach deliverable files" />
            <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-forest ring-1 ring-line"><UploadCloud className="size-5" aria-hidden /></span>
            <p className="mt-3 text-[13px] font-semibold text-ink">Drag & drop or click to attach deliverables</p>
            <p className="mt-1 text-[11.5px] text-muted">PDF, DOCX, XLSX, PPTX, TXT, CSV, PNG, JPG, ZIP · up to 10 MB each</p>
          </div>
          {deliverFiles.length > 0 && (
            <ul className="space-y-2">
              {deliverFiles.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[12px]">
                  <FileText className="size-4 text-forest" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-ink">{f.name}</span>
                  <span className="text-[10.5px] text-muted">{fileSize(f.size)}</span>
                  <button type="button" onClick={() => setDeliverFiles((prev) => prev.filter((_, idx) => idx !== i))} className="rounded p-1 text-muted hover:bg-red-50 hover:text-danger" aria-label={`Remove ${f.name}`}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

        <Modal
          open={completeOpen}
          onClose={() => setCompleteOpen(false)}
          title="Complete this order?"
          description={`${order.reference} · ${order.student?.name}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCompleteOpen(false)}>Cancel</Button>
              <Button onClick={markCompleted} loading={completing} icon={CloudOff} disabled={!purgeList || purgeList?.error}>
                Complete & delete files
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
              <p className="text-[12.5px] leading-relaxed text-amber-900">
                Completing closes the order for good. Every document attached to it — the files the student
                uploaded and the deliverables you sent — is <strong>permanently deleted</strong>. The order
                history keeps a read-only record that the files were purged, but the documents cannot be
                recovered. Files on the student&apos;s other orders are not touched.
              </p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold tracking-wide text-muted uppercase">
                Files that will be deleted{purgeList?.count ? ` (${purgeList.count})` : ''}
              </p>
              {!purgeList ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : purgeList.error ? (
                <p className="text-[12.5px] text-danger">{purgeList.error}</p>
              ) : purgeList.count === 0 ? (
                <p className="rounded-xl bg-canvas px-3.5 py-3 text-[12.5px] text-muted">
                  This order has no stored files. Only the status will change.
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {purgeList.files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-semibold text-ink">{f.name}</span>
                        <span className="text-[11px] text-muted">{f.purpose === 'deliverable' ? 'Deliverable' : 'Student upload'} · {f.provider}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-muted">{fileSize(f.size)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
    </div>
  );
}
