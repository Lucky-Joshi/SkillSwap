import { useState } from 'react';
import { FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { cx } from '../../utils/helpers';

function Toggle({ enabled, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-2">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={cx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
        )}
      >
        <span
          className={cx(
            'inline-block h-4 w-4 rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </label>
  );
}

export default function PrivacySettings({ privacy = {}, onSave }) {
  const [settings, setSettings] = useState({
    visibility: privacy.visibility || 'public',
    showEmail: privacy.showEmail ?? false,
    showCollege: privacy.showCollege ?? true,
    showContact: privacy.showContact ?? false,
    showAvailability: privacy.showAvailability ?? true,
    showPortfolioLinks: privacy.showPortfolioLinks ?? true,
  });

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <FiEye className="text-brand-500" />
        <h2 className="font-display text-lg font-extrabold text-slate-800 dark:text-white">
          Privacy Settings
        </h2>
      </div>

      {/* Visibility */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
          Profile Visibility
        </label>
        <div className="flex gap-2">
          {['public', 'members', 'private'].map((v) => (
            <button
              key={v}
              onClick={() => update('visibility', v)}
              className={cx(
                'flex-1 rounded-xl px-3 py-2 text-sm font-medium transition border',
                settings.visibility === v
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-brand-300'
              )}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        <Toggle
          label="Show email address"
          enabled={settings.showEmail}
          onChange={(v) => update('showEmail', v)}
        />
        <Toggle
          label="Show college/institution"
          enabled={settings.showCollege}
          onChange={(v) => update('showCollege', v)}
        />
        <Toggle
          label="Show contact info"
          enabled={settings.showContact}
          onChange={(v) => update('showContact', v)}
        />
        <Toggle
          label="Show availability"
          enabled={settings.showAvailability}
          onChange={(v) => update('showAvailability', v)}
        />
        <Toggle
          label="Show portfolio links"
          enabled={settings.showPortfolioLinks}
          onChange={(v) => update('showPortfolioLinks', v)}
        />
      </div>

      <div className="mt-4">
        <Button variant="primary" size="sm" onClick={() => onSave?.(settings)}>
          <FiSave /> Save Settings
        </Button>
      </div>
    </Card>
  );
}
