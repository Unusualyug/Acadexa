import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Checkbox } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { apiMessage } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

const schema = z.object({
  email: z.string().email('validation.email'),
  password: z.string().min(1, 'validation.passwordRequired'),
});

const ZOD_TO_I18N = {
  'validation.email': 'validation.email',
  'validation.passwordRequired': 'validation.passwordRequired',
};

/** Remembers the last email used on this device so returning users do not retype it. */
const readLastEmail = () => {
  try { return localStorage.getItem('acadexa_last_email') || ''; } catch { return ''; }
};

export default function Login() {
  const { t } = useI18n();
  const [lastEmail] = useState(readLastEmail);
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState('');

  // Already signed in on this device? Go straight to the app instead of asking again.
  const home = ['admin', 'owner', 'consultant', 'support'].includes(user?.role) ? '/admin' : '/dashboard';
  if (!loading && user) return <Navigate to={location.state?.from || home} replace />;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: lastEmail, password: '', remember: true },
  });

  const err = (field) => {
    const raw = errors[field]?.message;
    const key = ZOD_TO_I18N[raw];
    return key ? t(key) : raw;
  };

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const user = await login({ ...values, remember: values.remember !== false });
      try { localStorage.setItem('acadexa_last_email', values.email); } catch { /* storage blocked */ }
      toast.success(t('auth.welcomeBack', { name: user.name.split(' ')[0] }));
      const staff = ['admin', 'owner', 'consultant', 'support'].includes(user.role);
      navigate(location.state?.from || (staff ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setFormError(apiMessage(err, t('common.somethingWentWrong')));
    }
  };

  return (
    <AuthShell
      title={t('auth.signInTitle')}
      subtitle={t('auth.signInSub')}
      footer={<>{t('auth.newAccount')} <Link to="/register" className="font-semibold text-forest hover:underline">{t('auth.createAccount')}</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-danger">{formError}</div>
        )}
        <FormField label={t('auth.emailAddress')} htmlFor="email" required error={err('email')}>
          <Input id="email" type="email" autoComplete="email" placeholder={t('auth.emailPlaceholder')} {...register('email')} />
        </FormField>
        <FormField label={t('auth.password')} htmlFor="password" required error={err('password')}>
          <div className="relative">
            <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder={t('auth.passwordPlaceholder')} className="pr-11" {...register('password')} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink">
              {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </FormField>
        <div className="flex items-center justify-between gap-3">
          <Checkbox label={t('auth.keepSignedIn')} {...register('remember')} />
          <Link to="/forgot-password" className="text-[12.5px] font-semibold text-forest hover:underline">{t('auth.forgotPassword')}</Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting} icon={LogIn}>{t('auth.signInButton')}</Button>
        <p className="rounded-xl bg-canvas px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted">
          Demo student account (seeded): <strong className="text-ink">student@acadexa.example</strong> / Student@12345.
          Staff and administrator accounts are issued separately.
        </p>
      </form>
    </AuthShell>
  );
}
