import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Users, UserPlus, Briefcase, ShieldCheck } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { FormField, Input, Select } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { initials, formatDate } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export default function AdminTeam() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm({ defaultValues: { role: 'consultant' } });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'staff'],
    queryFn: async () => (await api.get('/admin/staff')).data.staff,
    enabled: ['admin', 'owner'].includes(user?.role),
  });

  const create = async (values) => {
    try {
      await api.post('/admin/staff', values);
      toast.success('Team member created');
      setOpen(false);
      form.reset({ role: 'consultant' });
      qc.invalidateQueries({ queryKey: ['admin', 'staff'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  if (!['admin', 'owner'].includes(user?.role)) return <EmptyState title="Restricted" description="Team management requires administrator permissions." actionLabel="Back" actionTo="/admin" />;

  return (
    <div>
      <PageHeader title="Team & workload" description="Consultants only see orders assigned to them. Roles and permissions are enforced on the backend." action={<Button onClick={() => setOpen(true)} icon={UserPlus}>Add team member</Button>} />

      {isLoading ? <SkeletonRows count={4} /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {data?.map((s) => (
            <Card key={s._id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest text-[12px] font-bold text-white">{initials(s.name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-ink">{s.name}</p>
                    <Badge tone={s.role === 'owner' ? 'forest' : s.role === 'admin' ? 'info' : 'neutral'}>{s.role}</Badge>
                    <Badge tone={s.accountStatus === 'active' ? 'success' : 'danger'}>{s.accountStatus}</Badge>
                  </div>
                  <p className="truncate text-[11.5px] text-muted">{s.email} · joined {formatDate(s.createdAt)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Briefcase className="size-3.5 text-forest" aria-hidden />
                    <span className="text-[11.5px] text-muted">Active assignments: <strong className="text-ink">{s.activeAssignments}</strong></span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-4 bg-mint/50">
        <div className="flex items-start gap-2.5 p-5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
          <p className="text-[12px] leading-relaxed text-forest/90">
            <strong className="text-forest">Access model:</strong> owner and admin see all records; support staff see tickets and order context; consultants see only assigned orders. Every protected API call re-checks role and ownership — interface-level hiding is never treated as security. Team members must treat student documents as confidential.
          </p>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add team member"
        description="They can sign in immediately with the password you set."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={form.formState.isSubmitting} onClick={form.handleSubmit(create)}>Create account</Button></>}
      >
        <form onSubmit={form.handleSubmit(create)} className="space-y-4">
          <FormField label="Full name" htmlFor="staff-name" required><Input id="staff-name" {...form.register('name', { required: true, minLength: 2 })} /></FormField>
          <FormField label="Email address" htmlFor="staff-email" required><Input id="staff-email" type="email" {...form.register('email', { required: true })} /></FormField>
          <FormField label="Role" htmlFor="staff-role" required>
            <Select id="staff-role" {...form.register('role')}>
              <option value="consultant">Consultant — assigned orders only</option>
              <option value="support">Support staff — tickets and order context</option>
              {user?.role === 'owner' && <option value="admin">Administrator — full operational access</option>}
            </Select>
          </FormField>
          <FormField label="Temporary password" htmlFor="staff-password" required hint="At least 8 characters">
            <Input id="staff-password" type="text" {...form.register('password', { required: true, minLength: 8 })} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
