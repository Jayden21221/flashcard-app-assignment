import React from 'react';
import { COMPLETION_MESSAGE } from '../constants/study';

const StudyCompletePanel = ({ onRestart, onGoToManagement }) => (
  <div className="study-panel complete">
    <h3>{COMPLETION_MESSAGE}</h3>
    <p>Shuffle again or jump back to the management zone.</p>
    <div className="panel-actions">
      <button className="btn shuffle" type="button" onClick={onRestart}>
        Restart Shuffle Study
      </button>
      <button className="btn ghost" type="button" onClick={onGoToManagement}>
        Go to Management
      </button>
    </div>
  </div>
);

export default StudyCompletePanel;
