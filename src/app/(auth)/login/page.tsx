'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api/client';
import type { LoginResponse } from '@/lib/api/types';
import { homePathFor, useSession } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/form-error';
import { PasswordInput } from '@/components/password-input';

const LoginSchema = z.object({
  email: z.email('Email không hợp lệ'),
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
    // Validating as the user types turns a half-typed address into an error;
    // wait until they leave the field.
    mode: 'onBlur',
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
    <div className="space-y-7">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Đăng nhập
        </h1>
        <p className="text-sm text-muted-foreground">
          Dùng tài khoản do khoa cấp.
        </p>
      </div>

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
          <Label htmlFor="password">Mật khẩu</Label>
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
    </div>
  );
}
