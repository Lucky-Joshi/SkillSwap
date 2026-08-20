import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import {
  listAdminInstitutions,
  createAdminInstitution,
  updateAdminInstitution,
  deleteAdminInstitution,
  mergeAdminInstitutions,
} from '../../services/admin';
import { formatDate } from '../../utils/helpers';

const PAGE_SIZE = 20;
const TYPES = ['all', 'school', 'college', 'university'];
const EMPTY_FORM = { name: '', city: '', country: '', type: 'university' };

export default function AdminInstitutions() {
  useDocumentTitle('Admin · Institutions');

  const [institutions, setInstitutions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [selected, setSelected] = useState(new Set());
  const [showMerge, setShowMerge] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const [mergeSourceIds, setMergeSourceIds] = useState([]);

  const buildParams = useCallback(() => {
    const params = { page, limit: PAGE_SIZE };
    if (search.trim()) params.q = search.trim();
    if (filterType !== 'all') params.type = filterType;
    return params;
  }, [page, search, filterType]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminInstitutions(buildParams());
      setInstitutions(res.institutions || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setSelected(new Set());
  }, [institutions]);

  const run = async (key, fn, successMsg) => {
    setBusy(key);
    try {
      await fn();
      toast.success(successMsg);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleTypeChange = (e) => {
    setFilterType(e.target.value);
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (inst) => {
    setEditing(inst);
    setForm({ name: inst.name, city: inst.city || '', country: inst.country || '', type: inst.type || 'university' });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required.'); return; }
    const key = editing ? `edit-${editing.id}` : 'create';
    setBusy(key);
    try {
      if (editing) {
        await updateAdminInstitution(editing.id, form);
        toast.success(`${form.name} updated.`);
      } else {
        await createAdminInstitution(form);
        toast.success(`${form.name} created.`);
      }
      closeForm();
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleDelete = (inst) => {
    if (!window.confirm(`Delete "${inst.name}"? This cannot be undone.`)) return;
    run(`del-${inst.id}`, () => deleteAdminInstitution(inst.id), `"${inst.name}" deleted.`);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === institutions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(institutions.map((i) => i.id)));
    }
  };

  const openMerge = () => {
    if (selected.size < 2) { toast.error('Select at least 2 institutions to merge.'); return; }
    const selectedInsts = institutions.filter((i) => selected.has(i.id));
    setMergeTarget(selectedInsts[0].id);
    setMergeSourceIds(selectedInsts.map((i) => i.id));
    setShowMerge(true);
  };

  const handleMerge = async () => {
    if (!mergeTarget) { toast.error('Select a target institution.'); return; }
    const sourceIds = mergeSourceIds.filter((id) => id !== mergeTarget);
    if (sourceIds.length === 0) { toast.error('Select at least one source to merge into the target.'); return; }
    setBusy('merge');
    try {
      await mergeAdminInstitutions({ targetId: mergeTarget, sourceIds });
      toast.success('Institutions merged successfully.');
      setShowMerge(false);
      setMergeTarget('');
      setMergeSourceIds([]);
      setSelected(new Set());
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Institution Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View, search, and manage all institutions.
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size >= 2 && (
            <Button variant="primary" className="bg-purple-600 hover:bg-purple-700" onClick={openMerge} loading={busy === 'merge'}>
              Merge Selected ({selected.size})
            </Button>
          )}
          <Button variant="primary" className="bg-purple-600 hover:bg-purple-700" onClick={openAdd}>
            Add Institution
          </Button>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="mb-4">
          <Input
            placeholder="Search by name, city, or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={filterType}
            onChange={handleTypeChange}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t === 'all' ? 'All types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : institutions.length === 0 ? (
          <EmptyState icon="🏫" title="No institutions found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                    <th className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.size === institutions.length && institutions.length > 0}
                        onChange={toggleSelectAll}
                        className="accent-purple-600"
                      />
                    </th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">City</th>
                    <th className="py-2 pr-4">Country</th>
                    <th className="py-2 pr-4">Users</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst) => (
                    <tr key={inst.id} className="border-b border-slate-100 dark:border-white/5">
                      <td className="py-2.5 pr-2">
                        <input
                          type="checkbox"
                          checked={selected.has(inst.id)}
                          onChange={() => toggleSelect(inst.id)}
                          className="accent-purple-600"
                        />
                      </td>
                      <td className="py-2.5 pr-4 font-semibold">{inst.name}</td>
                      <td className="py-2.5 pr-4">
                        <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-purple-600 capitalize dark:text-purple-400">
                          {inst.type || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{inst.city || '—'}</td>
                      <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{inst.country || '—'}</td>
                      <td className="py-2.5 pr-4 font-mono">{inst.userCount ?? 0}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(inst.createdAt)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1 text-xs"
                            loading={busy === `edit-${inst.id}`}
                            onClick={() => openEdit(inst)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="!px-2 !py-1 text-xs text-red-500"
                            loading={busy === `del-${inst.id}`}
                            onClick={() => handleDelete(inst)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Page {page} of {totalPages} ({total} institutions)</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="!px-3 !py-1 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  className="!px-3 !py-1 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeForm}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-display text-lg font-bold">{editing ? 'Edit Institution' : 'Add Institution'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name *</label>
                <Input
                  value={form.name}
                  onChange={handleFormChange('name')}
                  placeholder="e.g. MIT"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>
                <select
                  value={form.type}
                  onChange={handleFormChange('type')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                >
                  {TYPES.filter((t) => t !== 'all').map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">City</label>
                <Input
                  value={form.city}
                  onChange={handleFormChange('city')}
                  placeholder="e.g. Cambridge"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Country</label>
                <Input
                  value={form.country}
                  onChange={handleFormChange('country')}
                  placeholder="e.g. USA"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={closeForm} type="button">Cancel</Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                  loading={busy === 'create' || busy === `edit-${editing?.id}`}
                >
                  {editing ? 'Save Changes' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowMerge(false)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 font-display text-lg font-bold">Merge Institutions</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Choose the target institution. All users from the source institutions will be reassigned to it, and the sources will be deleted.
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Target Institution *</label>
              <select
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              >
                {institutions
                  .filter((i) => mergeSourceIds.includes(i.id))
                  .map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium">Source Institutions (will be merged into target and deleted)</label>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-white/10">
                {institutions
                  .filter((i) => mergeSourceIds.includes(i.id))
                  .map((i) => (
                    <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-white/5">
                      <input
                        type="checkbox"
                        checked={i.id !== mergeTarget && mergeSourceIds.includes(i.id)}
                        disabled={i.id === mergeTarget}
                        onChange={() => {
                          if (i.id === mergeTarget) return;
                          setMergeSourceIds((prev) =>
                            prev.includes(i.id) ? prev.filter((id) => id !== i.id) : [...prev, i.id]
                          );
                        }}
                        className="accent-purple-600"
                      />
                      <span className={i.id === mergeTarget ? 'font-semibold text-purple-600 dark:text-purple-400' : ''}>
                        {i.name}{i.id === mergeTarget ? ' (target)' : ''}
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowMerge(false)}>Cancel</Button>
              <Button
                variant="primary"
                className="bg-purple-600 hover:bg-purple-700"
                loading={busy === 'merge'}
                onClick={handleMerge}
              >
                Merge Into Target
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
