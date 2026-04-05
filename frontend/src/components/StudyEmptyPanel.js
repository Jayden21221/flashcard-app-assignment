import React from 'react';

const StudyEmptyPanel = ({ onGoToManagement }) => (
  <div className="study-panel empty">
    <h3>No Cards Available</h3>
    <p>Add cards in the management zone to start studying.</p>
    <button className="btn ghost" type="button" onClick={onGoToManagement}>
      Go to Management
    </button>
  </div>
);

export default StudyEmptyPanel;
