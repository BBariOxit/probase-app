'use client';

import { useState } from 'react';
import {
  IdCard,
  KeyRound,
  Loader2,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  UserCog,
  Users,
} from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { useMajors } from '@/lib/api/majors';
import {
  useCreateUser,
  useDeactivateUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
  type CreateUserInput,
} from '@/lib/api/users';
import type { Role, UserAccount } from '@/lib/api/types';
import { useRequireRole } from '@/lib/auth/use-require-role';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FormError } from '@/components/form-error';
import { StatusPill } from '@/components/status-pill';
import { UserImportDialog } from '@/components/user-import-dialog';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationBar } from '@/components/pagination-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 20;

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Quản trị',
  LECTURER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

const ROLE_FILTERS = [
  { value: 'ALL', label: 'Mọi vai trò' },
  { value: 'STUDENT', label: 'Sinh viên' },
  { value: 'LECTURER', label: 'Giảng viên' },
  { value: 'ADMIN', label: 'Quản trị' },
];

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Mọi trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Đã khoá' },
];

function nameOf(user: UserAccount): string {
  return (
    user.studentProfile?.fullName ??
    user.lecturerProfile?.fullName ??
    user.email
  );
}

function codeOf(user: UserAccount): string | null {
  return (
    user.studentProfile?.studentCode ??
    user.lecturerProfile?.lecturerCode ??
    null
  );
}

