# SkillSwap — User Flow

## 1. Registration Flow

```
Landing Page
    │
    ▼
Click "Sign Up"
    │
    ▼
┌─────────────────┐
│  Enter Details   │
│  - Name          │
│  - Email         │
│  - Password      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Email Verify    │
│  (6-digit code)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Profile Setup   │
│  - Institution   │
│  - Skills        │
│  - Bio           │
│  - Avatar        │
└────────┬────────┘
         │
         ▼
    Dashboard
```

## 2. Login & Role-based Redirect

```
Login Page
    │
    ▼
┌─────────────────┐
│  Email + Pass    │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Admin? ├──── Yes ──→  /admin/dashboard
    └───┬────┘
        │ No
        ▼
   /dashboard
```

## 3. Discovery & Matching Flow

```
Dashboard
    │
    ▼
┌──────────────────┐
│  Discover Page    │
│  (AI-ranked list) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Apply Filters    │
│  - Skill          │
│  - Institution    │
│  - Learning style │
│  - Availability   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  View Profile     │
│  - Compatibility  │
│    score (6 legs) │
│  - Skills, Bio    │
│  - Reviews        │
└────────┬─────────┘
         │
         ▼
   Send Request
```

## 4. Connection Request Flow

```
View Profile
    │
    ▼
┌──────────────────────┐
│  Choose Request Type  │
│  - Mentorship         │
│  - Peer Learning      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Receiver Notification │
│  (in-app + real-time)  │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
  Accept      Reject
     │           │
     ▼           ▼
┌─────────┐  Dismiss
│ Connected │
│  → Chat   │
│  → Session│
└─────────┘
```

## 5. Chat Flow

```
Connected Users
    │
    ▼
┌──────────────────┐
│  Open Chat        │
│  (Socket.IO)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Real-time msgs   │
│  - Text           │
│  - Timestamps     │
│  - Read status    │
└────────┬─────────┘
         │
         ▼
  Schedule Session
  (from chat thread)
```

## 6. Session Lifecycle Flow

```
┌──────────┐    ┌────────────┐    ┌─────────────┐    ┌───────────┐
│ Scheduled │ →  │ Confirmed  │ →  │ In Progress │ →  │ Completed │
└──────────┘    └────────────┘    └─────────────┘    └─────┬─────┘
                                                           │
                                                    ┌──────┴──────┐
                                                    │  Rate &     │
                                                    │  Review     │
                                                    │  (1-5 stars)│
                                                    └──────┬──────┘
                                                           │
                                                    ┌──────┴──────┐
                                                    │  Earn Badge │
                                                    │  (if elig.) │
                                                    └─────────────┘
```

## 7. Badge & Certificate Flow

```
Complete Session
    │
    ▼
┌──────────────────┐
│  Criteria Check   │
│  - Hours taught   │
│  - Sessions count │
│  - Rating thresh. │
└────────┬─────────┘
         │
     ┌───┴───┐
     │       │
  Eligible  Not Eligible
     │       │
     ▼       ▼
┌─────────┐ Continue
│ Badge / │ earning
│ Cert    │
│ awarded │
└────┬────┘
     │
     ▼
┌──────────────┐
│  Public on    │
│  profile      │
│  Download PDF │
└──────────────┘
```

## 8. Profile Completion Flow

```
New Account
    │
    ▼
┌──────────────────┐
│  Profile Score:   │
│  30%              │
└────────┬─────────┘
         │
   Prompted at
   each login
         │
   ┌─────┼─────┬─────┬─────┐
   │     │     │     │     │
 Add  Add   Add   Add   Add
 Bio  Skills Portfolio Social Avatar
   │     │     │     │     │
   └─────┴─────┴─────┴─────┘
         │
         ▼
┌──────────────────┐
│  Profile Score:   │
│  100%             │
│  + Completion     │
│    Badge          │
└──────────────────┘
```
