import React from 'react';
import { STUDY_STATES } from '../constants/study';

export const StudyStatusBar = ({ statusLabel, statusHint, studyState }) => (
  <div className="study-status-bar" role="status" aria-live="polite">
    <div>
      <p className="study-status-label">{statusLabel}</p>
      <p className="study-status-hint">{statusHint}</p>
    </div>
    <span className={`study-status-pill status-${studyState}`}>{statusLabel}</span>
  </div>
);

export const StudyPrimaryAction = ({
  show,
  studyState,
  onPrimaryAction,
}) => {
  if (!show) return null;
  const label = studyState === STUDY_STATES.revealed ? 'Next Card' : 'Reveal Answer';
  return (
    <div className="study-primary-actions">
      <button
        className={`study-primary-btn ${studyState === STUDY_STATES.revealed ? 'next' : ''}`}
        type="button"
        onClick={onPrimaryAction}
      >
        {label}
      </button>
    </div>
  );
};
