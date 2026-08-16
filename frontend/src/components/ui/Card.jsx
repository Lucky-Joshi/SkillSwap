import { cx } from '../../utils/helpers';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div className={cx('glass rounded-2xl p-6', hover && 'card-hover', className)} {...props}>
      {children}
    </div>
  );
}
