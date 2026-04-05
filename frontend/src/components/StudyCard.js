import React from 'react';
import { STUDY_STATES } from '../constants/study';

const StudyCard = ({
  showStudyCard,
  studyState,
  isStudyFlipped,
  cardSize,
  currentCard,
  onFlip,
  onKeyFlip,
  studyLocked,
}) => {
  if (![STUDY_STATES.active, STUDY_STATES.revealed].includes(studyState) || !currentCard) {
    return null;
  }

  return (
    <div
      className="study-card-wrapper"
      onClick={onFlip}
      onKeyDown={onKeyFlip}
      role="button"
      tabIndex={studyLocked ? -1 : 0}
      aria-pressed={isStudyFlipped}
      aria-label={
        isStudyFlipped
          ? 'Answer is visible. Press to show the question again.'
          : 'Question is visible. Press to reveal the answer.'
      }
    >
      <div
        className={`study-card ${isStudyFlipped ? 'is-flipped' : ''}`}
        style={{ width: `${cardSize.width}px`, height: `${cardSize.height}px` }}
      >
        <div className="study-face study-front">
          {showStudyCard ? (
            <>
              <span className="card-label">Question</span>
              <p>{currentCard.question}</p>
              <small>Tap or use the button below to reveal the answer</small>
            </>
          ) : (
            <p className="empty-state">Shuffle to load the study deck.</p>
          )}
        </div>
        <div className="study-face study-back">
          {showStudyCard ? (
            <>
              <span className="card-label">Answer</span>
              <p>{currentCard.answer}</p>
              <small>Click to flip back</small>
            </>
          ) : (
            <p className="empty-state">Waiting for cards ...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyCard;
