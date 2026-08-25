import React, { useRef, useEffect, useCallback, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { cx } from '../../utils/helpers';

function getFocusableElements(container) {
  if (!container) return [];
  return container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
}

function Modal({ open, onClose, title, children, className = '', size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  const titleId = useId();
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement;
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = getFocusableElements(modalRef.current);
        if (focusable.length > 0) focusable[0].focus();
        else modalRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = getFocusableElements(modalRef.current);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => onCloseRef.current()}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className={cx('glass max-h-[90vh] w-full overflow-y-auto rounded-2xl', sizes[size], className)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200/60 px-6 py-4 dark:border-white/10">
              <h3 id={titleId} className="font-display text-lg font-bold">{title}</h3>
              <button onClick={() => onCloseRef.current()} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close dialog">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default React.memo(Modal);
