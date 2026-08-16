import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiZap, FiSend } from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import RoadmapView from '../components/feature/RoadmapView';
import Tag from '../components/ui/Tag';
import { getRoadmap } from '../services/ai';
import { useDocumentTitle } from '../hooks';

const EXAMPLES = [
  'I want to become a Data Scientist',
  'I want to become a Web Developer',
  'I want to become an ML Engineer',
  'I want to become an Android Developer',
  'I want to become a UI/UX Designer',
];

export default function Roadmap() {
  useDocumentTitle('AI Roadmap');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onSubmit = async ({ goal }) => {
    setLoading(true);
    setRoadmap(null);
    try {
      const res = await getRoadmap(goal);
      setRoadmap(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">AI Learning Roadmap</h1>
          <Tag tone="brand" icon="⚡">AI</Tag>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Describe a career goal and get a step-by-step skill roadmap.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              placeholder='e.g. "I want to become a Data Scientist"'
              className="input flex-1"
              {...register('goal', { required: 'Tell me your goal first' })}
            />
            <Button type="submit" loading={loading} className="sm:w-44">
              <FiZap className="h-4 w-4" /> Generate
            </Button>
          </div>
          {errors.goal && <p className="text-xs text-red-500">{errors.goal.message}</p>}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-400">Try:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setValue('goal', ex)}
                className="chip border border-brand-500/30 bg-brand-500/5 text-xs text-brand-700 transition hover:bg-brand-500/15 dark:text-brand-300"
              >
                {ex}
              </button>
            ))}
          </div>
        </form>
      </Card>

      <Card>
        <RoadmapView roadmap={roadmap} loading={loading} />
      </Card>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 text-sm text-slate-600 dark:text-slate-300">
        <FiSend className="mt-0.5 shrink-0 text-brand-500" />
        <p>
          <b>Pro tip:</b> share your roadmap with a mentor from{' '}
          <a href="/recommendations" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">AI Recommendations</a> —
          they can guide you through each step.
        </p>
      </div>
    </div>
  );
}
