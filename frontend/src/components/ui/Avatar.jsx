import { avatarUrl, initials, cx } from '../../utils/helpers';

export default function Avatar({ src, name, size = 'md', className }) {
  const sizes = {
    xs: 'h-8 w-8 text-xs',
    sm: 'h-10 w-10 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  };
  return (
    <div className={cx('relative overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-accent shrink-0', sizes[size], className)}>
      {src ? (
        <img src={avatarUrl(src, name)} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-bold text-white">{initials(name)}</div>
      )}
    </div>
  );
}
