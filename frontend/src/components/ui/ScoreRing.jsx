import { scoreLabel } from '../../utils/constants';

export default function ScoreRing({ score = 0, size = 88 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 50 ? '#f59e0b' : '#f87171';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="6"
          className="stroke-slate-200 dark:stroke-slate-700"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-lg font-extrabold" style={{ color }}>
          {score}%
        </div>
        <div className="text-[9px] font-medium text-slate-400">{scoreLabel(score)}</div>
      </div>
    </div>
  );
}
