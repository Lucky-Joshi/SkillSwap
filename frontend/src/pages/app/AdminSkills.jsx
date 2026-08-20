import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks';
import {
  listAdminSkills,
  createAdminSkill,
  updateAdminSkill,
  deleteAdminSkill,
  mergeAdminSkills,
} from '../../services/admin';

const PAGE_SIZE = 20;

const CATEGORIES = [
  'all',
  'programming',
  'frontend',
  'backend',
  'database',
  'data-science',
  'ai-ml',
  'cloud-devops',
  'design',
  'soft-skills',
  'languages',
  'business',
  'other',
];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const CATEGORY_COLORS = {
  programming: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  frontend: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  backend: 'bg-green-500/15 text-green-600 dark:text-green-400',
  database: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'data-science': 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  'ai-ml': 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  'cloud-devops': 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  design: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  'soft-skills': 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  languages: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  business: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  other: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
};

const EMPTY_FORM = { name: '', category: 'programming', difficulty: 'beginner', icon: '', aliases: '' };

export default function AdminSkills() {
  useDocumentTitle('Admin · Skills');

  const [skills, setSkills] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [mergeMode, setMergeMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [mergeTarget, setMergeTarget] = useState('');
  const [mergeSources, setMergeSources] = useState(new Set());

  const buildParams = useCallback(() => {
    const params = { page, limit: PAGE_SIZE };
    if (search.trim()) params.q = search.trim();
    if (category !== 'all') params.category = category;
    return params;
  }, [page, search, category]);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminSkills(buildParams());
      setSkills(res.skills || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const run = async (key, fn, successMsg) => {
    setBusy(key);
    try {
      await fn();
      toast.success(successMsg);
      await loadSkills();
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

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (skill) => {
    setEditingId(skill.id);
    setForm({
      name: skill.name || '',
      category: skill.category || 'programming',
      difficulty: skill.difficulty || 'beginner',
      icon: skill.icon || '',
      aliases: (skill.aliases || []).join(', '),
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Skill name is required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      difficulty: form.difficulty,
      icon: form.icon.trim(),
      aliases: form.aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
    };

    if (editingId) {
      await run(`edit-${editingId}`, () => updateAdminSkill(editingId, payload), 'Skill updated.');
    } else {
      await run('add', () => createAdminSkill(payload), 'Skill created.');
    }
    closeForm();
  };

  const handleDelete = (skill) => {
    if (!window.confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) return;
    run(`del-${skill.id}`, () => deleteAdminSkill(skill.id), `"${skill.name}" deleted.`);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleMergeSource = (id) => {
    setMergeSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enterMergeMode = () => {
    setMergeMode(true);
    setMergeTarget('');
    setMergeSources(new Set());
  };

  const cancelMerge = () => {
    setMergeMode(false);
    setMergeTarget('');
    setMergeSources(new Set());
  };

  const handleMerge = async () => {
    if (!mergeTarget) {
      toast.error('Select a target skill to merge into.');
      return;
    }
    if (mergeSources.size === 0) {
      toast.error('Select at least one source skill to merge.');
      return;
    }
    if (mergeSources.has(mergeTarget)) {
      toast.error('Target cannot also be a source.');
      return;
    }
    const sourceIds = [...mergeSources];
    const targetSkill = skills.find((s) => s.id === mergeTarget);
    if (!window.confirm(`Merge ${sourceIds.length} skill(s) into "${targetSkill?.name}"? This cannot be undone.`)) return;

    await run(
      'merge',
      () => mergeAdminSkills({ targetId: mergeTarget, sourceIds }),
      'Skills merged successfully.'
    );
    cancelMerge();
  };

  const categoryBadge = (cat) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.other}`}>
      {cat}
    </span>
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Skill Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View, search, and manage all skills.
          </p>
        </div>
        <div className="flex gap-2">
          {mergeMode ? (
            <>
              <Button
                variant="primary"
                loading={busy === 'merge'}
                onClick={handleMerge}
              >
                Merge ({mergeSources.size}) into target
              </Button>
              <Button variant="secondary" onClick={cancelMerge}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={enterMergeMode}>
                Merge Skills
              </Button>
              <Button variant="primary" onClick={openAddForm}>
                + Add Skill
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <form onSubmit={handleSearch} className="mb-4">
          <Input
            placeholder="Search by name or alias…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={category}
            onChange={handleCategoryChange}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-white/5"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Spinner />
        ) : skills.length === 0 ? (
          <EmptyState icon="🛠️" title="No skills found" description="Try adjusting your search or filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                    {mergeMode && <th className="py-2 pr-2 w-8" />}
                    <th className="py-2 pr-4">Skill</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Difficulty</th>
                    <th className="py-2 pr-4">Aliases</th>
                    <th className="py-2 pr-4">Users</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 dark:border-white/5">
                      {mergeMode && (
                        <td className="py-2.5 pr-2">
                          {mergeTarget === s.id ? (
                            <span className="inline-block h-4 w-4 rounded-full bg-brand-500" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={mergeSources.has(s.id)}
                              onChange={() => toggleMergeSource(s.id)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          )}
                        </td>
                      )}
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-2">
                          {s.icon && <span className="text-lg">{s.icon}</span>}
                          <div>
                            <div className="font-semibold">{s.name}</div>
                            {mergeMode && (
                              <button
                                type="button"
                                onClick={() => setMergeTarget(s.id)}
                                className={`mt-0.5 text-[10px] font-medium transition ${
                                  mergeTarget === s.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 hover:text-brand-500'
                                }`}
                              >
                                {mergeTarget === s.id ? '● Target' : 'Set as target'}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">{categoryBadge(s.category)}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
                          {s.difficulty || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {s.aliases && s.aliases.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.aliases.slice(0, 3).map((a, i) => (
                              <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-white/10 dark:text-slate-400">
                                {a}
                              </span>
                            ))}
                            {s.aliases.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{s.aliases.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 font-mono">{s.userCount ?? 0}</td>
                      <td className="py-2.5 text-right">
                        {!mergeMode && (
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => openEditForm(s)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="!px-2 !py-1 text-xs text-red-500"
                              loading={busy === `del-${s.id}`}
                              onClick={() => handleDelete(s)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>
                Page {page} of {totalPages} ({total} skills)
              </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-4">
            <h2 className="font-display text-lg font-bold mb-4">
              {editingId ? 'Edit Skill' : 'Add Skill'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Name *</label>
                <Input
                  value={form.name}
                  onChange={handleFormChange('name')}
                  placeholder="e.g. React"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Category</label>
                  <select
                    value={form.category}
                    onChange={handleFormChange('category')}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
                  >
                    {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1).replace(/-/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={handleFormChange('difficulty')}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-white/5"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Icon (emoji)</label>
                <Input
                  value={form.icon}
                  onChange={handleFormChange('icon')}
                  placeholder="e.g. ⚛️"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Aliases (comma-separated)</label>
                <Input
                  value={form.aliases}
                  onChange={handleFormChange('aliases')}
                  placeholder="e.g. ReactJS, React.js"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" type="button" onClick={closeForm}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={busy === 'add' || (editingId && busy === `edit-${editingId}`)}
                >
                  {editingId ? 'Save Changes' : 'Create Skill'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
