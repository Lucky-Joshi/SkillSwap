import { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw, FiZap, FiServer } from 'react-icons/fi';
import MatchCard from '../components/feature/MatchCard';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import { getRecommendations, refreshRecommendations } from '../services/recommendations';
import { requestMatch } from '../services/matches';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks';
import toast from 'react-hot-toast';

export default function Recommendations() {
  useDocumentTitle('AI Recommendations');
  const { user } = useAuth();
  const [mode, setMode] = useState('mentors');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiService, setAiService] = useState(false);
  const [requestingId, setRequestingId] = useState(null);

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
            <a href="/profile" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">Update profile →</a>
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No matches yet"
          description="Add more skills to your profile — the AI will find better matches for you."
          action={<Button onClick={() => load()}><FiZap className="h-4 w-4" /> Re-run matching</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
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
