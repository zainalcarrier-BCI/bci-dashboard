import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Download, Eye, FileText, Filter, RefreshCw, Search, Sparkles } from 'lucide-react';
import Layout from './Layout';
import { ApiManualDocument, getManualDocumentUrl, getManualDocuments } from '../services/api';

interface ManualBookProps {
  onBack: () => void;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

export default function ManualBook({ onBack, onTabChange }: ManualBookProps) {
  const [documents, setDocuments] = useState<ApiManualDocument[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDocuments = useCallback(() => {
    let isMounted = true;
    const filterQuery = activeFilter === 'All' ? query : `${query} ${activeFilter}`.trim();
    setIsLoading(true);
    setError('');
    getManualDocuments(filterQuery)
      .then((payload) => {
        if (isMounted) setDocuments(payload.rows);
      })
      .catch(() => {
        if (isMounted) {
          setDocuments([]);
          setError('Manual book belum bisa dimuat. Cek koneksi lalu coba retry.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFilter, query]);

  useEffect(() => loadDocuments(), [loadDocuments]);

  const now = Date.now();
  const recentDocuments = documents.filter((doc) => {
    if (!doc.uploaded_at) return false;
    const uploadedAt = new Date(doc.uploaded_at).getTime();
    return Number.isFinite(uploadedAt) && now - uploadedAt <= 7 * 24 * 60 * 60 * 1000;
  });
  const uniqueBrands = new Set(documents.map((doc) => doc.brand).filter(Boolean));
  const latestTitles = recentDocuments.slice(0, 2).map((doc) => doc.title);
  const hasActiveFilter = query.trim().length > 0 || activeFilter !== 'All';

  const openDocument = async (doc: ApiManualDocument, mode: 'view' | 'download') => {
    setError('');
    const newWindow = mode === 'view' ? window.open('', '_blank') : null;
    try {
      const payload = await getManualDocumentUrl(doc.id);
      if (mode === 'view') {
        if (newWindow) {
          newWindow.location.href = payload.url;
        } else {
          window.location.href = payload.url;
        }
        return;
      }
      const link = document.createElement('a');
      link.href = payload.url;
      link.download = `${doc.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'manual'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      newWindow?.close();
      setError('Dokumen belum bisa dibuka. Cek koneksi atau akses manual book.');
    }
  };

  return (
    <Layout title="Manual Book" onBack={onBack} activeTab="profile" onTabChange={onTabChange}>
      <div className="p-4 space-y-5 pb-28">
        <section className="bg-primary text-white rounded-[2rem] p-6 relative overflow-hidden">
          <BookOpen className="absolute -right-5 -bottom-5 w-36 h-36 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-fixed">Technical Document Center</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold">Manual Book</h2>
          <p className="mt-2 text-sm text-white/85">Cari IOM, wiring diagram, service manual, dan troubleshooting PDF.</p>
        </section>

        <section className="rounded-[2rem] bg-secondary-fixed/40 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-headline font-extrabold text-on-surface">
                {recentDocuments.length ? `${recentDocuments.length} new document${recentDocuments.length > 1 ? 's' : ''} this week` : 'No new document this week'}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {latestTitles.length
                  ? `${latestTitles.join(' dan ')} sudah tersedia untuk view online dan download.`
                  : 'Dokumen yang aktif tetap bisa dicari, dibuka online, dan di-download dari library di bawah.'}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
            <input
              type="search"
              name="manualSearch"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by model, brand, error code, document type..."
              className="w-full h-14 rounded-2xl border-none bg-surface-container-lowest pl-12 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['All', 'IOM', 'Wiring', 'Service Manual', 'Troubleshooting', 'Carrier', 'Toshiba'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
                  activeFilter === filter ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          {[
            [String(documents.length), 'PDF Files'],
            [String(recentDocuments.length), 'New Docs'],
            [String(uniqueBrands.size), 'Brands'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-[1.5rem] bg-surface-container-lowest p-4 text-center shadow-sm">
              <p className="font-headline text-2xl font-extrabold text-primary">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-sm tracking-tight">Document Library</h3>
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveFilter('All');
                }}
                className="flex items-center gap-1 text-xs font-bold text-primary"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Filter
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-outline">
                <Filter className="w-4 h-4" />
                Live Filter
              </div>
            )}
          </div>
          {error && (
            <div className="rounded-2xl bg-error-container px-4 py-3 text-xs font-bold text-on-error-container">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => loadDocuments()} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-[10px] font-bold uppercase text-on-error-container">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          {isLoading && (
            <p className="rounded-2xl bg-surface-container-lowest p-5 text-sm font-semibold text-on-surface-variant">Loading manual documents...</p>
          )}

          {!isLoading && !error && documents.length === 0 && (
            <p className="rounded-2xl bg-surface-container-lowest p-5 text-sm font-semibold text-on-surface-variant">
              Tidak ada dokumen untuk filter/search ini.
            </p>
          )}

          {!isLoading && documents.map((doc, index) => (
            <article key={doc.id} className="rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary-fixed/70 px-2 py-1 text-[9px] font-bold uppercase text-primary">
                          {doc.document_type.replaceAll('_', ' ')}
                        </span>
                        {index < 2 && (
                          <span className="rounded-full bg-tertiary/15 px-2 py-1 text-[9px] font-bold uppercase text-tertiary">
                            New
                          </span>
                        )}
                      </div>
                      <h4 className="mt-2 font-headline text-base font-extrabold text-on-surface leading-tight">{doc.title}</h4>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {doc.brand} / {doc.product_line} / {doc.version} / Model {doc.model_keyword}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => void openDocument(doc, 'view')} className="h-11 rounded-2xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <Eye className="w-4 h-4" />
                      View Online
                    </button>
                    <button type="button" onClick={() => void openDocument(doc, 'download')} className="h-11 rounded-2xl bg-surface-container-low text-on-surface font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform">
                      <Download className="w-4 h-4 text-primary" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </Layout>
  );
}
