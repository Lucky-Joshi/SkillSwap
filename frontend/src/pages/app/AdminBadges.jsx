import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import {
  listAdminBadges,
  createAdminBadge,
  updateAdminBadge,
  deleteAdminBadge,
} from '../../services/admin';

const EMPTY_FORM = { name: '', description: '', icon: '🏅', points: 10, criteria: '', autoGrant: false };

export default function AdminBadges() {
  useDocumentTitle('Admin · Badges');

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadBadges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminBadges();
      setBadges(res.badges || res || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const setField = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: key === 'points' ? Number(val) : val }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (badge) => {
    setEditing(badge);
    setForm({ name: badge.name, description: badge.description || '', icon: badge.icon || '🏅', points: badge.points || 10, criteria: badge.criteria || '', autoGrant: badge.autoGrant || false });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    const key = editing ? `edit-${editing.id}` : 'create';
    setBusy(key);
    try {
      if (editing) {
        await updateAdminBadge(editing.id, form);
        toast.success('Badge updated.');
      } else {
        await createAdminBadge(form);
        toast.success('Badge created.');
      }
      setShowForm(false);
      setEditing(null);
      await loadBadges();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleDelete = (badge) => {
    if (!window.confirm(`Delete badge "${badge.name}"? This cannot be undone.`)) return;
    setBusy(`del-${badge.id}`);
    deleteAdminBadge(badge.id)
      .then(() => { toast.success('Badge deleted.'); return loadBadges(); })
      .catch((err) => toast.error(err.message))
      .finally(() => setBusy(''));
  };

  const updateField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Badge Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create, edit, and manage achievement badges.</p>
        </div>
        <Button onClick={openCreate}>Add Badge</Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="mb-4 font-display text-lg font-bold">{editing ? 'Edit Badge' : 'New Badge'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" value={form.name} onChange={setField('name')} required />
              <Input label="Icon" value={form.icon} onChange={setField('icon')} placeholder="🏅" />
              <Input label="Points" type="number" value={form.points} onChange={setField('points')} min={0} />
              <Input label="Criteria" value={form.criteria} onChange={setField('criteria')} placeholder="e.g. complete 5 sessions" />
            </div>
            <Input label="Description" value={form.description} onChange={setField('description')} />
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={form.autoGrant} onChange={setField('autoGrant')} className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
              Auto-grant when criteria are met
            </label>
            <div className="flex gap-2">
              <Button type="submit" loading={busy === 'create' || busy === `edit-${editing?.id}`}>Save</Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <Spinner />
        ) : badges.length === 0 ? (
          <EmptyState icon="🏅" title="No badges yet" description="Create your first badge to get started." action={<Button onClick={openCreate}>Add Badge</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                  <th className="py-2 pr-4">Icon</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Points</th>
                  <th className="py-2 pr-4">Criteria</th>
                  <th className="py-2 pr-4">Auto-Grant</th>
                  <th className="py-2 pr-4">Issued</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {badges.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-2.5 pr-4 text-xl">{b.icon || '🏅'}</td>
                    <td className="py-2.5 pr-4 font-semibold">{b.name}</td>
                    <td className="py-2.5 pr-4 max-w-xs truncate text-slate-500 dark:text-slate-400">{b.description || '—'}</td>
                    <td className="py-2.5 pr-4 font-mono">{b.points ?? 0}</td>
                    <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{b.criteria || '—'}</td>
                    <td className="py-2.5 pr-4">
                      {b.autoGrant
                        ? <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Yes</span>
                        : <span className="text-slate-400">No</span>}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">{b.issuedCount ?? b.count ?? 0}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEdit(b)}>Edit</Button>
                        <Button variant="ghost" className="!px-2 !py-1 text-xs text-red-500" loading={busy === `del-${b.id}`} onClick={() => handleDelete(b)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
