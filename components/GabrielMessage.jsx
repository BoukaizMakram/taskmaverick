'use client';

import { useEffect, useId, useRef } from 'react';
import styles from './GabrielMessage.module.css';
import MessageConfetti from './MessageConfetti';

export default function GabrielMessage({ open, onDismiss, onContinue }) {
  const dialog = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onDismiss(); }}>
      <MessageConfetti open={open}/>
      <div className={styles.card}>
        <button type="button" className={styles.close} aria-label="Close message" onClick={onDismiss}>×</button>
        <div className={styles.surprise} aria-hidden="true">
          <span className={`${styles.sparkle} ${styles.sparkleLeft}`}>✧</span>
          <span className={`${styles.sparkle} ${styles.sparkleRight}`}>✧</span>
          <div className={styles.envelope}>
            <span className={styles.note}>♥</span>
            <svg className={styles.pocket} viewBox="0 0 80 50" fill="none">
              <path d="M0 0 40 25 80 0v44a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6Z" fill="#ddc18f"/>
              <path d="m0 48 28-21m52 21L52 27" stroke="#b5935b" strokeWidth="1.5"/>
            </svg>
            <svg className={styles.flap} viewBox="0 0 80 26" fill="none">
              <path d="m0 0 36 24a7 7 0 0 0 8 0L80 0Z" fill="#f1d9ae"/>
            </svg>
          </div>
        </div>
        <p className={styles.eyebrow}>A moment of gratitude</p>
        <h2 id={titleId} className={styles.title}>For you,<br/><span>Gabriel Frem.</span></h2>
        <div className={styles.rule} aria-hidden="true"/>
        <p className={styles.intro}>Before the demo begins, a little note from me to you.</p>
        <p className={styles.message}>Thank you for your leadership, your vision, and the trust you place in me. You inspire me to keep learning and give my best. Today, I want you to know how much I appreciate you.</p>
        <blockquote className={styles.wishes}>Wishing you good health, happiness, and wonderful moments with the people you love. May the year ahead bring meaningful achievements, new reasons to smile, and time to enjoy everything you work so hard for.</blockquote>
        <p className={styles.signature}>From me to you,<br/><strong>With appreciation and warm wishes</strong></p>
        <button type="button" className={styles.continue} onClick={onContinue}>Continue to the demo <span aria-hidden="true">→</span></button>
      </div>
    </dialog>
  );
}
