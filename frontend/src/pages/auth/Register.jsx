import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import SkillPicker from '../../components/feature/SkillPicker';
import ProgressBar from '../../components/ui/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks';
import { getSkills } from '../../services/skills';
import { addSkill } from '../../services/users';
import { getInstitutions } from '../../services/institutions';
import { YEAR_OPTIONS, AVAILABILITY_OPTIONS, QUALIFICATION_OPTIONS, DEPARTMENT_OPTIONS } from '../../utils/constants';

const STEPS = ['Account', 'Profile', 'Skills'];

const showTestAccounts = import.meta.env.DEV || import.meta.env.VITE_TEST_ACCOUNTS === 'true';

export default function Register() {
  useDocumentTitle('Create account');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [teach, setTeach] = useState([]);
  const [learn, setLearn] = useState([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  useEffect(() => {
    getSkills({ limit: 100 })
      .then((res) => setSkills(res.data))
      .catch(() => setSkills([]));
    getInstitutions()
      .then((res) => setInstitutions(res.institutions || []))
      .catch(() => setInstitutions([]));
  }, []);

  const saveSkills = async (userId) => {
    for (const skillId of teach) {
      await addSkill({ skillId, canTeach: true, wantToLearn: false, level: 4 });
    }
    for (const skillId of learn) {
      await addSkill({ skillId, canTeach: false, wantToLearn: true, level: 3 });
    }
  };

  const onSubmit = async (values) => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    try {
      const res = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        college: values.college,
        qualification: values.qualification,
        department: values.department,
        year: values.year,
        bio: values.bio,
        availability: values.availability,
        isTest: values.isTest || undefined,
      });
      if (teach.length || learn.length) {
        await saveSkills(res.user.id);
      }
      if (res.user?.isTest) {
        toast.success('Temporary test account created. It can be deleted anytime.');
      } else {
        toast.success('Account created! Your AI matches are ready.');
      }
      navigate('/app/recommendations');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const step2Valid = step === 2 && (teach.length > 0 || learn.length > 0);

  return (
    <AuthLayout
      title={step === 0 ? 'Create your account' : step === 1 ? 'Tell us about yourself' : 'Pick your skills'}
      subtitle={step === 2 ? 'Select what you can teach and want to learn — the AI does the rest.' : ''}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{STEPS[step]}</span>
          <span>Step {step + 1} of 3</span>
        </div>
        <ProgressBar value={((step + 1) / 3) * 100} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 0 && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <Input label="Full name" placeholder="e.g. Ananya Gupta" {...register('name', { required: 'Name is required' })} error={errors.name?.message} />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
              error={errors.email?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="Min 8 characters"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                error={errors.password?.message}
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat password"
                {...register('confirm', {
                  required: 'Confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
                error={errors.confirm?.message}
              />
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <label className="label">School / College / University</label>
              <input
                className="input"
                list="institutions"
                placeholder="Search or type your institution"
                {...register('college', { required: 'Institution is required' })}
              />
              <datalist id="institutions">
                {institutions.map((inst) => (
                  <option key={inst._id} value={inst.name}>
                    {[inst.city, inst.country].filter(Boolean).join(', ')}
                  </option>
                ))}
              </datalist>
              {errors.college && <p className="mt-1 text-xs text-red-500">{errors.college.message}</p>}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Can't find your institution? Just type the name — it is saved as-is.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Qualification" {...register('qualification', { required: 'Qualification is required' })} error={errors.qualification?.message}>
                <option value="">Select…</option>
                {QUALIFICATION_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
              </Select>
              <Select label="Department / Stream" {...register('department', { required: 'Department is required' })} error={errors.department?.message}>
                <option value="">Select…</option>
                {DEPARTMENT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Current year / class" {...register('year', { required: 'Year is required' })} error={errors.year?.message}>
                <option value="">Select…</option>
                {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y === 'Graduate' ? y : `Year ${y}`}</option>)}
              </Select>
              <Select label="Availability" {...register('availability')}>
                <option value="">Select…</option>
                {AVAILABILITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </Select>
            </div>

            <TextArea label="Short bio (optional)" placeholder="What are you passionate about?" {...register('bio')} />

            {showTestAccounts && (
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-dashed border-amber-400/40 bg-amber-50/50 p-3 dark:bg-amber-400/5">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-amber-500" {...register('isTest')} />
                <span className="text-sm text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">This is a temporary test account</span>
                  <span className="block text-xs opacity-80">Marked as test data — an admin (or you, in Settings) can delete it anytime without affecting other accounts.</span>
                </span>
              </label>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"><FiCheck className="h-3.5 w-3.5" /></span>
                I can teach
              </div>
              <SkillPicker skills={skills} selected={teach} onChange={setTeach} />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-amber-600 dark:text-amber-400"><FiCheck className="h-3.5 w-3.5" /></span>
                I want to learn
              </div>
              <SkillPicker skills={skills} selected={learn} onChange={setLearn} />
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between pt-2">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
              <FiArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" loading={loading} disabled={step === 2 && !step2Valid}>
            {step < 2 ? <>Continue <FiArrowRight className="h-4 w-4" /></> : 'Create account'}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">Log in</Link>
      </p>
    </AuthLayout>
  );
}
