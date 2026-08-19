'use client';

import { useState } from 'react';
import { FileUp, Loader2, TriangleAlert } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { useBulkImportUsers } from '@/lib/api/users';
import type { BulkImportResult } from '@/lib/api/types';
import { FormError } from '@/components/form-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * A roster, uploaded.
 *
 * The result matters more than the upload, so most of this component is about
 * reading it. One bad row never fails the batch — three hundred lines with two
 * typos should create two hundred and ninety-eight accounts — which means the
 * office needs to see exactly which rows did not make it and why, and cannot be
 * handed a single "import failed".
 */
export function UserImportDialog() {
  const importUsers = useBulkImportUsers();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (importUsers.isPending) return;
    setOpen(false);
    setFile(null);
    setResult(null);
    setError(null);
  }

  async function submit() {
    if (!file) return;

    setError(null);
    try {
      setResult(await importUsers.mutateAsync(file));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Không tải được file lên',
      );
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileUp />
        Nhập từ file
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : close())}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nhập danh sách tài khoản</DialogTitle>
            <DialogDescription>
              File .xlsx hoặc .csv, tối đa 5MB. Mỗi tài khoản được tạo với mật
              khẩu tạm và gửi qua email.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <ImportSummary result={result} />
          ) : (
            <div className="space-y-4">
              <FormError message={error} />

              <div className="space-y-2">
                <Label htmlFor="roster">File danh sách</Label>
                <Input
                  id="roster"
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </div>

              <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Dòng nào sai sẽ bị bỏ qua và báo lại riêng — một dòng hỏng không
                làm hỏng cả file. Mã chuyên ngành trong file phải khớp với danh
                mục Chuyên ngành.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={importUsers.isPending}
              onClick={close}
            >
              {result ? 'Đóng' : 'Huỷ'}
            </Button>
            {!result && (
              <Button
                disabled={!file || importUsers.isPending}
                onClick={submit}
              >
                {importUsers.isPending && <Loader2 className="animate-spin" />}
                Tải lên
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * What came of it, with the one genuinely dangerous outcome first.
 *
 * An account whose credentials email failed exists but cannot be signed in to,
 * and the temporary password is not recoverable — so it needs the office to
 * reset it by hand. That is the only line here that is a task rather than a
 * number, and burying it under the totals is how it gets missed.
 */
function ImportSummary({ result }: { result: BulkImportResult }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span>
          <strong className="tabular-nums">{result.createdCount}</strong> tài
          khoản đã tạo
        </span>
        {result.failedCount > 0 && (
          <span className="text-destructive">
            <strong className="tabular-nums">{result.failedCount}</strong> dòng
            lỗi
          </span>
        )}
        {result.warnedCount > 0 && (
          <span className="text-status-waiting">
            <strong className="tabular-nums">{result.warnedCount}</strong> dòng
            cần xem lại
          </span>
        )}
      </div>

      {result.emailsFailedCount > 0 && (
        <p className="flex items-start gap-2.5 rounded-lg border border-status-danger/30 bg-status-danger-bg/40 px-3 py-2.5 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-danger" />
          <span>
            {result.emailsFailedCount} tài khoản đã tạo nhưng email mật khẩu
            không gửi được. Mật khẩu tạm không lấy lại được — phải bấm
            &ldquo;Cấp lại mật khẩu&rdquo; cho từng tài khoản đó.
          </span>
        </p>
      )}

      {result.failed.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-xs font-medium text-muted-foreground">
            Dòng không nhập được
          </h3>
          <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border text-sm">
            {result.failed.map((row) => (
              <li key={row.row} className="px-3 py-2">
                <span className="text-muted-foreground tabular-nums">
                  Dòng {row.row}
                </span>
                {row.email && <span className="ml-2">{row.email}</span>}
                <p className="text-xs text-destructive">{row.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.warnedCount > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-xs font-medium text-muted-foreground">
            Đã nhập nhưng nên kiểm tra
          </h3>
          <ul className="max-h-40 divide-y overflow-y-auto rounded-lg border text-sm">
            {result.created
              .filter((row) => row.warnings?.length)
              .map((row) => (
                <li key={row.row} className="px-3 py-2">
                  <span className="text-muted-foreground tabular-nums">
                    Dòng {row.row}
                  </span>
                  {row.email && <span className="ml-2">{row.email}</span>}
                  <p className="text-xs text-status-waiting">
                    {row.warnings?.join(' · ')}
                  </p>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
