import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import MatchCard from '../../components/feature/MatchCard';
import Tabs from '../../components/ui/Tabs';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { searchUsers } from '../../services/users';
import { requestMatch } from '../../services/matches';
import { useDebounce, useDocumentTitle } from '../../hooks';
import { SKILL_CATEGORIES, AVAILABILITY_OPTIONS, DEPARTMENT_OPTIONS, QUALIFICATION_OPTIONS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function Discover() {
  useDocumentTitle('Discover');
  const [mode, setMode] = useState('mentors');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [availability, setAvailability] = useState('');
  const [college, setCollege] = useState('');
  const [qualification, setQualification] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [requestingId, setRequestingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(search, 350);

  const filters = useMemo(
    () => ({ skill, department, year, availability, college, qualification, verified: verifiedOnly ? 'true' : undefined, sort: sortBy || undefined }),
    [skill, department, year, availability, college, qualification, verifiedOnly, sortBy]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchUsers({
        search: debouncedSearch,
        page,
        limit: 9,
        ...filters,
      });
      setUsers(res.users || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const hasActiveFilter = search || skill || department || year || availability || college || qualification || verifiedOnly || sortBy;

  const clearFilters = () => {
    setSearch('');
    setSkill('');
    setDepartment('');
    setYear('');
    setAvailability('');
    setCollege('');
    setQualification('');
    setVerifiedOnly(false);
    setSortBy('');
    setPage(1);
  };

  const handleRequest = async (person) => {
    setRequestingId(person.id);
    try {
      const type = mode === 'peer' ? 'peer' : 'mentorship';
      await requestMatch({ userId: person.id, mode, type });
      toast.success(`Request sent to ${person.name.split(' ')[0]}!`);
      setUsers((prev) => prev.filter((u) => u.id !== person.id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRequestingId(null);
    }
  };

  const activeFilterCount = [skill, department, year, availability, college, qualification, verifiedOnly, sortBy].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Discover students</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Browse your campus community and filter by what matters.
          </p>
        </div>
        <Tabs
          tabs={[{ value: 'mentors', label: 'Looking for mentors' }, { value: 'learners', label: 'Mentor others' }, { value: 'peer', label: 'Peer learning' }]}
          active={mode}
          onChange={setMode}
          className="w-full sm:w-auto"
        />
      </div>

      {/* Filters */}
      <Card className="!p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, bio or college…" className="input pl-10" />
          </div>
          <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} className="input">
            <option value="">All departments</option>
            {DEPARTMENT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex gap-2">
            <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} className="input flex-1">
              <option value="">Any year</option>
              {['1', '2', '3', '4', '5'].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary relative flex items-center gap-1.5 ${showFilters ? 'ring-1 ring-brand-400' : ''}`}>
              <FiFilter className="h-4 w-4" /> Filters
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid gap-3 border-t border-slate-200/60 pt-3 dark:border-white/10 md:grid-cols-2 lg:grid-cols-4">
            <input value={skill} onChange={(e) => { setSkill(e.target.value); setPage(1); }} placeholder="Skill (e.g. React)" className="input" />
            <select value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1); }} className="input">
              <option value="">Any availability</option>
              {AVAILABILITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <input value={college} onChange={(e) => { setCollege(e.target.value); setPage(1); }} placeholder="College / University" className="input" />
            <select value={qualification} onChange={(e) => { setQualification(e.target.value); setPage(1); }} className="input">
              <option value="">Any qualification</option>
              {QUALIFICATION_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="input">
              <option value="">Default sort</option>
              <option value="rating">Highest rated</option>
              <option value="name">Name A-Z</option>
              <option value="newest">Newest</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }} className="h-4 w-4 rounded" />
              Verified only
            </label>
          </div>
        )}

        {hasActiveFilter && (
          <button onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
            <FiX /> Clear all filters
          </button>
        )}
      </Card>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No students found"
          description={hasActiveFilter ? 'Try widening your filters.' : 'No students on the platform yet.'}
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <MatchCard
                key={u.id}
                person={{ ...u, score: 0 }}
                mode={mode}
                onRequest={handleRequest}
                requesting={requestingId === u.id}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
