'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useServerTable, type SortOrder } from '@/hooks/use-server-table';
import { DataTable, type Column } from '@/components/data-table/data-table';
import { FormDialog, type FieldDef, type FormValues } from '@/components/form/form-dialog';

interface Props<T extends { id: string }> {
  title: string;
  endpoint: string;
  queryKey: unknown[];
  columns: Column<T>[];
  /** When provided, enables Create/Edit via a dialog. */
  fields?: FieldDef[];
  initialSortBy?: string;
  initialSortOrder?: SortOrder;
  filters?: Record<string, string | undefined>;
  toolbar?: ReactNode;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Map a row into editable string form values. */
  toFormValues?: (row: T) => FormValues;
}

/** A complete CRUD resource: paginated table + create/edit dialog + delete. */
export function ResourceManager<T extends { id: string }>(props: Props<T>) {
  const { title, endpoint, queryKey, columns, fields, initialSortBy, initialSortOrder, filters, toolbar } = props;
  const tc = useTranslations('common');
  const table = useServerTable<T>({ endpoint, queryKey, initialSortBy, initialSortOrder, filters });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate = props.canCreate !== false && !!fields;
  const canEdit = props.canEdit !== false && !!fields;
  const canDelete = props.canDelete === true;

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? api.patch(`${endpoint}/${editing.id}`, values) : api.post(endpoint, values),
    onSuccess: () => { setOpen(false); setEditing(null); setError(null); table.refresh(); },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => table.refresh(),
  });

  const defaultToValues = (row: T): FormValues => {
    const out: FormValues = {};
    for (const f of fields ?? []) {
      const v = (row as Record<string, unknown>)[f.name];
      out[f.name] = v == null ? '' : f.type === 'date' && typeof v === 'string' ? v.slice(0, 10) : String(v);
    }
    return out;
  };

  const actionCol: Column<T> | null = (canEdit || canDelete)
    ? {
        key: '__actions',
        header: tc('actions'),
        className: 'text-right',
        render: (row) => (
          <div className="flex justify-end gap-2">
            {canEdit && (
              <button onClick={() => { setEditing(row); setError(null); setOpen(true); }} className="text-xs font-medium text-primary hover:underline">{tc('edit')}</button>
            )}
            {canDelete && (
              <button
                onClick={() => { if (confirm(tc('confirmDelete'))) remove.mutate(row.id); }}
                className="text-xs font-medium text-destructive hover:underline"
              >{tc('delete')}</button>
            )}
          </div>
        ),
      }
    : null;

  const allColumns = actionCol ? [...columns, actionCol] : columns;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {canCreate && (
          <button onClick={() => { setEditing(null); setError(null); setOpen(true); }} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
            + {tc('create')}
          </button>
        )}
      </div>

      <DataTable table={table} columns={allColumns} getRowId={(r) => r.id} toolbar={toolbar} />

      {fields && (
        <FormDialog
          open={open}
          mode={editing ? 'edit' : 'create'}
          title={`${editing ? tc('edit') : tc('create')} — ${title}`}
          fields={fields}
          initialValues={editing ? (props.toFormValues ?? defaultToValues)(editing) : {}}
          submitting={save.isPending}
          error={error}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSubmit={(v) => save.mutate(v)}
        />
      )}
    </div>
  );
}
