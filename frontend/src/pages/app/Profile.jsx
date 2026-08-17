import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FiEdit3, FiMessageSquare, FiCalendar, FiUserPlus, FiSettings,
  FiTrash2, FiUpload, FiLink,
} from 'react-icons/fi';
import Tabs from '../../components/ui/Tabs';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { Skeleton, CardSkeleton } from '../../components/ui/Skeleton';
import SkillPicker from '../../components/feature/SkillPicker';
import SessionForm from '../../components/feature/SessionForm';
import ProfileHeader from '../../components/profile/ProfileHeader';
import AboutSection from '../../components/profile/AboutSection';
import SkillShowcase from '../../components/profile/SkillShowcase';
import StatsGrid from '../../components/profile/StatsGrid';
import AIInsights from '../../components/profile/AIInsights';
import ConnectionStats from '../../components/profile/ConnectionStats';
import PortfolioSection from '../../components/profile/PortfolioSection';
import CertificateShowcase from '../../components/profile/CertificateShowcase';
import ReviewsSection from '../../components/profile/ReviewsSection';
import AchievementShowcase from '../../components/profile/AchievementShowcase';
import ActivityTimeline from '../../components/profile/ActivityTimeline';
import RoadmapProgress from '../../components/profile/RoadmapProgress';
import AvailabilitySection from '../../components/profile/AvailabilitySection';
import InterestsTags from '../../components/profile/InterestsTags';
import EducationTimeline from '../../components/profile/EducationTimeline';
import SocialLinksBar from '../../components/profile/SocialLinksBar';
import ProfileCompletion from '../../components/profile/ProfileCompletion';
import PrivacySettings from '../../components/profile/PrivacySettings';
import ProfileEditForm from '../../components/profile/ProfileEditForm';
import {
  getUser, getProfile, getPortfolio, uploadAvatar, uploadCoverPhoto,
  addSkill, removeUserSkill, updatePrivacy, deleteMyAccount,
} from '../../services/users';
import { getSkills } from '../../services/skills';
import { getUserReviews } from '../../services/reviews';
import { getAllBadges } from '../../services/badges';
import { requestMatch } from '../../services/matches';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <CardSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export default function Profile() {
  useDocumentTitle('Profile');
  const { id } = useParams();
  const { user: me, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [badges, setBadges] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState('teaching');
  const [sessionOpen, setSessionOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMe = !id || String(profile?.id || profile?._id) === String(me?.id);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = id || me.id;
      const promises = [
        isMe ? getProfile() : getUser(userId),
        getUserReviews(userId, { limit: 10 }),
        getAllBadges(),
      ];
      if (!isMe) promises.push(getPortfolio(userId));

      const results = await Promise.all(promises);
      const userRes = results[0];
      const reviewsRes = results[1];
      const badgesRes = results[2];
      const portfolioRes = !isMe ? results[3] : null;

      setProfile(userRes.user);
      setReviews(reviewsRes.data || []);
      setBadges(badgesRes.badges || []);
      if (portfolioRes) setPortfolio(portfolioRes);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, me?.id, isMe]);

  useEffect(() => {
    if (me?.id) load();
  }, [load, me?.id]);

  useEffect(() => {
    getSkills({ limit: 100 })
      .then((res) => setAllSkills(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      const name = isMe ? 'My Profile' : profile.name;
      document.title = `${name} · SkillSwap`;
    }
  }, [profile, isMe]);

  const handleAvatarChange = async (file) => {
    if (!file) return;
    try {
      const res = await uploadAvatar(file);
      setProfile(res.user);
      if (isMe) updateUser(res.user);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCoverChange = async (file) => {
    if (!file) return;
    try {
      const res = await uploadCoverPhoto(file);
      setProfile(res.user);
      if (isMe) updateUser(res.user);
      toast.success('Cover photo updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaved = (updatedUser) => {
    setProfile(updatedUser);
    if (isMe) updateUser(updatedUser);
  };

  const handleAddSkills = async (ids) => {
    try {
      for (const skillId of ids) {
        await addSkill({
          skillId,
          canTeach: pickerType === 'teaching',
          wantToLearn: pickerType === 'learning',
          level: 3,
        });
      }
      toast.success('Skills added');
      setPickerOpen(false);
      const userId = id || me.id;
      const userRes = isMe ? await getProfile() : await getUser(userId);
      setProfile(userRes.user);
      if (isMe) updateUser(userRes.user);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveSkill = async (skillEntry) => {
    try {
      await removeUserSkill(skillEntry._id || skillEntry.skillId);
      toast.success(`Removed ${skillEntry.name}`);
      const userId = id || me.id;
      const userRes = isMe ? await getProfile() : await getUser(userId);
      setProfile(userRes.user);
      if (isMe) updateUser(userRes.user);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEndorse = async (skillId, userId) => {
    try {
      const { endorseSkill } = await import('../../services/users');
      await endorseSkill({ skillId, userId });
      toast.success('Skill endorsed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConnect = async () => {
    try {
      await requestMatch({
        userId: profile.id || profile._id,
        mode: 'mentors',
        compatibilityScore: 0,
      });
      toast.success('Connection request sent!');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMessage = () => {
    navigate(`/app/chat?user=${profile.id || profile._id}`);
  };

  const handleSchedule = () => setSessionOpen(true);

  const handlePrivacySave = async (settings) => {
    try {
      const res = await updatePrivacy(settings);
      setProfile((prev) => ({ ...prev, privacy: res.privacy || settings }));
      toast.success('Privacy settings saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
      toast.success('Account deleted');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!profile) return <EmptyState icon="👤" title="User not found" description="This profile may have been removed." />;

  const earnedBadges = badges.filter((b) => b.earned || b.earnedAt);
  const teachSkills = profile.skills?.filter((s) => s.type === 'teaching' || s.canTeach) || [];
  const learnSkills = profile.skills?.filter((s) => s.type === 'learning' || s.isLearning) || [];
  const certificates = portfolio?.certificates || [];
  const educationHistory = portfolio?.educationHistory || profile.educationHistory || [];
  const activities = portfolio?.activities || profile.activities || [];
  const endorsements = portfolio?.endorsements || [];
  const connections = portfolio?.connections || profile.connections || {};
  const stats = portfolio?.stats || profile.stats || profile;
  const ratingBreakdown = portfolio?.ratingBreakdown || {};

  const relationship = profile.relationship || null;

  const mainTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'skills', label: `Skills (${profile.skills?.length || 0})` },
    { value: 'badges', label: `Badges (${earnedBadges.length})` },
    { value: 'reviews', label: `Reviews (${reviews.length})` },
    ...(isMe ? [{ value: 'settings', label: 'Settings' }] : []),
  ];

  return (
    <div className="space-y-6">
      <ProfileHeader
        user={profile}
        isMe={isMe}
        relationship={relationship}
        onEdit={() => setEditOpen(true)}
        onSave={() => setEditOpen(true)}
        onAvatarChange={handleAvatarChange}
        onCoverChange={handleCoverChange}
        onConnect={handleConnect}
        onMessage={handleMessage}
        onSchedule={handleSchedule}
      />

      {isMe && (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setEditOpen(true)}>
            <FiEdit3 className="h-4 w-4" /> Edit Profile
          </Button>
        </div>
      )}

      {!isMe && !relationship && (
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={handleConnect}>
            <FiUserPlus className="h-4 w-4" /> Connect
          </Button>
        </div>
      )}

      {!isMe && relationship?.status === 'pending' && (
        <Card className="!p-3">
          <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            Connection request pending
          </span>
        </Card>
      )}

      {!isMe && relationship?.status === 'accepted' && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleMessage}>
            <FiMessageSquare className="h-4 w-4" /> Message
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSchedule}>
            <FiCalendar className="h-4 w-4" /> Schedule
          </Button>
        </div>
      )}

      <Tabs tabs={mainTabs} active={tab} onChange={setTab} className="w-full sm:w-auto" />

      {tab === 'overview' && (
        <div className="space-y-6">
          <AboutSection user={profile} isMe={isMe} onEdit={() => setEditOpen(true)} />

          <div className="grid gap-6 lg:grid-cols-2">
            <SkillShowcase
              skills={profile.skills || []}
              isMe={isMe}
              onAddSkill={(type) => { setPickerType(type); setPickerOpen(true); }}
              onEndorse={handleEndorse}
              profileUserId={profile.id || profile._id}
            />
            <StatsGrid stats={stats} connections={connections} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AIInsights user={profile} stats={stats} />
            <ConnectionStats connections={connections} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PortfolioSection projects={profile.projects || []} isMe={isMe} />
            <CertificateShowcase certificates={certificates} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ReviewsSection reviews={reviews} stats={stats} ratingBreakdown={ratingBreakdown} />
            <AchievementShowcase badges={badges} totalPoints={profile.points || 0} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityTimeline activities={activities} />
            <RoadmapProgress user={profile} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AvailabilitySection user={profile} />
            <InterestsTags interests={profile.interests || []} isMe={isMe} onEdit={() => setEditOpen(true)} />
          </div>

          <EducationTimeline educationHistory={educationHistory} user={profile} isMe={isMe} />
          <SocialLinksBar user={profile} />

          {isMe && <ProfileCompletion user={profile} />}
        </div>
      )}

      {tab === 'skills' && (
        <div className="space-y-6">
          <SkillShowcase
            skills={profile.skills || []}
            isMe={isMe}
            onAddSkill={(type) => { setPickerType(type); setPickerOpen(true); }}
            onEndorse={handleEndorse}
            profileUserId={profile.id || profile._id}
          />
          {endorsements.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <h3 className="font-display text-base font-extrabold text-slate-800 dark:text-white mb-3">
                  Skill Endorsements
                </h3>
                <div className="space-y-2">
                  {endorsements.map((end, i) => (
                    <div key={end._id || i} className="glass rounded-xl p-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {end.skillName || end.name}
                      </span>
                      <span className="text-xs text-slate-400">{end.count || 0} endorsements</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === 'badges' && (
        <AchievementShowcase badges={badges} totalPoints={profile.points || 0} />
      )}

      {tab === 'reviews' && (
        <ReviewsSection reviews={reviews} stats={stats} ratingBreakdown={ratingBreakdown} />
      )}

      {tab === 'settings' && isMe && (
        <div className="space-y-6">
          <PrivacySettings
            privacy={profile.privacy || {}}
            onSave={handlePrivacySave}
          />
          <Card>
            <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white mb-4">
              Account
            </h2>
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
              <div>
                <div className="text-sm font-semibold text-red-700 dark:text-red-300">Delete Account</div>
                <div className="text-xs text-red-500 dark:text-red-400">
                  Permanently delete your account and all associated data.
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <FiTrash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ProfileEditForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={profile}
        onSaved={handleSaved}
      />

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title={`Add ${pickerType} skills`} size="lg">
        <SkillPicker
          skills={allSkills}
          selected={[]}
          onChange={(ids) => { if (ids.length) handleAddSkills(ids); }}
        />
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setPickerOpen(false)}>Close</Button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account" size="sm">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Are you sure you want to delete your account? This action cannot be undone. All your data, skills, sessions, and connections will be permanently removed.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDeleteAccount}>
            <FiTrash2 className="h-4 w-4" /> Delete Account
          </Button>
        </div>
      </Modal>

      <SessionForm open={sessionOpen} onClose={() => setSessionOpen(false)} otherUser={profile} />
    </div>
  );
}
