'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api/client';
import type { ChangePasswordResponse } from '@/lib/api/types';
import { passwordSchema } from '@/lib/auth/password';
import { homePathFor, storeRefreshToken, useSession } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FormError } from '@/components/form-error';
import { PasswordInput } from '@/components/password-input';

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });

type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { status, user, setAccessToken, patchUser } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema),
    // Same reasoning as the login form: nothing is flagged until the user
    // actually submits, after which each field clears as it is fixed. On blur,
    // simply tabbing past an empty field accused them of a mistake they had
    // not made yet.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    // Reaching this screen without the flag means it is already done.
    else if (status === 'authenticated' && user && !user.mustChangePassword) {
      router.replace(homePathFor(user.role));
    }
  }, [status, user, router]);

  async function onSubmit(values: ChangePasswordValues) {
    setFormError(null);
    try {
      // The API revokes every refresh token on success and hands back a fresh
      // pair, so these must replace what we hold or the next call is a 401.
      const result = await api<ChangePasswordResponse>(
        '/auth/change-password',
        {
          method: 'PATCH',
          body: {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          },
        },
      );

      storeRefreshToken(result.refreshToken);
      setAccessToken(result.accessToken);
      patchUser({ mustChangePassword: false });

      if (user) router.replace(homePathFor(user.role));
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    }
  }

  if (status === 'loading' || !user) {
    return <div className="h-72 animate-pulse rounded-xl bg-muted/50" />;
  }

  return (
    <Card className="px-6 py-7">
      <div className="space-y-1.5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Đổi mật khẩu
        </h1>
        {/* Unlike the login screen, this line earns its place: it is the only
            thing explaining why the user cannot go anywhere else. */}
        <p className="text-sm text-muted-foreground">
          Tài khoản đang dùng mật khẩu tạm. Đặt mật khẩu mới để tiếp tục.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={formError} />

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Mật khẩu tạm</Label>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            autoFocus
            aria-invalid={!!errors.currentPassword}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.newPassword}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Cập nhật mật khẩu
        </Button>
      </form>
    </Card>
  );
}
