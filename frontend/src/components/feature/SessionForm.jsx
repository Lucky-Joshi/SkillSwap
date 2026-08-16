import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { createSession } from '../../services/sessions';
import { useAuth } from '../../context/AuthContext';

export default function SessionForm({ open, onClose, otherUser, onCreated }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      topic: '',
      date: '',
      duration: '60',
      link: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createSession({
        otherUserId: otherUser.id,
        topic: values.topic,
        date: new Date(values.date).toISOString(),
        duration: parseInt(values.duration, 10),
        link: values.link,
        notes: values.notes,
        mentorId: String(user.id),
      });
      toast.success('Session scheduled!');
      onClose();
      onCreated?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Schedule session with ${otherUser?.name || 'student'}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Topic"
          placeholder="e.g. React hooks deep dive"
          {...register('topic', { required: 'Topic is required' })}
          error={errors.topic?.message}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date & time"
            type="datetime-local"
            {...register('date', { required: 'Date is required' })}
            error={errors.date?.message}
          />
          <Select label="Duration" {...register('duration')}>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
            <option value="120">2 hours</option>
          </Select>
        </div>
        <Input label="Meeting link (optional)" placeholder="https://meet.google.com/…" {...register('link')} />
        <TextArea label="Notes (optional)" placeholder="What should we cover?" {...register('notes')} />
        <Button type="submit" className="w-full" loading={submitting}>
          Schedule Session
        </Button>
      </form>
    </Modal>
  );
}
