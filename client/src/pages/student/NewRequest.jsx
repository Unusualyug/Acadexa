import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { api, apiMessage, apiDetails } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Select, Textarea, Checkbox } from '../../components/ui/Field';
import { FileDropzone } from '../../components/forms/FileDropzone';
import { money } from '../../lib/utils';
import { Skeleton } from '../../components/ui/Skeleton';

const schema = z.object({
  serviceId: z.string().min(1, 'Choose a service'),
  title: z.string().min(5, 'Give your request a short, specific title').max(160),
  subjectArea: z.string().max(160).optional(),
  instructions: z.string().min(30, 'Describe your requirements in at least 30 characters').max(6000),
  deliverablesRequired: z.string().max(2000).optional(),
  institutionalGuidelines: z.string().max(2000).optional(),
  additionalNotes: z.string().max(2000).optional(),
  preferredCommunication: z.enum(['In-app messages', 'Email', 'WhatsApp']),
  deadline: z.string().min(1, 'Choose a deadline'),
  integrityAccepted: z.literal(true, { message: 'You must confirm the academic-integrity terms' }),
});

export default function NewRequest() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [details, setDetails] = useState([]);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['services', 'request-form'],
    queryFn: async () => (await api.get('/services')).data,
  });

  const presetService = params.get('service') || '';
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: presetService,
      preferredCommunication: 'In-app messages',
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    },
  });

  const selectedId = watch('serviceId');
  const selected = data?.services?.find((s) => s._id === selectedId);
  const err = (f) => errors[f]?.message || details.find((d) => d.path === f)?.message;

  const onSubmit = async (values) => {
    setFormError('');
    setDetails([]);
    try {
      const { data: res } = await api.post('/orders', {
        ...values,
        deadline: new Date(values.deadline).toISOString(),
        fileIds: files.map((f) => f._id),
      });
      toast.success(`Request ${res.reference} submitted`);
      navigate(`/dashboard/orders/${res.order._id}`, { replace: true });
    } catch (e) {
      setFormError(apiMessage(e, 'Could not submit your request.'));
      setDetails(apiDetails(e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">New service request</h1>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
          The more precise your requirements, the faster we can quote. You'll receive a reference immediately; a written quotation follows after review.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 lg:grid-cols-[1.5fr_0.75fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Service & scope" icon={ArrowRight} />
            <div className="space-y-4 p-5">
              {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-danger">{formError}</div>}

              <FormField label="Service" htmlFor="serviceId" required error={err('serviceId')}>
                {isLoading ? <Skeleton className="h-11 rounded-xl" /> : (
                  <Select id="serviceId" {...register('serviceId')}>
                    <option value="">Select a service…</option>
                    {data.services.map((s) => <option key={s._id} value={s._id}>{s.name} — {s.startingPrice > 0 ? `from ${money(s.startingPrice, s.currency)}` : 'custom quote'}</option>)}
                  </Select>
                )}
              </FormField>

              {selected && (
                <div className="rounded-xl border border-emerald/25 bg-mint p-3.5">
                  <p className="text-[12px] leading-relaxed text-forest">{selected.shortDescription}</p>
                  <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-forest/70">
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" aria-hidden />{selected.turnaroundEstimate}</span>
                    <span>Revisions: {selected.revisionLimit}</span>
                    <span>Formats: {selected.acceptedFormats?.slice(0, 4).join(', ')}</span>
                  </p>
                </div>
              )}

              <FormField label="Request title" htmlFor="title" required error={err('title')} hint="Visible only to you and staff">
                <Input id="title" placeholder="e.g. Semester 4 Physics lab manual — 10 experiments" {...register('title')} />
              </FormField>

              <FormField label="Subject or technical area" htmlFor="subjectArea" error={err('subjectArea')}>
                <Input id="subjectArea" placeholder="e.g. Applied Physics / Data Structures" {...register('subjectArea')} />
              </FormField>

              <FormField label="Detailed instructions" htmlFor="instructions" required error={err('instructions')} hint={`${(watch('instructions') || '').length}/6000`}>
                <Textarea id="instructions" rows={6} placeholder="What exactly do you need? Mention format, word count, chapters, style guide, and anything already completed." {...register('instructions')} />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Deliverables required" htmlFor="deliverablesRequired" error={err('deliverablesRequired')}>
                  <Textarea id="deliverablesRequired" rows={3} placeholder="e.g. Formatted DOCX + print-ready PDF" {...register('deliverablesRequired')} />
                </FormField>
                <FormField label="Institutional guidelines" htmlFor="institutionalGuidelines" error={err('institutionalGuidelines')}>
                  <Textarea id="institutionalGuidelines" rows={3} placeholder="Template, style guide or rubric to follow" {...register('institutionalGuidelines')} />
                </FormField>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Reference files" description="Upload any drafts, observations, templates or screenshots" icon={ShieldCheck} />
            <div className="p-5">
              <FileDropzone files={files} onChange={setFiles} purpose="reference" />
              <p className="mt-3 rounded-xl bg-canvas px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted">
                Files are private by default. They are validated on the server, stored outside the public web root and can only be downloaded through authorised links.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Deadline & communication" icon={Clock} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <FormField label="Required by" htmlFor="deadline" required error={err('deadline')}>
                <Input id="deadline" type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} {...register('deadline')} />
              </FormField>
              <FormField label="Preferred communication" htmlFor="preferredCommunication" error={err('preferredCommunication')}>
                <Select id="preferredCommunication" {...register('preferredCommunication')}>
                  <option>In-app messages</option>
                  <option>Email</option>
                  <option>WhatsApp</option>
                </Select>
              </FormField>
              <FormField label="Additional notes" htmlFor="additionalNotes" error={err('additionalNotes')} className="sm:col-span-2">
                <Textarea id="additionalNotes" rows={3} placeholder="Anything else we should know — availability, prior feedback, constraints…" {...register('additionalNotes')} />
              </FormField>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="lg:sticky lg:top-24">
            <CardHeader title="Before you submit" icon={ShieldCheck} />
            <div className="space-y-3 p-5">
              <Checkbox
                label={<>I confirm this request is for guidance, editing, formatting or support only, and that I will comply with my institution's academic-integrity rules.</>}
                {...register('integrityAccepted')}
              />
              {err('integrityAccepted') && <p className="flex items-start gap-1.5 text-[11.5px] font-medium text-danger"><AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />{err('integrityAccepted')}</p>}

              <ul className="space-y-2 border-t border-line pt-3">
                {['Written quotation before any payment', 'Deadline confirmed in the quotation', 'Private file handling with audit trail', 'Revision terms stated upfront'].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald" aria-hidden />{t}
                  </li>
                ))}
              </ul>

              <Button type="submit" className="w-full" loading={isSubmitting}>Submit request</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>Cancel</Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
