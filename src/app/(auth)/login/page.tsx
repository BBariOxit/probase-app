'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api/client';
import type { LoginResponse } from '@/lib/api/types';
import { homePathFor, useSession } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/form-error';
import { PasswordInput } from '@/components/password-input';

const LoginSchema = z.object({
  // Empty and malformed are different mistakes and deserve different words —
  // z.email() alone calls a blank field "không hợp lệ", which reads as an
  // accusation about something the user has not typed yet.
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .pipe(z.email('Email không hợp lệ')),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { status, user, signIn } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    // Nothing is flagged until the user actually tries to sign in; after that
    // each field clears as it is fixed. Validating on blur meant tabbing
    // through an empty form lit it up red before any attempt was made.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Someone already signed in has no business on this screen.
  useEffect(() => {
    if (status === 'authenticated' && user) {
      router.replace(
        user.mustChangePassword ? '/change-password' : homePathFor(user.role),
      );
    }
  }, [status, user, router]);

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const result = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: values,
        anonymous: true,
      });

      signIn(result, result.user);
      router.replace(
        result.user.mustChangePassword
          ? '/change-password'
          : homePathFor(result.user.role),
      );
    } catch (err) {
      // The API answers a wrong address and a wrong password identically, on
      // purpose. Being more helpful here would confirm which emails exist.
      setFormError(
        err instanceof ApiError && err.status === 401
          ? 'Email hoặc mật khẩu không đúng'
          : err instanceof ApiError
            ? err.message
            : 'Không kết nối được máy chủ',
      );
    }
  }

  return (
    <Card className="px-6 py-7">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        Đăng nhập
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={formError} />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            placeholder="sinhvien@probase.dev"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            {/* Colour alone carries the hover state: an underline would be a
                second signal for the same change, and at this size it sits
                heavily against the label's baseline. The focus ring is what
                actually helps keyboard users, which hover never did. */}
            <Link
              href="/forgot-password"
              className="rounded-sm text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Đăng nhập
        </Button>
      </form>
    </Card>
  );
}
