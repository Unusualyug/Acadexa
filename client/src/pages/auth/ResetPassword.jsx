import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { AuthShell } from '../../components/layout/AuthShell';
import { Button } from '../../components/ui/Button';
import { FormField, Input } from '../../components/ui/Field';
import { api, apiMessage } from '../../lib/api';

const schema = z.object({
  password: z.string().min(8, 'Use at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password: values.password });
      toast.success('Password reset. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(apiMessage(err, 'This reset link may have expired.'));
    }
  };

  if (!token) {
    return (
      <AuthShell title="Reset link missing" subtitle="This page needs a valid reset token." footer={<Link to="/forgot-password" className="font-semibold text-forest hover:underline">Request a new link</Link>}>
        <div className="rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-[13px] text-[#8a6a12]">
          Open the reset link from your email exactly as it was sent, or request a fresh one.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you haven't used before. At least 8 characters." footer={<Link to="/login" className="font-semibold text-forest hover:underline">Back to sign in</Link>}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-danger">{error}</div>}
        <FormField label="New password" htmlFor="password" required error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        </FormField>
        <FormField label="Confirm new password" htmlFor="confirm" required error={errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" {...register('confirm')} />
        </FormField>
        <Button type="submit" className="w-full" loading={isSubmitting} icon={KeyRound}>Reset password</Button>
      </form>
    </AuthShell>
  );
}
