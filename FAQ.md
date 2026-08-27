# SkillSwap — Frequently Asked Questions

### What is SkillSwap?
SkillSwap is a full-stack, AI-powered peer learning platform that helps college students connect with one another to teach and learn skills. It combines interest-based matching, AI recommendations, mentorship connections, scheduled learning sessions, gamified badges, and an admin portal for institution-wide oversight.

### How does AI matching work?
The AI service (built with Python FastAPI, SBERT, TF-IDF, spaCy, and NetworkX) analyzes the skills you list on your profile, the skills others list, and the goals you set. It builds a skill graph and computes semantic similarity between profiles to suggest the most relevant peers to learn from or teach.

### What is the compatibility score?
The compatibility score is a numeric value (displayed on recommendation and discovery cards) that reflects how well two users' skills, goals, departments, and learning interests align. It is computed by the AI service using sentence embeddings and skill-graph proximity.

### Can students from different colleges connect?
SkillSwap is organized around verified college/institution accounts, but yes — students from different colleges can discover and connect with one another through the discovery and recommendation features, provided both accounts are verified.

### What are mentorship vs peer learning connections?
A **mentorship connection** is formed when one user (the mentor) agrees to guide another (the mentee) in a particular skill. A **peer learning connection** is a two-way arrangement where both users learn from and teach each other. Requests for either type can be sent, accepted, or rejected.

### How do sessions work?
Once a connection is accepted, users can schedule a learning session with a date, time, and topic. The other party confirms the session. After it occurs, either participant can mark it complete and leave a rating. A calendar view helps track upcoming sessions, and the AI can suggest next steps after completion.

### What are badges and certificates?
Badges are earned by reaching milestones such as adding your first skill, making your first match, or completing multiple sessions (e.g., "Session Master"). Certificates are awarded for completed learning paths and carry a unique Certificate ID in the format `SS-XXXXXX`.

### Is my data private?
Yes. SkillSwap stores your data in MongoDB with encrypted passwords (bcrypt hashing) and JWT-based authentication. You control privacy settings on your profile, including what parts of your profile are visible to others. See our Privacy Policy for full details.

### How does the admin portal work?
Admins log in and are redirected to a dedicated dashboard showing platform statistics, user management (search, suspend, delete), institution and skill CRUD with merge support, session monitoring, report moderation, AI service status, system health checks, and analytics charts. Admin accounts are excluded from public leaderboards.

### What technologies does SkillSwap use?
- **Frontend**: React 18, Vite, Tailwind CSS v3.4
- **Backend**: Node.js, Express, Mongoose, JWT
- **Database**: MongoDB 7
- **AI Service**: Python FastAPI, SBERT, TF-IDF, spaCy, NetworkX
- **Infrastructure**: Docker Compose (MongoDB, backend, AI service); services run on ports 5173 (frontend), 5000 (backend), 8000 (AI)

### Can I use SkillSwap on mobile?
The frontend is a responsive web app built with React and Tailwind CSS, so it works in mobile browsers. While there is no native mobile app yet, the layout adapts to smaller screens.

### How do I reset my password?
On the login screen, click **Forgot password**. Enter your registered email to receive a reset link, then follow the link to set a new password. You can also use the in-app flow with a verification code.

### What happens if the AI service is down?
The backend is designed with a fallback so core functionality (auth, profiles, connections, chat, sessions) continues to work even if the AI service is unavailable. Recommendations and similarity scores may be limited or absent until the service recovers. Admins can monitor AI status from the admin portal.

### How are reviews and ratings calculated?
After a session is completed, participants rate each other (typically on a 1–5 scale). Ratings contribute to a user's reputation and points, which feed the leaderboard and recommendation ranking. Aggregated ratings are displayed on profiles.

### Can I delete my account?
Yes. You can request account deletion from your account settings, which removes your personal data in accordance with our Privacy Policy. Admins may also delete or suspend accounts that violate terms. Note that some anonymized activity records may be retained as required.

### How do I contact support?
For help, reach out through the in-app support channel or contact the team via the email listed in our Privacy Policy and Terms & Conditions.
