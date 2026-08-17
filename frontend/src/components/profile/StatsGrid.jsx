import { FiBook, FiClock, FiUsers, FiStar, FiAward, FiZap, FiTrendingUp, FiEye } from 'react-icons/fi';
import StatCard from '../ui/StatCard';

export default function StatsGrid({ stats = {}, connections = {} }) {
  const totalConnections = (connections.mentors || 0) + (connections.learners || 0) + (connections.peers || 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        icon={<FiBook />}
        label="Sessions Conducted"
        value={(stats.sessionsAsMentor || 0) + (stats.sessionsAsLearner || 0)}
        sub={`${stats.sessionsAsMentor || 0} teaching · ${stats.sessionsAsLearner || 0} learning`}
        accent="from-brand-500 to-brand-600"
      />
      <StatCard
        icon={<FiClock />}
        label="Hours Taught"
        value={stats.hoursTaught || 0}
        sub={`${stats.hoursLearned || 0} hours learned`}
        accent="from-emerald-500 to-emerald-600"
      />
      <StatCard
        icon={<FiUsers />}
        label="Connections"
        value={totalConnections}
        sub={`${connections.mentors || 0} mentors · ${connections.learners || 0} learners`}
        accent="from-purple-500 to-purple-600"
      />
      <StatCard
        icon={<FiStar />}
        label="Rating"
        value={stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
        sub={`${stats.reviewCount || 0} reviews`}
        accent="from-accent to-amber-600"
      />
      <StatCard
        icon={<FiAward />}
        label="Points"
        value={stats.points || 0}
        accent="from-pink-500 to-rose-500"
      />
      <StatCard
        icon={<FiZap />}
        label="Learning Streak"
        value={`${stats.learningStreak || 0}d`}
        accent="from-cyan-500 to-blue-500"
      />
      <StatCard
        icon={<FiTrendingUp />}
        label="Teaching Streak"
        value={`${stats.teachingStreak || 0}d`}
        accent="from-orange-500 to-red-500"
      />
      {stats.profileViews !== undefined && (
        <StatCard
          icon={<FiEye />}
          label="Profile Views"
          value={stats.profileViews}
          accent="from-slate-500 to-slate-600"
        />
      )}
    </div>
  );
}