export default function AccountsPage() {
  const allowed = useRequireRole('ADMIN');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const debouncedSearch = useDebouncedValue(search);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserAccount | null>(
    null,
  );
  const [locking, setLocking] = useState<UserAccount | null>(null);
  const [resetting, setResetting] = useState<UserAccount | null>(null);

  const { data, isPending, error } = useUsers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: role === 'ALL' ? undefined : (role as Role),
    isActive: status === 'ALL' ? undefined : status === 'true',
  });

  const lock = useDeactivateUser();
  const reset = useResetUserPassword();

  if (!allowed) return null;

  const users = data?.data ?? [];
  const filtering =
    debouncedSearch !== '' || role !== 'ALL' || status !== 'ALL';

  function refilter(apply: () => void) {
    apply();
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => refilter(() => setSearch(event.target.value))}
            placeholder="Tìm theo tên hoặc email…"
            className="pl-8"
            aria-label="Tìm tài khoản"
          />
        </div>

        <Select
          value={role}
          onValueChange={(value) => refilter(() => setRole(value as string))}
        >
          <SelectTrigger className="w-40" aria-label="Lọc theo vai trò">
            <SelectValue>
              {(value) =>
                ROLE_FILTERS.find((option) => option.value === value)?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => refilter(() => setStatus(value as string))}
        >
          <SelectTrigger className="w-44" aria-label="Lọc theo trạng thái">
            <SelectValue>
              {(value) =>
                STATUS_FILTERS.find((option) => option.value === value)?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {data && (
            <span className="text-sm text-muted-foreground">
              {data.meta.total} tài khoản
            </span>
          )}
          <UserImportDialog />
          <Button onClick={() => setCreating(true)}>
            <Plus />
            Thêm tài khoản
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          Không tải được danh sách tài khoản.
        </p>
      )}

      {(lock.error ?? reset.error) && (
        <p className="text-sm text-destructive">
          {(lock.error ?? reset.error)?.message}
        </p>
      )}

      {reset.isSuccess && (
        <p className="rounded-xl border border-status-success/30 bg-status-success-bg/40 px-4 py-3 text-sm">
          Đã gửi mật khẩu mới qua email.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-56">Người dùng</TableHead>
                <TableHead className="w-32">Mã</TableHead>
                <TableHead className="w-32">Vai trò</TableHead>
                <TableHead className="w-36">Trạng thái</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {nameOf(user)}
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {codeOf(user) ?? '—'}
                    {user.studentProfile?.class && (
                      <span className="mt-0.5 block text-xs">
                        {user.studentProfile.class}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ROLE_LABEL[user.role]}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <StatusPill label="Hoạt động" tone="success" />
                    ) : (
                      <StatusPill label="Đã khoá" tone="idle" />
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hành động cho ${nameOf(user)}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(user)}>
                          <UserCog />
                          Sửa tài khoản
                        </DropdownMenuItem>
                        {user.role !== 'ADMIN' && (
                          <DropdownMenuItem
                            onClick={() => setEditingProfile(user)}
                          >
                            <IdCard />
                            Sửa hồ sơ
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setResetting(user)}>
                          <KeyRound />
                          Cấp lại mật khẩu
                        </DropdownMenuItem>
                        {user.isActive && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setLocking(user)}
                          >
                            <Lock />
                            Khoá tài khoản
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {isPending && (
          <div className="flex justify-center py-14">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && users.length === 0 && (
          <EmptyState
            icon={Users}
            title={
              filtering
                ? 'Không có tài khoản nào khớp bộ lọc.'
                : 'Chưa có tài khoản nào ngoài tài khoản của bạn.'
            }
          />
        )}
      </div>

      {data && (
        <PaginationBar
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      {creating && <CreateUserDialog onClose={() => setCreating(false)} />}
      {editingProfile && (
        <UserProfileDialog
          user={editingProfile}
          onClose={() => setEditingProfile(null)}
        />
      )}
      {editing && (
        <EditUserDialog user={editing} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={locking !== null}
        onOpenChange={(open) => !open && setLocking(null)}
        title="Khoá tài khoản?"
        description={`${locking?.email} sẽ không đăng nhập được nữa và mọi phiên đang mở bị ngắt ngay. Dữ liệu giữ nguyên — mở lại bất cứ lúc nào trong "Sửa tài khoản".`}
        confirmLabel="Khoá tài khoản"
        onConfirm={() => lock.mutateAsync(locking!.id)}
      />

      <ConfirmDialog
        open={resetting !== null}
        onOpenChange={(open) => !open && setResetting(null)}
        title="Cấp lại mật khẩu?"
        description={`Hệ thống sẽ tạo mật khẩu tạm mới cho ${resetting?.email} và gửi qua email. Mật khẩu cũ ngừng hoạt động ngay.`}
        confirmLabel="Cấp lại"
        onConfirm={() => reset.mutateAsync(resetting!.id)}
      />
    </div>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateUser();
  const { data: majors } = useMajors();

  const [role, setRole] = useState<Role>('STUDENT');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [className, setClassName] = useState('');
  const [majorId, setMajorId] = useState<number | null>(null);
  const [academicTitle, setAcademicTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const needsProfile = role !== 'ADMIN';
  const ready =
    email.trim() !== '' &&
    (!needsProfile || (fullName.trim() !== '' && code.trim() !== ''));

  async function submit() {
    setError(null);
    try {
      const input: CreateUserInput =
        role === 'STUDENT'
          ? {
              role: 'STUDENT',
              email: email.trim(),
              studentCode: code.trim(),
              fullName: fullName.trim(),
              ...(className.trim() && { class: className.trim() }),
              ...(majorId !== null && { majorId }),
            }
          : role === 'LECTURER'
            ? {
                role: 'LECTURER',
                email: email.trim(),
                lecturerCode: code.trim(),
                fullName: fullName.trim(),
                ...(academicTitle.trim() && {
                  academicTitle: academicTitle.trim(),
                }),
              }
            : { role: 'ADMIN', email: email.trim() };

      await create.mutateAsync(input);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => !next && !create.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm tài khoản</DialogTitle>
          <DialogDescription>
            Mật khẩu tạm sẽ được gửi tới email này. Người dùng phải đổi mật khẩu
            ở lần đăng nhập đầu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormError message={error} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-role">Vai trò</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as Role)}
              >
                <SelectTrigger id="new-role" className="w-full">
                  <SelectValue>
                    {(value) => ROLE_LABEL[value as Role]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Sinh viên</SelectItem>
                  <SelectItem value="LECTURER">Giảng viên</SelectItem>
                  <SelectItem value="ADMIN">Quản trị</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                autoFocus
                placeholder={
                  role === 'STUDENT' ? '2212345@dlu.edu.vn' : 'gv001@dlu.edu.vn'
                }
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          {needsProfile && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Họ và tên</Label>
                  <Input
                    id="new-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-code">
                    {role === 'STUDENT' ? 'Mã sinh viên' : 'Mã giảng viên'}
                  </Label>
                  {role === 'STUDENT' && (
                    <p className="-mt-1 text-xs text-muted-foreground">
                      Bảy chữ số, và phải trùng phần đầu của email — hai số đầu
                      là khóa.
                    </p>
                  )}
                  <Input
                    id="new-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                  />
                </div>
              </div>

              {role === 'STUDENT' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-class">Lớp</Label>
                    <Input
                      id="new-class"
                      placeholder="CTK46"
                      value={className}
                      onChange={(event) => setClassName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-major">Chuyên ngành</Label>
                    <Select
                      value={majorId}
                      onValueChange={(value) => setMajorId(value as number)}
                    >
                      <SelectTrigger id="new-major" className="w-full">
                        <SelectValue>
                          {(value) =>
                            majors?.find((major) => major.id === value)?.name ??
                            'Chưa chọn'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {majors?.map((major) => (
                          <SelectItem key={major.id} value={major.id}>
                            {major.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="new-title">Học hàm, học vị</Label>
                  <Input
                    id="new-title"
                    className="w-40"
                    placeholder="TS."
                    value={academicTitle}
                    onChange={(event) => setAcademicTitle(event.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={create.isPending}
            onClick={onClose}
          >
            Huỷ
          </Button>
          <Button disabled={!ready || create.isPending} onClick={submit}>
            {create.isPending && <Loader2 className="animate-spin" />}
            Tạo tài khoản
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onClose,
}: {
  user: UserAccount;
  onClose: () => void;
}) {
  const update = useUpdateUser();
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      await update.mutateAsync({
        id: user.id,
        ...(email.trim() !== user.email && { email: email.trim() }),
        ...(role !== user.role && { role }),
        ...(isActive !== user.isActive && { isActive }),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không kết nối được máy chủ',
      );
    }
  }

  const changed =
    email.trim() !== user.email ||
    role !== user.role ||
    isActive !== user.isActive;

  return (
    <Dialog
      open
      onOpenChange={(next) => !next && !update.isPending && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa tài khoản</DialogTitle>
          <DialogDescription>{nameOf(user)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormError message={error} />

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Vai trò</Label>
            <p className="-mt-1 text-xs text-muted-foreground">
              Đổi vai trò không tạo hồ sơ mới — tài khoản sẽ không có hồ sơ của
              vai trò vừa đổi sang.
            </p>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as Role)}
            >
              <SelectTrigger id="edit-role" className="w-full">
                <SelectValue>
                  {(value) => ROLE_LABEL[value as Role]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Sinh viên</SelectItem>
                <SelectItem value="LECTURER">Giảng viên</SelectItem>
                <SelectItem value="ADMIN">Quản trị</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span>
              Cho phép đăng nhập
              <span className="block text-xs text-muted-foreground">
                Khoá tài khoản giữ lại toàn bộ dữ liệu, chỉ chặn đăng nhập — đây
                là cách nên dùng thay cho xoá.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={update.isPending}
            onClick={onClose}
          >
            Huỷ
          </Button>
          <Button disabled={!changed || update.isPending} onClick={submit}>
            {update.isPending && <Loader2 className="animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
