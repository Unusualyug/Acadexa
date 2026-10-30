import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui/Button';
import { FormField, Input, Checkbox } from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { apiMessage, apiDetails } from '../../lib/api';
import { useI18n } from '../../i18n/I18nContext';

/** Mirrors server/utils/phone.js so the UI rejects the same numbers the API rejects. */
const isValidPhone = (v) => {
  const raw = String(v || '').replace(/[\s().-]/g, '');
  if (!raw) return false;
  if (raw.startsWith('+')) return /^\+[1-9]\d{7,14}$/.test(raw);
  const local = raw.replace(/^0/, '');
  return /^[6-9]\d{9}$/.test(local) || /^\d{11,15}$/.test(raw);
};

export default function Register() {
  const { t } = useI18n();
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [show, setShow] = useState(false);
  const [formError, setFormError] = useState('');
  const [details, setDetails] = useState([]);

  const schema = z.object({
    name: z.string().min(2, 'validation.nameShort').max(120),
    email: z.string().email('validation.email'),
    phone: z.string().min(1, 'contactForm.phoneRequired').refine(isValidPhone, 'contactForm.phoneInvalid'),
    password: z.string().min(8, 'validation.passwordMin').max(128),
    confirm: z.string(),
    terms: z.literal(true, { message: 'validation.termsRequired' }),
  }).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'validation.passwordsMatch' });

  const ZOD_TO_I18N = {
    'validation.nameShort': 'validation.nameShort',
    'validation.email': 'validation.email',
    'contactForm.phoneRequired': 'contactForm.phoneRequired',
    'contactForm.phoneInvalid': 'contactForm.phoneInvalid',
    'validation.passwordMin': 'validation.passwordMin',
    'validation.passwordsMatch': 'validation.passwordsMatch',
    'validation.termsRequired': 'validation.termsRequired',
  };

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });

  const err = (field) => {
    const raw = errors[field]?.message || details.find((d) => d.path === field)?.message;
    const key = ZOD_TO_I18N[raw];
    return key ? t(key) : raw;
  };

  const pwd = watch('password') || '';
  const strength = (p) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const score = strength(pwd);

  const onSubmit = async (values) => {
    setFormError('');
    setDetails([]);
    try {
      const { confirm, terms, ...payload } = values;
      await signUp(payload);
      toast.success(t('auth.createAccountSuccess'));
      navigate(params.get('next') || '/dashboard', { replace: true });
    } catch (err) {
      setFormError(apiMessage(err, t('common.somethingWentWrong')));
      setDetails(apiDetails(err));
    }
  };

  return (
    <AuthShell
      title={t('auth.createAccountTitle')}
      subtitle={t('auth.createAccountSub')}
      footer={<>{t('auth.alreadyHaveAccount')} <Link to="/login" className="font-semibold text-forest hover:underline">{t('auth.signInLink')}</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-danger">{formError}</div>}
        <FormField label={t('auth.fullName')} htmlFor="name" required error={err('name')}>
          <Input id="name" autoComplete="name" placeholder={t('auth.namePlaceholder')} {...register('name')} />
        </FormField>
        <FormField label={t('auth.emailAddress')} htmlFor="email" required error={err('email')} hint={t('auth.nameHint')}>
          <Input id="email" type="email" autoComplete="email" placeholder={t('auth.emailPlaceholder')} {...register('email')} />
        </FormField>
        <FormField
          label={t('auth.mobileNumber')}
          htmlFor="phone"
          required
          error={err('phone')}
          hint={t('auth.phoneHint')}
        >
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('auth.phonePlaceholder')}
            {...register('phone')}
          />
        </FormField>
        <FormField label={t('auth.password')} htmlFor="password" required error={err('password')}>
          <div className="relative">
            <Input id="password" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder={t('auth.passwordPlaceholder')} className="pr-11" {...register('password')} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink">
              {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
          {pwd && (
            <div className="mt-2 flex items-center gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i < score ? (score <= 2 ? 'bg-amber' : 'bg-emerald') : 'bg-line'}`} />
              ))}
              <span className="ml-1 text-[10.5px] font-medium text-muted">{t('auth.passwordStrength')[score]}</span>
            </div>
          )}
        </FormField>
        <FormField label={t('auth.confirmPassword')} htmlFor="confirm" required error={err('confirm')}>
          <Input id="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" placeholder={t('auth.confirmPlaceholder')} {...register('confirm')} />
        </FormField>
        <Checkbox label={<>{t('auth.termsAgree')}</>} {...register('terms')} />
        {err('terms') && <p className="text-[12px] font-medium text-danger">{err('terms')}</p>}
        <Button type="submit" className="w-full" loading={isSubmitting} icon={UserPlus}>{t('auth.createAccountButton')}</Button>
        <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald" aria-hidden />
          {t('auth.dataNote')}
        </p>
      </form>
    </AuthShell>
  );
}
