import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck, Send } from 'lucide-react';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/Field';
import { api, apiMessage } from '../../lib/api';

const schema = z.object({ email: z.string().email('Enter a valid email address') });

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setError('');
    try {
      await api.post('/auth/forgot-password', values);
      setSent(true);
    } catch (err) {
      setError(apiMessage(err));
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you registered with and we'll send a secure reset link, valid for 45 minutes."
      footer={<Link to="/login" className="font-semibold text-forest hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald/25 bg-mint p-5 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-forest"><MailCheck className="size-6" aria-hidden /></span>
          <h2 className="mt-3 text-[15px] font-semibold text-forest">Check your inbox</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-forest/80">
            If an account exists for that address, a reset link is on its way. The link expires in 45 minutes. If you don't see it, check spam or contact support.
          </p>
          <Button variant="secondary" className="mt-4" to="/login">Return to sign in</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-danger">{error}</div>}
          <FormField label="Email address" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" placeholder="you@college.edu" {...register('email')} />
          </FormField>
          <Button type="submit" className="w-full" loading={isSubmitting} icon={Send}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
