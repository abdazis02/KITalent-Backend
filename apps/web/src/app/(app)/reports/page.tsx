'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrency, type Locale } from '@kitalent/shared';
import { api } from '@/lib/api-client';
import { auth } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const REPORTS = ['employees', 'headcount-by-department', 'active-placements'];

interface Aging {
  outstanding: number;
  count: number;
  buckets: { current: number; d1_30: number; d31_60: number; d61_90: number; d90_plus: number };
}
interface ReportData { code: string; columns: string[]; rows: (string | number)[][] }

async function downloadCsv(code: string) {
  const res = await fetch(`${API_URL}/reports/${code}/export`, {
    headers: {
      ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
      ...(auth.tenantId ? { 'x-tenant-id': auth.tenantId } : {}),
    },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${code}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const tn = useTranslations('navigation');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const [code, setCode] = useState(REPORTS[0]);

  const aging = useQuery({ queryKey: ['reports', 'aging'], queryFn: ({ signal }) => api.get<Aging>('/reports/invoice-aging', signal) });
  const report = useQuery({ queryKey: ['reports', code], queryFn: ({ signal }) => api.get<ReportData>(`/reports/${code}`, signal) });

  const b = aging.data?.buckets;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">{tn('reports')}</h1>

      {/* Invoice aging */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold text-foreground">Aging Invoice</h2>
        {aging.isLoading ? (
          <p className="text-sm text-muted-foreground">{tc('loading')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ['Belum jatuh tempo', b?.current],
              ['1–30 hari', b?.d1_30],
              ['31–60 hari', b?.d31_60],
              ['61–90 hari', b?.d61_90],
              ['> 90 hari', b?.d90_plus],
            ].map(([label, val]) => (
              <div key={label as string} className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">{label as string}</div>
                <div className="mt-1 font-semibold text-foreground">{formatCurrency((val as number) ?? 0, locale)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Named report runner */}
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-foreground">Laporan</h2>
          <select value={code} onChange={(e) => setCode(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
            {REPORTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={() => downloadCsv(code)} className="ml-auto h-9 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
            {tc('export')} CSV
          </button>
        </div>
        {report.isLoading ? (
          <p className="text-sm text-muted-foreground">{tc('loading')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  {report.data?.columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {report.data?.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {row.map((cell, j) => <td key={j} className="px-3 py-2 text-card-foreground">{String(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
