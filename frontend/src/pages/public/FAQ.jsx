import HeroSection from '../../components/public/HeroSection';
import FAQItem from '../../components/public/FAQItem';
import CTASection from '../../components/public/CTASection';
import { ROUTES } from '../../utils/routes';

const FAQS = [
  {
    q: 'What is SkillSwap?',
    a: 'SkillSwap is an AI-powered peer learning platform for college students. It matches students who can teach skills with students who want to learn them — using semantic matching, not just keyword search.',
  },
  {
    q: 'How does the AI matching work?',
    a: 'Our recommendation engine computes a compatibility score from six signals: skill match (40%), mutual learning interest (20%), availability (15%), teaching rating (10%), experience level (10%), and department similarity (5%). We use SBERT sentence-transformers to embed skill names, so "ReactJS" and "React" are understood as the same skill.',
  },
  {
    q: 'Is SkillSwap free?',
    a: 'Yes, SkillSwap is completely free for students. There are no premium tiers, no paywalls. The platform is designed to be accessible to every college student.',
  },
  {
    q: 'Can I be both a mentor and a learner?',
    a: 'Absolutely. You can teach skills you know (e.g., React, DSA) while learning skills you want (e.g., Machine Learning, Python). The platform supports both mentorship and peer learning modes.',
  },
  {
    q: 'How are sessions conducted?',
    a: 'Sessions can be online (Google Meet, Zoom, Teams, or custom URL) or offline (campus, classroom, library, lab). You schedule a session with your mentor/peer, confirm it, and then complete it. After completion, you earn points and can leave a review.',
  },
  {
    q: 'What are badges and certificates?',
    a: 'Badges are achievements unlocked by completing actions — adding skills, finishing sessions, receiving reviews. There are 8+ badges (First Steps, Profile Pro, Session Master, Mentor Star, etc.). Certificates are unique IDs (SS-XXXXXX) generated when you complete a session.',
  },
  {
    q: 'How is my trust score calculated?',
    a: 'Your trust score (0–100) is computed from: verified email (30 pts), complete academic details (10 pts), bio (10 pts), avatar (5 pts), linked profiles (5 pts), skills (15 pts), received reviews (10 pts), completed sessions (10 pts), accepted matches (5 pts), and earned badges (5 pts).',
  },
  {
    q: 'What happens after I complete a session?',
    a: 'When you mark a session as complete, several things happen automatically: you earn points, the system checks for new badges, a certificate is generated, the AI suggests next learning topics, and your trust score is updated. You can also leave a review for your mentor/peer.',
  },
  {
    q: 'Is my data safe?',
    a: 'SkillSwap uses JWT authentication, bcrypt password hashing, and MongoDB Atlas with TLS. Your password is never exposed in API responses. The platform follows security best practices including rate limiting, input validation, and CORS restrictions.',
  },
];

export default function FAQ() {
  return (
    <>
      <HeroSection
        badge="FAQ"
        title="Frequently asked"
        titleHighlight="questions"
        description="Everything you need to know about SkillSwap. Can't find an answer? Contact us."
        primaryLabel="Contact us"
        primaryTo={ROUTES.CONTACT}
      />

      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl">
        <CTASection
          title="Still have questions?"
          description="Reach out to us and we'll get back to you within 24 hours."
          primaryLabel="Contact us"
          primaryTo={ROUTES.CONTACT}
          secondaryLabel="Get started"
          secondaryTo={ROUTES.REGISTER}
        />
      </div>
    </>
  );
}
