import { useState } from 'react';
import Card from '../../components/ui/Card';
import { useDocumentTitle } from '../../hooks';

const placeholders = [
  { label: 'Platform Name', type: 'text', value: '' },
  { label: 'Contact Email', type: 'email', value: '' },
  { label: 'Maintenance Mode', type: 'toggle', value: false },
  { label: 'Registration Open', type: 'toggle', value: true },
  { label: 'AI Service Enabled', type: 'toggle', value: true },
];

export default function AdminSettings() {
  useDocumentTitle('Admin · Settings');
  const [toggles, setToggles] = useState(
    Object.fromEntries(placeholders.filter((p) => p.type === 'toggle').map((p) => [p.label, p.value]))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Admin Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Platform configuration options will be available here in a future update.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 font-display font-bold">Platform Settings</h2>
        <div className="space-y-4">
          {placeholders.map((p) => (
            <div key={p.label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/60 p-4 dark:border-white/10">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{p.label}</span>
              {p.type === 'toggle' ? (
                <button
                  disabled
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    toggles[p.label] ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'
                  } cursor-not-allowed opacity-60`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      toggles[p.label] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              ) : (
                <input
                  disabled
                  type={p.type}
                  defaultValue={p.value}
                  className="w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 opacity-60 dark:border-white/10 dark:bg-white/5"
                />
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          These settings are read-only placeholders. Full configuration will be available in a future release.
        </p>
      </Card>
    </div>
  );
}
