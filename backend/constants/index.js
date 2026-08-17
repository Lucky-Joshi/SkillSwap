const CONNECTION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

const CONNECTION_TYPE = {
  MENTORSHIP: 'mentorship',
  PEER: 'peer',
};

const SESSION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const MEETING_MODE = {
  ONLINE: 'online',
  IN_PERSON: 'in_person',
  HYBRID: 'hybrid',
};

const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

const NOTIFICATION_TYPES = [
  'connection_request',
  'connection_accepted',
  'connection_declined',
  'session_booked',
  'session_confirmed',
  'session_completed',
  'session_cancelled',
  'review_received',
  'badge_earned',
  'message_received',
  'reminder',
];

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 900,
  VERY_LONG: 3600,
};

module.exports = {
  CONNECTION_STATUS,
  CONNECTION_TYPE,
  SESSION_STATUS,
  MEETING_MODE,
  USER_ROLES,
  NOTIFICATION_TYPES,
  PAGINATION,
  CACHE_TTL,
};
