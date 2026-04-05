export const STUDY_STATES = {
  idle: 'idle',
  active: 'active',
  revealed: 'revealed',
  complete: 'complete',
  empty: 'empty',
};

export const STUDY_STATUS_COPY = {
  [STUDY_STATES.idle]: {
    label: 'Ready',
    hint: 'Shuffle the deck to begin studying.',
  },
  [STUDY_STATES.active]: {
    label: 'Studying',
    hint: 'Review the question and reveal the answer when you are ready.',
  },
  [STUDY_STATES.revealed]: {
    label: 'Answer Revealed',
    hint: 'Advance to the next card once you feel confident.',
  },
  [STUDY_STATES.complete]: {
    label: 'Study Complete',
    hint: 'Great job! Shuffle again or adjust your deck.',
  },
  [STUDY_STATES.empty]: {
    label: 'No Cards',
    hint: 'Add cards in the management zone to get started.',
  },
};

export const EMPTY_DECK_MESSAGE = 'Add cards in the management zone to start studying.';
export const COMPLETION_MESSAGE = "Great job! You've finished all cards.";
