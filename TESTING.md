# SkillSwap — Testing Guide

## Prerequisites
- All three services running (backend, AI service, frontend)
- MongoDB connected
- Test admin account created

## Manual Testing Checklist

### Authentication
- [ ] Register with valid college email
- [ ] Verify email with 6-digit code
- [ ] Login with correct credentials
- [ ] Login fails with wrong password
- [ ] Forgot password flow
- [ ] Reset password via email link
- [ ] Admin redirect on login

### Profile
- [ ] Complete profile (bio, department, year)
- [ ] Add/remove skills
- [ ] Upload avatar and cover photo
- [ ] Upload resume (PDF/DOCX/TXT)
- [ ] Update privacy settings
- [ ] Portfolio section

### Discovery & Recommendations
- [ ] Browse students with filters
- [ ] AI recommendations load
- [ ] Compatibility scores display
- [ ] Search by skill, department, year

### Connections
- [ ] Send mentorship request
- [ ] Send peer learning request
- [ ] Accept/reject requests
- [ ] Cancel active connection
- [ ] View relationships dashboard

### Chat
- [ ] Send/receive messages in real time
- [ ] Typing indicators
- [ ] Message read receipts
- [ ] Chat locked before connection accepted
- [ ] Conversation search

### Sessions
- [ ] Schedule a session
- [ ] Confirm session
- [ ] Complete session with rating
- [ ] Cancel session
- [ ] Calendar view
- [ ] AI next-steps after completion

### Badges & Certificates
- [ ] Earn badges (first skill, first match, session master)
- [ ] View earned certificates
- [ ] Certificate ID format (SS-XXXXXX)

### Leaderboard
- [ ] Points ranking displays
- [ ] Admin users excluded

### Notifications
- [ ] In-app notifications for connection requests
- [ ] Session reminders
- [ ] Badge earned notifications
- [ ] Real-time via Socket.IO

### Admin
- [ ] Admin dashboard stats
- [ ] User management (search, suspend, delete)
- [ ] Institution CRUD + merge
- [ ] Skill CRUD + merge
- [ ] Session monitoring
- [ ] Report moderation
- [ ] AI monitor status
- [ ] System health check
- [ ] Analytics charts

### AI Service
- [ ] Health check endpoint
- [ ] Roadmap generation
- [ ] Skill similarity check
- [ ] Skill graph
- [ ] Related skills
- [ ] Resume parsing

## Running Tests

### Backend Health Check
curl http://localhost:5000/api/health

### AI Service Health Check
curl http://localhost:8000/health

### Generate Roadmap
curl -X POST http://localhost:8000/roadmap -H "Content-Type: application/json" -d '{"goal":"Become a Data Scientist"}'

### Skill Similarity
curl -X POST http://localhost:8000/skills/similarity -H "Content-Type: application/json" -d '{"skill_a":"React","skill_b":"ReactJS"}'
