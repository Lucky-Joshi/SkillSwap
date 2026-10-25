const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');


const QUALIFICATION_VALUES = {
  tenth_grade: '10th Grade', twelfth_grade: '12th Grade', b_tech: 'B.Tech', b_e: 'B.E',
  b_sc: 'B.Sc', bca: 'BCA', mca: 'MCA', m_tech: 'M.Tech', m_sc: 'M.Sc', bba: 'BBA',
  mba: 'MBA', ba: 'BA', ma: 'MA', ph_d: 'Ph.D',
};
const YEAR_VALUES = { year1: '1', year2: '2', year3: '3', year4: '4', year5: '5', graduate: 'Graduate' };

const publicUserPrisma = async (userId, viewerId = null) => {
  const user = await prisma.user.findUnique({
    where: { id: typeof userId === 'object' ? userId.id : userId },
    include: {
      userSkills: {
        include: {
          skill: true,
        },
      },
      userBadges: {
        include: {
          badge: true,
        },
      },
    },
  });
  if (!user) return null;
  const privacy = user.privacy && typeof user.privacy === 'object' ? user.privacy : {};
  const isOwner = viewerId != null && String(viewerId) === user.id;
  const visibility = privacy.profileVisibility || privacy.visibility || user.profileVisibility || 'public';
  if (!isOwner && visibility === 'private') throw new AppError('This profile is private.', 403);
  const { password, ...rest } = user;
  if (!isOwner && privacy.showEmail !== true) delete rest.email;
  if (!isOwner && privacy.showCollege === false) delete rest.college;
  if (!isOwner && privacy.showAvailability === false) {
    delete rest.availability;
    delete rest.availabilitySchedule;
  }
  if (!isOwner && privacy.showContact === false) {
    delete rest.timezone;
    delete rest.location;
  }
  if (!isOwner && privacy.showPortfolioLinks === false) {
    delete rest.github;
    delete rest.linkedin;
    delete rest.portfolio;
    delete rest.socialLinks;
  }
  return {
    ...rest,
    _id: rest.id,
    qualification: QUALIFICATION_VALUES[rest.qualification] || rest.qualification,
    year: YEAR_VALUES[rest.year] || rest.year,
    userSkills: rest.userSkills.map((row) => ({ ...row, _id: row.id, skillId: { ...row.skill, _id: row.skill.id } })),
    userBadges: rest.userBadges.map((row) => ({ ...row, _id: row.id, badgeId: { ...row.badge, _id: row.badge.id } })),
    canTeach: rest.userSkills.filter((row) => row.canTeach).map((row) => row.skill.name),
    wantToLearn: rest.userSkills.filter((row) => row.wantToLearn).map((row) => row.skill.name),
    skills: rest.userSkills.map((row) => ({
      id: row.id,
      skillId: row.skillId,
      name: row.skill.name,
      category: row.skill.category.replaceAll('_', '-'),
      icon: row.skill.icon,
      level: row.level,
      canTeach: row.canTeach,
      wantToLearn: row.wantToLearn,
      verified: row.verified,
    })),
    badgeCount: rest.userBadges.length,
    stats: {
      teachCount: rest.userSkills.filter((row) => row.canTeach).length,
      learnCount: rest.userSkills.filter((row) => row.wantToLearn).length,
      totalSkills: rest.userSkills.length,
    },
  };
};

module.exports = { publicUserPrisma };
