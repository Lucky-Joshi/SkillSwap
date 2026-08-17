import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiZap, FiServer, FiFilter, FiX } from 'react-icons/fi';
import MatchCard from '../../components/feature/MatchCard';
import Tabs from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import Tag from '../../components/ui/Tag';
import Card from '../../components/ui/Card';
import { getRecommendations, refreshRecommendations } from '../../services/recommendations';
import { requestMatch } from '../../services/matches';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks';
import { SKILL_CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function Recommendations() {
  useDocumentTitle('AI Recommendations');
  const { user } = useAuth();
  const [mode, setMode] = useState('mentors');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiService, setAiService] = useState(false);
  const [requestingId, setRequestingId] = useState(null);

  const [minScore, setMinScore] = useState('');
  const [minRating, setMinRating] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [institution, setInstitution] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async (m = mode) => {
    setLoading(true);
    try {
      const res = await getRecommendations(m);
      setCards(res.data || []);
      setAiService(res.aiService === true);
    } catch (err) {
      toast.error(err.message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    load(mode);
  }, [mode, load]);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (minScore && (c.score || 0) < Number(minScore)) return false;
      if (minRating && (c.rating || 0) < Number(minRating)) return false;
      if (institution && !(c.college || '').toLowerCase().includes(institution.toLowerCase())) return false;
      if (skillCategory) {
        const userSkills = (c.reasons || []).map((r) => r.toLowerCase());
        const hasCategorySkill = SKILL_CATEGORIES
          .find((cat) => cat.value === skillCategory)
          ?.label.toLowerCase();
        if (hasCategorySkill && !userSkills.some((s) => s.includes(hasCategorySkill))) return false;
      }
      return true;
    });
  }, [cards, minScore, minRating, skillCategory, institution]);

  const hasActiveFilter = minScore || minRating || skillCategory || institution;

  const handleRefresh = async () => {
    await refreshRecommendations();
    toast.success('Recommendations refreshed');
    load();
  };

  const handleRequest = async (person) => {
    setRequestingId(person.id);
    try {
      await requestMatch({
        userId: person.id,
        mode,
        compatibilityScore: person.score,
        skills: person.reasons?.map((name) => ({ name })),
      });
      toast.success(`Request sent to ${person.name.split(' ')[0]}!`);
      setCards((prev) => prev.filter((c) => c.id !== person.id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRequestingId(null);
    }
  };

  const learnNames = (user?.skills || []).filter((s) => s.wantToLearn).map((s) => s.name).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">AI Recommendations</h1>
            {aiService ? (
              <Tag tone="green" icon="⚡">AI engine live</Tag>
            ) : (
              <Tag tone="amber" icon={<FiServer className="h-3 w-3" />}>Heuristic mode</Tag>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Scored with semantic skill matching — <span className="font-semibold">{mode === 'mentors' ? 'mentors who can teach what you want' : 'learners who want to learn what you teach'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleRefresh}><FiRefreshCw className="h-4 w-4" /> Refresh</Button>
          <Tabs
            tabs={[{ value: 'mentors', label: 'Mentors' }, { value: 'learners', label: 'Learners' }]}
            active={mode}
            onChange={setMode}
          />
        </div>
      </div>

      {learnNames.length === 0 && mode === 'mentors' && (
        <div className="glass flex items-center gap-4 rounded-2xl border-brand-500/30 bg-brand-500/5 p-5">
          <div className="text-3xl">💡</div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Add skills you <b>want to learn</b> to get personalized mentor recommendations.{' '}
            <a href="/app/profile" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">Update profile →</a>
          </p>
        </div>
      )}

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-1.5 ${showFilters ? 'ring-1 ring-brand-400' : ''}`}>
            <FiFilter className="h-4 w-4" /> Filters
            {hasActiveFilter && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">{[minScore, minRating, skillCategory, institution].filter(Boolean).length}</span>}
          </button>
          {hasActiveFilter && (
            <button onClick={() => { setMinScore(''); setMinRating(''); setSkillCategory(''); setInstitution(''); }}
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300">
              <FiX className="inline h-3 w-3" /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-400">{filteredCards.length} of {cards.length} matches</span>
        </div>
        {showFilters && (
          <div className="mt-3 grid gap-3 border-t border-slate-200/60 pt-3 dark:border-white/10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Min compatibility score</label>
              <select value={minScore} onChange={(e) => setMinScore(e.target.value)} className="input">
                <option value="">Any score</option>
                <option value="50">50%+</option>
                <option value="60">60%+</option>
                <option value="70">70%+</option>
                <option value="80">80%+</option>
                <option value="90">90%+</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Min rating</label>
              <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="input">
                <option value="">Any rating</option>
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="4.5">4.5+ stars</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Skill category</label>
              <select value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)} className="input">
                <option value="">All categories</option>
                {SKILL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Institution</label>
              <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="College / University" className="input" />
            </div>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredCards.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={hasActiveFilter ? 'No matches with current filters' : 'No matches yet'}
          description={hasActiveFilter ? 'Try adjusting your filter criteria.' : 'Add more skills to your profile — the AI will find better matches for you.'}
          action={hasActiveFilter
            ? <Button onClick={() => { setMinScore(''); setMinRating(''); setSkillCategory(''); setInstitution(''); }}>Clear filters</Button>
            : <Button onClick={() => load()}><FiZap className="h-4 w-4" /> Re-run matching</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((c) => (
            <MatchCard
              key={c.id}
              person={c}
              mode={mode}
              onRequest={handleRequest}
              requesting={requestingId === c.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
