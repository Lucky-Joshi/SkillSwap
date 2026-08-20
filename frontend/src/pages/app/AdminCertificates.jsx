import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { useDocumentTitle } from '../../hooks';
import { listAdminCertificates } from '../../services/admin';
import { formatDate } from '../../utils/helpers';

const Stars = ({ value = 0 }) => {
  const full = Math.round(value);
  return (
    <span className="text-sm tracking-wide text-amber-500" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (i < full ? '★' : '☆')).join('')}
    </span>
  );
};

export default function AdminCertificates() {
  useDocumentTitle('Admin · Certificates');

  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [detail, setDetail] = useState(null);

  const loadCerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await listAdminCertificates(params);
      setCerts(res.certificates || res || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCerts();
  }, []);

  const applyFilter = () => loadCerts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Certificates</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View all issued mentorship certificates.</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <Button variant="secondary" onClick={applyFilter}>Filter</Button>
        </div>

        {loading ? (
          <Spinner />
        ) : certs.length === 0 ? (
          <EmptyState icon="📜" title="No certificates found" description="No certificates match the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                  <th className="py-2 pr-4">Mentor</th>
                  <th className="py-2 pr-4">Learner</th>
                  <th className="py-2 pr-4">Topic</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Rating</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-2.5 pr-4 font-semibold">{c.mentor?.name || c.mentorName || '—'}</td>
                    <td className="py-2.5 pr-4">{c.learner?.name || c.learnerName || '—'}</td>
                    <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{c.topic || c.skill || '—'}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(c.issuedAt || c.createdAt)}</td>
                    <td className="py-2.5 pr-4"><Stars value={c.rating} /></td>
                    <td className="py-2.5 text-right">
                      <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setDetail(detail?.id === c.id ? null : c)}>
                        {detail?.id === c.id ? 'Hide' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detail && (
        <Card>
          <h2 className="mb-3 font-display text-lg font-bold">Certificate Details</h2>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-slate-400 text-xs uppercase">Mentor</dt>
              <dd className="mt-0.5 font-medium">{detail.mentor?.name || detail.mentorName || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs uppercase">Learner</dt>
              <dd className="mt-0.5 font-medium">{detail.learner?.name || detail.learnerName || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs uppercase">Topic</dt>
              <dd className="mt-0.5 font-medium">{detail.topic || detail.skill || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs uppercase">Date</dt>
              <dd className="mt-0.5 font-medium">{formatDate(detail.issuedAt || detail.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-slate-400 text-xs uppercase">Rating</dt>
              <dd className="mt-0.5"><Stars value={detail.rating} /></dd>
            </div>
            {detail.description && (
              <div className="sm:col-span-2">
                <dt className="text-slate-400 text-xs uppercase">Description</dt>
                <dd className="mt-0.5 text-slate-600 dark:text-slate-300">{detail.description}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}
    </div>
  );
}
