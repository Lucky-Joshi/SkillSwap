import React from 'react';
import { cx } from '../../utils/helpers';

function Card({ children, className, hover = false, ...props }) {
  return (
    <div className={cx('glass rounded-2xl p-6', hover && 'card-hover', className)} {...props}>
      {children}
    </div>
  );
}

export default React.memo(Card);
