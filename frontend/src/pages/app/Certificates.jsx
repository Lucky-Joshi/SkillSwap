import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiFileText, FiCheckCircle } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { getCertificates, grantCertificate } from '../../services/certificates';
import { useDocumentTitle } from '../../hooks';
import { formatDate } from '../../utils/helpers';

export default function Certificates() {
  useDocumentTitle('Certificates');
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getCertificates();
      setCertificates(res.certificates || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGrant = async (sessionId) => {
    try {
      await grantCertificate(sessionId);
      toast.success('Certificate granted + badge earned!');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const download = (cert) => {
    const html = `
      <html><body style="font-family:Georgia,serif;text-align:center;padding:60px">
        <h1 style="font-size:48px">🏅 Certificate of Mentorship</h1>
        <p style="font-size:20px">This certifies that a peer-to-peer learning session</p>
        <h2 style="font-size:28px">"${cert.title}"</h2>
        <p style="font-size:18px">was completed by ${cert.role} on ${formatDate(cert.completedAt)}</p>
        <p style="font-size:16px;color:#888">Certificate ID: ${cert.certificateId}</p>
        <p style="font-size:14px;color:#aaa">SkillSwap · AI-Powered Peer Learning</p>
      </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${cert.certificateId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Certificates</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Earned automatically when you complete mentoring sessions.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No certificates yet"
          description="Complete a mentoring session to earn your first certificate."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <Card key={c.id} className="relative overflow-hidden text-center">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/20 blur-2xl" />
              <div className="text-5xl">📜</div>
              <h3 className="mt-3 font-display font-bold">{c.topic}</h3>
              <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-400">
                <FiCheckCircle className="text-emerald-500" /> {c.role} · {c.hours} hrs
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-brand-500/40 bg-brand-500/5 px-3 py-2">
                <div className="text-[11px] text-slate-400">Certificate ID</div>
                <div className="font-mono text-sm font-bold text-brand-600 dark:text-brand-300">{c.certificateId}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => download(c)}>
                  <FiDownload className="h-4 w-4" /> Download
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => handleGrant(c.id)}>
                  <FiFileText className="h-4 w-4" /> Grant badge
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
