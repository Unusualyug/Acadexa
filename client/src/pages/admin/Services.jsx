import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { BookOpen, Plus, Pencil, EyeOff, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../../components/ui/Field';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { money } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/ui/EmptyState';

const ICONS = ['GraduationCap', 'BookOpen', 'FileText', 'Microscope', 'Code', 'Presentation', 'ClipboardCheck', 'CheckCircle', 'Settings', 'CalendarDays'];

export default function AdminServices() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const form = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: async () => (await api.get('/services', { params: { includeInactive: true, sort: 'order' } })).data.services,
  });

  const openNew = () => {
    setEditing(null);
    form.reset({ pricingModel: 'quotation', startingPrice: 0, revisionLimit: 2, availability: 'available', icon: 'BookOpen', isActive: true, sortOrder: (data?.length || 0) + 1 });
    setOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    form.reset({
      name: s.name, category: s.category, icon: s.icon, shortDescription: s.shortDescription, description: s.description,
      included: (s.included || []).join('\n'), excluded: (s.excluded || []).join('\n'), requirements: (s.requirements || []).join('\n'),
      acceptedFormats: (s.acceptedFormats || []).join(', '), pricingModel: s.pricingModel, startingPrice: s.startingPrice,
      turnaroundEstimate: s.turnaroundEstimate, revisionPolicy: s.revisionPolicy, revisionLimit: s.revisionLimit,
      availability: s.availability, sortOrder: s.sortOrder, isActive: s.isActive,
    });
    setOpen(true);
  };

  const save = async (values) => {
    const payload = {
      ...values,
      startingPrice: Number(values.startingPrice || 0),
      revisionLimit: Number(values.revisionLimit || 0),
      sortOrder: Number(values.sortOrder || 0),
      included: values.included ? values.included.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      excluded: values.excluded ? values.excluded.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      requirements: values.requirements ? values.requirements.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      acceptedFormats: values.acceptedFormats ? values.acceptedFormats.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      if (editing) await api.patch(`/services/${editing._id}`, payload);
      else await api.post('/services', payload);
      toast.success(editing ? 'Service updated' : 'Service created');
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      qc.invalidateQueries({ queryKey: ['services'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const togglePublish = async (s) => {
    try {
      if (s.isActive) await api.delete(`/services/${s._id}`);
      else await api.patch(`/services/${s._id}`, { isActive: true });
      toast.success(s.isActive ? 'Service unpublished' : 'Service published');
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
      qc.invalidateQueries({ queryKey: ['services'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const reorder = async (s, direction) => {
    const target = (data || []).find((x) => x.sortOrder === s.sortOrder + direction);
    try {
      await api.patch(`/services/${s._id}`, { sortOrder: s.sortOrder + direction });
      if (target) await api.patch(`/services/${target._id}`, { sortOrder: s.sortOrder });
      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  if (!['admin', 'owner'].includes(user?.role)) return <EmptyState title="Restricted" description="Service management requires administrator permissions." actionLabel="Back" actionTo="/admin" />;

  return (
    <div>
      <PageHeader title="Services & pricing" description="Create, edit, publish and reorder the catalogue. Unpublishing hides a service from new requests without affecting existing orders." action={<Button onClick={openNew} icon={Plus}>New service</Button>} />

      {isLoading ? <SkeletonRows count={6} /> : (
        <div className="space-y-3">
          {data?.map((s) => (
            <Card key={s._id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-forest"><ServiceIcon name={s.icon} className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13.5px] font-semibold text-ink">{s.name}</p>
                  <Badge tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Published' : 'Hidden'}</Badge>
                  <Badge tone={s.pricingModel === 'fixed' ? 'info' : 'neutral'}>{s.pricingModel === 'fixed' ? 'Fixed' : 'Quote'}</Badge>
                  {s.availability !== 'available' && <Badge tone="warn">{s.availability}</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted">{s.category} · from {money(s.startingPrice, s.currency)} · {s.turnaroundEstimate} · {s.revisionLimit} revisions</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => reorder(s, -1)} icon={ArrowUp} aria-label={`Move ${s.name} up`} />
                <Button size="sm" variant="ghost" onClick={() => reorder(s, 1)} icon={ArrowDown} aria-label={`Move ${s.name} down`} />
                <Button size="sm" variant="secondary" onClick={() => openEdit(s)} icon={Pencil}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => togglePublish(s)} icon={s.isActive ? EyeOff : Eye}>{s.isActive ? 'Unpublish' : 'Publish'}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={editing ? `Edit ${editing.name}` : 'Create service'}
        description="Scope statements are shown to students before they request — keep exclusions explicit."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.formState.isSubmitting} onClick={form.handleSubmit(save)}>Save service</Button></>}
      >
        <form onSubmit={form.handleSubmit(save)} className="grid gap-4 sm:grid-cols-2">
          <FormField label="Service name" htmlFor="name" required><Input id="name" {...form.register('name', { required: true })} /></FormField>
          <FormField label="Category" htmlFor="category" required><Input id="category" {...form.register('category', { required: true })} /></FormField>
          <FormField label="Icon" htmlFor="icon">
            <Select id="icon" {...form.register('icon')}>{ICONS.map((i) => <option key={i}>{i}</option>)}</Select>
          </FormField>
          <FormField label="Pricing model" htmlFor="pricingModel">
            <Select id="pricingModel" {...form.register('pricingModel')}><option value="fixed">Fixed price</option><option value="quotation">Custom quotation</option></Select>
          </FormField>
          <FormField label="Starting price (INR)" htmlFor="startingPrice"><Input id="startingPrice" type="number" min="0" {...form.register('startingPrice')} /></FormField>
          <FormField label="Turnaround" htmlFor="turnaroundEstimate"><Input id="turnaroundEstimate" placeholder="3-5 working days" {...form.register('turnaroundEstimate')} /></FormField>
          <FormField label="Revision limit" htmlFor="revisionLimit"><Input id="revisionLimit" type="number" min="0" max="20" {...form.register('revisionLimit')} /></FormField>
          <FormField label="Availability" htmlFor="availability">
            <Select id="availability" {...form.register('availability')}><option value="available">Available</option><option value="limited">Limited</option><option value="paused">Paused</option></Select>
          </FormField>
          <FormField label="Short description" htmlFor="shortDescription" required className="sm:col-span-2"><Input id="shortDescription" maxLength={220} {...form.register('shortDescription', { required: true })} /></FormField>
          <FormField label="Full description" htmlFor="description" required className="sm:col-span-2"><Textarea id="description" rows={4} {...form.register('description', { required: true })} /></FormField>
          <FormField label="Included (one per line)" htmlFor="included"><Textarea id="included" rows={3} {...form.register('included')} /></FormField>
          <FormField label="Excluded (one per line)" htmlFor="excluded"><Textarea id="excluded" rows={3} {...form.register('excluded')} /></FormField>
          <FormField label="Required information (one per line)" htmlFor="requirements"><Textarea id="requirements" rows={3} {...form.register('requirements')} /></FormField>
          <FormField label="Accepted formats (comma separated)" htmlFor="acceptedFormats"><Input id="acceptedFormats" placeholder="PDF, DOCX, XLSX" {...form.register('acceptedFormats')} /></FormField>
          <FormField label="Revision policy" htmlFor="revisionPolicy" className="sm:col-span-2"><Textarea id="revisionPolicy" rows={2} {...form.register('revisionPolicy')} /></FormField>
          <FormField label="Position on homepage" htmlFor="sortOrder"><Input id="sortOrder" type="number" {...form.register('sortOrder')} /></FormField>
        </form>
      </Modal>
    </div>
  );
}
