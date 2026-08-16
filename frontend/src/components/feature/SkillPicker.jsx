import { useMemo, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { cx } from '../../utils/helpers';
import { useDebounce } from '../../hooks';
import { SKILL_CATEGORIES } from '../../utils/constants';

/**
 * SkillPicker — searchable grid of skills; toggle each into
 * "can teach" or "want to learn". Used in Register + Profile.
 */
export default function SkillPicker({ skills, selected = [], onChange }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const debounced = useDebounce(search, 200);

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      const matchSearch = !debounced || s.name.toLowerCase().includes(debounced.toLowerCase());
      const matchCategory = category === 'all' || s.category === category;
      return matchSearch && matchCategory;
    });
  }, [skills, debounced, category]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (skill) => {
    const next = selectedSet.has(skill._id)
      ? selected.filter((id) => id !== skill._id)
      : [...selected, skill._id];
    onChange(next);
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills…"
            className="input pl-10"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input sm:w-52">
          <option value="all">All categories</option>
          {SKILL_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto pr-1">
        {filtered.map((s) => {
          const isSelected = selectedSet.has(s._id);
          return (
            <button
              key={s._id}
              type="button"
              onClick={() => toggle(s)}
              className={cx(
                'chip border transition-all',
                isSelected
                  ? 'border-brand-500 bg-brand-500/15 text-brand-700 shadow-sm dark:text-brand-300'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              )}
            >
              <span>{s.icon || '⭐'}</span>
              {s.name}
              {isSelected && <span className="text-brand-500">✓</span>}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="w-full py-8 text-center text-sm text-slate-400">No skills match "{search}".</p>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {selected.length} selected
      </p>
    </div>
  );
}
