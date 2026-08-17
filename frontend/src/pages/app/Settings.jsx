import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useDocumentTitle } from '../../hooks';
import { deleteMyAccount } from '../../services/users';
import { AVAILABILITY_OPTIONS, TRUST_BREAKDOWN, trustLabel } from '../../utils/constants';

export default function Settings() {
  useDocumentTitle('Settings');
  const { user, updateUser, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState('preferences');
  const [availability, setAvailability] = useState(user?.availability || 'anytime');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isTest = user?.isTest === true;
  const isDemo = user?.isDemo === true;
  const canSelfDelete = !isDemo && user?.role !== 'admin';

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 5000);
      toast('Click again to confirm permanent deletion.');
      return;
    }
    setDeleting(true);
    try {
      await deleteMyAccount();
      toast.success(isTest ? 'Temporary test account deleted. No other data was affected.' : 'Account deleted.');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  };

  const handleSaveAvailability = async () => {
    updateUser({ ...user, availability });
    toast.success('Preferences saved');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your preferences and account.</p>
      </div>

      <Tabs tabs={[{ value: 'preferences', label: 'Preferences' }, { value: 'account', label: 'Account' }]} active={tab} onChange={setTab} />

      {tab === 'preferences' && (
        <Card>
          <h2 className="mb-4 font-display font-bold">Appearance</h2>
          <div className="flex items-center justify-between rounded-xl border border-slate-200/60 p-4 dark:border-white/10">
            <div>
              <div className="text-sm font-semibold">Dark mode</div>
              <div className="text-xs text-slate-400">Easier on the eyes for late-night study sessions.</div>
            </div>
            <button
              onClick={toggle}
              className={`relative h-7 w-14 rounded-full transition ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'}`}
              aria-label="Toggle dark mode"
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${theme === 'dark' ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          <h2 className="mb-4 mt-8 font-display font-bold">Notification preferences</h2>
          <div className="space-y-3">
            {[
              ['Match requests', true],
              ['Messages', true],
              ['Session reminders', true],
              ['Weekly digest', false],
            ].map(([label, checked]) => (
              <label key={label} className="flex items-center justify-between rounded-xl border border-slate-200/60 p-4 dark:border-white/10">
                <span className="text-sm font-medium">{label}</span>
                <input type="checkbox" defaultChecked={checked} className="h-5 w-5 accent-brand-600" />
              </label>
            ))}
          </div>
        </Card>
      )}

      {tab === 'account' && (
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-display font-bold">Default availability</h2>
            <Select value={availability} onChange={(e) => setAvailability(e.target.value)}>
              {AVAILABILITY_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </Select>
            <div className="mt-4">
              <Input label="Email" defaultValue={user?.email} disabled />
              <p className="mt-1 text-xs text-slate-400">Contact support to change your email.</p>
            </div>
            <Button className="mt-5" onClick={handleSaveAvailability}>
              Save preferences
            </Button>
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display font-bold"><span title="Profile trust score">🛡️</span> Profile trust score</h2>
            <div className="flex items-center gap-4">
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white"
                style={{ background: `conic-gradient(#34d399 ${(user?.trustScore || 0) * 3.6}deg, rgba(148,163,184,0.25) 0deg)` }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900">{user?.trustScore || 0}</span>
              </span>
              <div className="text-sm">
                <div className={`font-semibold ${trustLabel(user?.trustScore || 0).color}`}>{trustLabel(user?.trustScore || 0).label}</div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {isTest
                    ? 'This is a temporary test account. Real activity raises trust; test data never does.'
                    : 'Complete your profile, verify your email and stay active to raise it.'}
                </p>
              </div>
            </div>
            <ul className="mt-4 grid gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
              {TRUST_BREAKDOWN.map((row) => (
                <li key={row.label} className="flex items-center justify-between">
                  <span>{row.label}</span>
                  <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">+{row.points}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-red-500/30">
            <h2 className="mb-2 font-display font-bold text-red-500">Danger zone</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isTest
                ? 'Deleting this temporary test account removes its profile, matches and chat history. It never affects real accounts.'
                : isDemo
                  ? 'The demo account is shared. Use the demo reset tool to restore it instead.'
                  : 'Deleting your account removes your profile, matches and chat history.'}
            </p>
            {canSelfDelete ? (
              <Button variant="danger" className="mt-4" onClick={handleDeleteAccount} loading={deleting}>
                {confirmDelete ? 'Click again to confirm' : isTest ? 'Delete test account' : 'Delete account'}
              </Button>
            ) : (
              <Button variant="danger" className="mt-4 opacity-60" disabled>
                {isDemo ? 'Demo account protected' : 'Admin accounts protected'}
              </Button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
