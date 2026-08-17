import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEdit2, FiMessageSquare, FiCalendar, FiUserPlus, FiCheck,
  FiGithub, FiLinkedin, FiGlobe, FiCamera, FiEye, FiClock,
} from 'react-icons/fi';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Tag from '../ui/Tag';
import Button from '../ui/Button';
import RatingStars from '../ui/RatingStars';
import ScoreRing from '../ui/ScoreRing';
import { levelLabel } from '../../utils/helpers';
import { trustLabel } from '../../utils/constants';

const POINTS_PER_LEVEL = 200;

function getLevel(points = 0) {
  return Math.min(5, Math.floor(points / POINTS_PER_LEVEL) + 1);
}

export default function ProfileHeader({
  user = {},
  isMe = false,
  relationship = null,
  editing = false,
  onEdit,
  onSave,
  onAvatarChange,
  onCoverChange,
  onConnect,
  onMessage,
  onSchedule,
}) {
  const coverRef = useRef(null);
  const avatarRef = useRef(null);
  const [coverHover, setCoverHover] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);

  if (!user?._id) return null;

  const level = getLevel(user.points);
  const trust = trustLabel(user.trustScore || 0);
  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const socialLinks = [
    { key: 'github', icon: <FiGithub />, url: user.github },
    { key: 'linkedin', icon: <FiLinkedin />, url: user.linkedin },
    { key: 'portfolio', icon: <FiGlobe />, url: user.portfolioUrl },
  ].filter((l) => l.url);

  const relType = relationship?.status;
  const isConnected = relType === 'accepted';
  const isPending = relType === 'pending';
  const isRequester = relationship?.requester === user._id;

  return (
    <Card className="overflow-hidden !p-0">
      <input
        ref={coverRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onCoverChange?.(e.target.files?.[0])}
      />
      <input
        ref={avatarRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onAvatarChange?.(e.target.files?.[0])}
      />

      {/* Cover */}
      <div
        className="relative h-48 sm:h-56 w-full cursor-pointer"
        onMouseEnter={() => setCoverHover(true)}
        onMouseLeave={() => setCoverHover(false)}
        onClick={() => isMe && coverRef.current?.click()}
        style={
          user.coverPhoto
            ? { backgroundImage: `url(${user.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, #6366f1 0%, #f59e0b 100%)' }
        }
      >
        {isMe && coverHover && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <FiCamera /> Change Cover
            </span>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        {/* Avatar row */}
        <div className="relative -mt-16 mb-4 flex items-end gap-4">
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            onClick={(e) => {
              e.stopPropagation();
              if (isMe) avatarRef.current?.click();
            }}
          >
            <div className="ring-4 ring-white dark:ring-slate-800 rounded-full">
              <Avatar src={user.avatar} name={user.name} size="xl" />
            </div>
            {isMe && avatarHover && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <FiCamera className="text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-extrabold text-slate-800 dark:text-white truncate">
                {user.name}
              </h1>
              {user.isVerified && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                  <FiCheck className="h-3 w-3" />
                </span>
              )}
              {user.role && (
                <Tag tone={user.role === 'mentor' ? 'brand' : user.role === 'learner' ? 'green' : 'slate'}>
                  {user.role}
                </Tag>
              )}
            </div>
            {user.introduction && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 italic max-w-lg">
                {user.introduction}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="glass rounded-xl p-3 text-center">
            <div className="font-display text-lg font-extrabold">
              {user.rating > 0 ? <RatingStars rating={user.rating} count={user.reviewCount} /> : '—'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rating</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="font-display text-lg font-extrabold text-brand-600 dark:text-brand-400">
              Lv.{level}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{levelLabel(level)}</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="font-display text-lg font-extrabold flex items-center justify-center gap-1">
              <FiClock className="text-accent" />
              {user.teachingStreak || 0}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Day Streak</div>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="font-display text-lg font-extrabold">{user.sessionsCompleted || 0}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sessions</div>
          </div>
        </div>

        {/* Academic info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {user.institution && <Tag tone="slate">{user.institution}</Tag>}
          {user.department && <Tag tone="brand">{user.department}</Tag>}
          {user.year && <Tag tone="amber">Year {user.year}</Tag>}
          {user.qualification && <Tag tone="purple">{user.qualification}</Tag>}
          {user.availability && <Tag tone="green">{user.availability}</Tag>}
        </div>

        {/* Trust + Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <ScoreRing score={user.trustScore || 0} size={56} />
            <span className={`text-sm font-medium ${trust.color}`}>{trust.label}</span>
          </div>

          <div className="flex items-center gap-2">
            {isMe ? (
              <Button variant={editing ? 'primary' : 'secondary'} size="sm" onClick={editing ? onSave : onEdit}>
                {editing ? <FiCheck /> : <FiEdit2 />}
                {editing ? 'Save' : 'Edit Profile'}
              </Button>
            ) : (
              <>
                {!isPending && !isConnected && (
                  <Button variant="primary" size="sm" onClick={onConnect}>
                    <FiUserPlus /> Connect
                  </Button>
                )}
                {isPending && (
                  <Button variant="secondary" size="sm" disabled>
                    Pending
                  </Button>
                )}
                {isConnected && (
                  <>
                    <Button variant="ghost" size="sm" onClick={onMessage}>
                      <FiMessageSquare /> Message
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onSchedule}>
                      <FiCalendar /> Schedule
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-3 mb-3">
            {socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-brand-500 hover:text-white dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-brand-500"
              >
                {link.icon}
              </a>
            ))}
          </div>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>Joined {joinedDate}</span>
          {isMe && user.profileViews !== undefined && (
            <span className="flex items-center gap-1">
              <FiEye /> {user.profileViews} views
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
