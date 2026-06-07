'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { api, type PaginatedResponse } from '@/lib/api-client';

export type FieldType = 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select';

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  /** Static options for a select. */
  options?: { value: string; label: string }[];
  /** Async options loaded from a list endpoint (expects {data:[...]} or an array). */
  ref?: { endpoint: string; labelKey?: string; valueKey?: string };
  required?: boolean;
  placeholder?: string;
  /** Show only on create (e.g. immutable codes), or only on edit. */
  only?: 'create' | 'edit';
}

export type FormValues = Record<string, string>;

interface Props {
  open: boolean;
  title: string;
  fields: FieldDef[];
  initialValues?: FormValues;
  mode: 'create' | 'edit';
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

export function FormDialog({ open, title, fields, initialValues, mode, submitting, error, onClose, onSubmit }: Props) {
  const tc = useTranslations('common');
  const [values, setValues] = useState<FormValues>({});

  useEffect(() => {
    if (open) setValues(initialValues ?? {});
  }, [open, initialValues]);

  if (!open) return null;

  const visible = fields.filter((f) => !f.only || f.only === mode);

  const set = (name: string, v: string) => setValues((p) => ({ ...p, [name]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Drop empty optionals so the API doesn't receive "" for UUIDs/numbers.
    const cleaned: FormValues = {};
    for (const [k, v] of Object.entries(values)) if (v !== '' && v != null) cleaned[k] = v;
    onSubmit(cleaned);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="close">✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
            {visible.map((f) => (
              <Field key={f.name} field={f} value={values[f.name] ?? ''} onChange={(v) => set(f.name, v)} />
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <button type="button" onClick={onClose} className="h-9 rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted">{tc('cancel')}</button>
            <button type="submit" disabled={submitting} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{tc('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const cls = 'h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2';
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{field.label}{field.required && <span className="text-destructive"> *</span>}</span>
      {field.ref ? (
        <RefSelect field={field} value={value} onChange={onChange} className={cls} />
      ) : field.options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} required={field.required} className={cls}>
          <option value="">—</option>
          {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} required={field.required} rows={3} className={`${cls} h-auto py-2`} placeholder={field.placeholder} />
      ) : (
        <input
          type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
          className={cls}
        />
      )}
    </label>
  );
}

function RefSelect({ field, value, onChange, className }: { field: FieldDef; value: string; onChange: (v: string) => void; className: string }) {
  const { endpoint, labelKey = 'name', valueKey = 'id' } = field.ref!;
  const { data } = useQuery({
    queryKey: ['ref', endpoint],
    queryFn: ({ signal }) => api.get<PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]>(`${endpoint}?pageSize=200`, signal),
  });
  const rows: Record<string, unknown>[] = Array.isArray(data) ? data : (data?.data ?? []);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required={field.required} className={className}>
      <option value="">—</option>
      {rows.map((r) => (
        <option key={String(r[valueKey])} value={String(r[valueKey])}>{String(r[labelKey] ?? r[valueKey])}</option>
      ))}
    </select>
  );
}
