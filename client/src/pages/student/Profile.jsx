import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { UserRound, KeyRound, Bell, ShieldAlert, LogOut, CheckCircle2, BadgeCheck } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Textarea, Select } from '../../components/ui/Field';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../lib/utils';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [actionBusy, setActionBusy] = useState('');

  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.profile?.phone || '',
      institution: user?.profile?.institution || '',
      course: user?.profile?.course || '',
      city: user?.profile?.city || '',
      bio: user?.profile?.bio || '',
    },
  });
  const passwordForm = useForm();
  const prefs = user?.notificationPrefs || {};

  const saveProfile = async (values) => {
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/profile', {
        name: values.name,
        profile: { phone: values.phone, institution: values.institution, course: values.course, city: values.city, bio: values.bio },
      });
      setUser(data.user);
      toast.success('Profile updated');
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (values) => {
    try {
      await api.patch('/auth/password', { currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password updated');
      passwordForm.reset();
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  const togglePref = async (key) => {
    setSavingPrefs(true);
    try {
      const { data } = await api.patch('/auth/profile', { notificationPrefs: { [key]: !prefs[key] } });
      setUser(data.user);
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setSavingPrefs(false);
    }
  };

  const accountAction = async (action) => {
    const message = action === 'delete'
      ? 'Request account deletion? Your personal data will be removed subject to statutory retention. This signs you out.'
      : 'Deactivate your account? You will be signed out and can ask support to restore it.';
    if (!window.confirm(message)) return;
    setActionBusy(action);
    try {
      await api.post('/auth/account-request', { action });
      toast.success(action === 'delete' ? 'Deletion request received' : 'Account deactivated');
      await logout();
      window.location.href = '/';
    } catch (e) {
      toast.error(apiMessage(e));
    } finally {
      setActionBusy('');
    }
  };

  return (
    <div>
      <PageHeader title="Profile & settings" description="Keep your details current and control what we send you." action={<Button variant="secondary" onClick={logout} icon={LogOut}>Sign out</Button>} />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Personal details" description="Only your name and email are required" icon={UserRound} action={<Badge tone={user?.emailVerified ? 'success' : 'warn'}>{user?.emailVerified ? 'Verified' : 'Unverified'}</Badge>} />
            <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full name" htmlFor="name" required>
                  <Input id="name" {...profileForm.register('name', { required: true, minLength: 2 })} />
                </FormField>
                <FormField label="Email address" htmlFor="email" hint="Contact support to change">
                  <Input id="email" value={user?.email || ''} disabled />
                </FormField>
                <FormField
                  label="Mobile number"
                  htmlFor="phone"
                  required
                  hint="Used to call you about an active order. Visible to you and Acadexa staff only."
                  error={profileForm.formState.errors.phone ? 'Enter a valid mobile number' : ''}
                >
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    {...profileForm.register('phone', {
                      required: 'A mobile number is required',
                      validate: (v) => {
                        const raw = String(v || '').replace(/[\s().-]/g, '');
                        if (raw.startsWith('+')) return /^\+[1-9]\d{7,14}$/.test(raw) || 'Enter a valid mobile number';
                        const local = raw.replace(/^0/, '');
                        return /^[6-9]\d{9}$/.test(local) || /^\d{11,15}$/.test(raw) || 'Enter a valid mobile number';
                      },
                    })}
                  />
                </FormField>
                <FormField label="City" htmlFor="city">
                  <Input id="city" {...profileForm.register('city')} />
                </FormField>
                <FormField label="Institution" htmlFor="institution">
                  <Input id="institution" {...profileForm.register('institution')} />
                </FormField>
                <FormField label="Course / programme" htmlFor="course">
                  <Input id="course" {...profileForm.register('course')} />
                </FormField>
              </div>
              <FormField label="About you" htmlFor="bio" hint="Optional — helps us tailor guidance">
                <Textarea id="bio" rows={3} {...profileForm.register('bio')} />
              </FormField>
              <div className="flex items-center justify-between border-t border-line pt-4">
                <p className="text-[11.5px] text-muted">Account created {formatDate(user?.createdAt)}</p>
                <Button type="submit" loading={savingProfile}>Save changes</Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader title="Change password" description="Sensitive changes require your current password" icon={KeyRound} />
            <form onSubmit={passwordForm.handleSubmit(changePassword)} className="grid gap-4 p-5 sm:grid-cols-2">
              <FormField label="Current password" htmlFor="currentPassword" required>
                <Input id="currentPassword" type="password" autoComplete="current-password" {...passwordForm.register('currentPassword', { required: true })} />
              </FormField>
              <FormField label="New password" htmlFor="newPassword" required hint="At least 8 characters">
                <Input id="newPassword" type="password" autoComplete="new-password" {...passwordForm.register('newPassword', { required: true, minLength: { value: 8, message: 'Use at least 8 characters' } })} />
              </FormField>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" variant="secondary" icon={KeyRound}>Update password</Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Notification preferences" description="You can change these at any time" icon={Bell} />
            <div className="divide-y divide-line">
              {[
                ['emailQuotation', 'Quotation and pricing emails'],
                ['emailDelivery', 'Delivery and revision emails'],
                ['emailSupport', 'Support reply emails'],
                ['emailSecurity', 'Security and account emails'],
                ['inApp', 'In-app notifications'],
              ].map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3">
                  <span className="text-[12.5px] text-ink">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(prefs[key])}
                    onChange={() => togglePref(key)}
                    disabled={savingPrefs}
                    className="size-4 accent-forest"
                    aria-label={label}
                  />
                </label>
              ))}
            </div>
            <p className="px-5 py-3 text-[11px] leading-relaxed text-muted">Security notices (password changes, payment verification) are always sent.</p>
          </Card>

          <Card>
            <CardHeader title="Privacy & data" icon={BadgeCheck} />
            <div className="space-y-2 p-5">
              <Link to="/dashboard/privacy" className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[12.5px] font-semibold text-ink hover:border-emerald/40 hover:bg-mint">
                Privacy Center <CheckCircle2 className="size-4 text-emerald" aria-hidden />
              </Link>
              <Link to="/privacy-policy" className="block rounded-lg border border-line px-3 py-2.5 text-[12.5px] font-semibold text-ink hover:border-emerald/40 hover:bg-mint">Privacy Policy</Link>
              <Link to="/terms-of-service" className="block rounded-lg border border-line px-3 py-2.5 text-[12.5px] font-semibold text-ink hover:border-emerald/40 hover:bg-mint">Terms of Service</Link>
              <Link to="/academic-integrity-policy" className="block rounded-lg border border-line px-3 py-2.5 text-[12.5px] font-semibold text-ink hover:border-emerald/40 hover:bg-mint">Academic Integrity Policy</Link>
            </div>
          </Card>

          <Card className="border-red-200">
            <CardHeader title="Account actions" description="These actions affect access to your account" icon={ShieldAlert} />
            <div className="space-y-2 p-5">
              <Button variant="secondary" className="w-full justify-start" loading={actionBusy === 'deactivate'} onClick={() => accountAction('deactivate')}>Deactivate account</Button>
              <Button variant="danger" className="w-full justify-start" loading={actionBusy === 'delete'} onClick={() => accountAction('delete')}>Request account deletion</Button>
              <p className="text-[11px] leading-relaxed text-muted">Deletion removes personal data subject to legal retention of payment records. Open orders must be closed first.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
