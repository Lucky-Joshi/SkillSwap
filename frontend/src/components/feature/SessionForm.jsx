import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiVideo, FiMapPin, FiSend } from 'react-icons/fi';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { createSession } from '../../services/sessions';
import { MEETING_TYPE_OPTIONS, LOCATION_TYPE_OPTIONS, DURATION_OPTIONS } from '../../utils/constants';

export default function SessionForm({ open, onClose, otherUser, onCreated, preset }) {
  const [mode, setMode] = useState('online');
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      topic: '',
      date: '',
      startTime: '16:00',
      duration: '60',
      meetingType: 'googleMeet',
      meetingLink: '',
      locationType: 'campus',
      location: '',
      description: '',
    },
  });

  const currentMode = watch('meetingMode') || mode;

  useEffect(() => {
    if (open) {
      reset({
        topic: preset?.topic || '',
        description: preset?.description || '',
        date: '',
        startTime: '16:00',
        duration: preset?.duration || '60',
        meetingMode: mode,
        meetingType: 'googleMeet',
        meetingLink: '',
        locationType: 'campus',
        location: '',
      });
    }
  }, [open, reset, preset]);

  useEffect(() => {
    setMode(currentMode);
  }, [currentMode]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createSession({
        otherUserId: otherUser.id,
        topic: values.topic,
        description: values.description,
        date: new Date(values.date).toISOString(),
        startTime: values.startTime,
        duration: parseInt(values.duration, 10),
        meetingMode: values.meetingMode,
        meetingType: values.meetingMode === 'online' ? values.meetingType : undefined,
        meetingLink: values.meetingMode === 'online' ? values.meetingLink : undefined,
        locationType: values.meetingMode === 'offline' ? values.locationType : undefined,
        location: values.meetingMode === 'offline' ? values.location : undefined,
      });
      toast.success('Session scheduled! The other person will confirm it.');
      onClose();
      onCreated?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Schedule session with ${otherUser?.name || 'mentor'}`} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Topic"
          placeholder="e.g. React hooks deep dive"
          {...register('topic', { required: 'Topic is required' })}
          error={errors.topic?.message}
        />
        <TextArea label="Description" placeholder="What should we cover?" {...register('description')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Date"
            type="date"
            {...register('date', { required: 'Date is required' })}
            error={errors.date?.message}
          />
          <Input
            label="Time"
            type="time"
            {...register('startTime', { required: 'Time is required' })}
            error={errors.startTime?.message}
          />
          <Select label="Duration" {...register('duration')}>
            {DURATION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select>
        </div>

        {/* Meeting mode */}
        <div>
          <label className="mb-2 block text-sm font-medium">Meeting mode</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('meetingMode', 'online')}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                currentMode === 'online'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 text-slate-500 hover:border-brand-300 dark:border-white/10 dark:text-slate-400'
              }`}
            >
              <FiVideo className="h-4 w-4" /> Online
            </button>
            <button
              type="button"
              onClick={() => setValue('meetingMode', 'offline')}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                currentMode === 'offline'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 text-slate-500 hover:border-brand-300 dark:border-white/10 dark:text-slate-400'
              }`}
            >
              <FiMapPin className="h-4 w-4" /> Offline
            </button>
          </div>
        </div>

        {currentMode === 'online' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Platform" {...register('meetingType')}>
              {MEETING_TYPE_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
            <Input
              label="Meeting link"
              type="url"
              placeholder="https://meet.google.com/…"
              {...register('meetingLink', { required: 'A meeting link is required for online sessions' })}
              error={errors.meetingLink?.message}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Location type" {...register('locationType')}>
              {LOCATION_TYPE_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </Select>
            <Input
              label="Location details"
              placeholder="e.g. Block B, Room 204"
              {...register('location')}
            />
          </div>
        )}

        <Button type="submit" className="w-full" loading={submitting}>
          <FiSend className="h-4 w-4" /> Schedule Session
        </Button>
      </form>
    </Modal>
  );
}
