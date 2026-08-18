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

/**
 * Two arrivals, one form.
 *
 * The screen was built for the forced change — an admin-created account holding
 * a temporary password — and it kicked out anybody without that flag, which was
 * right while the only way here was being sent. It is now also the destination
 * of "Đổi mật khẩu" in the account menu, so a person who simply wants a new
 * password was bounced back to their landing page a frame after arriving.
 *
 * What differs between the two is a label, a sentence and where you go
 * afterwards. What must not differ is the form.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { status, user, setAccessToken, patchUser } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const forced = user?.mustChangePassword ?? false;

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
  }, [status, router]);

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

      // Forced: onward to where they were trying to go in the first place.
      // Voluntary: back to the page whose button sent them here.
      if (user) router.replace(forced ? homePathFor(user.role) : '/ca-nhan');
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
        {/* Only in the forced case, where it is the one thing explaining why
            they cannot go anywhere else. Somebody who chose this screen from a
            menu already knows what it is for. */}
        {forced && (
          <p className="text-sm text-muted-foreground">
            Tài khoản đang dùng mật khẩu tạm. Đặt mật khẩu mới để tiếp tục.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={formError} />

        <div className="space-y-2">
          <Label htmlFor="currentPassword">
            {forced ? 'Mật khẩu tạm' : 'Mật khẩu hiện tại'}
          </Label>
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

        {/* A way out, for the arrival that has one. The forced flow gets no
            cancel button because there is nowhere else to go. */}
        <div className="flex gap-2">
          {!forced && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.replace('/ca-nhan')}
            >
              Huỷ
            </Button>
          )}
          <Button
            type="submit"
            className={forced ? 'w-full' : 'flex-1'}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
    </Card>
  );
}
