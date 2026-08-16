import { cx } from '../../utils/helpers';

const TONES = {
  brand: 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border-brand-500/30',
  green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  amber: 'bg-accent/15 text-amber-700 dark:text-amber-300 border-accent/40',
  red: 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30',
  slate: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
  purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
};

export default function Tag({ children, tone = 'brand', className, icon }) {
  return (
    <span className={cx('chip border', TONES[tone], className)}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}

export function SkillChip({ name, icon, tone }) {
  return <Tag tone={tone || 'brand'}>{icon && <span>{icon}</span>}{name}</Tag>;
}
