import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiUser, FiMessageSquare, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import HeroSection from '../../components/public/HeroSection';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Button from '../../components/ui/Button';
import { ROUTES } from '../../utils/routes';

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      <HeroSection
        badge="Get in touch"
        title="We'd love to"
        titleHighlight="hear from you"
        description="Have a question, feedback, or want to collaborate? Send us a message."
      />

      <section className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="glass rounded-3xl p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              name="name"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mt-4">
            <Input
              label="Subject"
              name="subject"
              placeholder="How can we help?"
              value={form.subject}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mt-4">
            <TextArea
              label="Message"
              name="message"
              placeholder="Tell us more..."
              rows={5}
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mt-6">
            <Button type="submit" className="w-full" loading={loading}>
              <FiSend className="h-4 w-4" /> Send message
            </Button>
          </div>
        </motion.form>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: FiMail, label: 'Email', value: 'developer.lucky.joshi@gmail.com' },
            { icon: FiUser, label: 'GitHub', value: 'github.com/Lucky-Joshi/SkillSwap' },
            { icon: FiMessageSquare, label: 'Response time', value: '< 24 hours' },
          ].map((item) => (
            <div key={item.label} className="glass rounded-2xl p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-semibold text-slate-400">{item.label}</div>
              <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{item.value}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
