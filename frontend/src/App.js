import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const EMPTY_DECK_MESSAGE = 'Add cards in the management zone to start studying.';
const COMPLETION_MESSAGE = "Great job! You've finished all cards.";
const CARD_BASE_WIDTH = 320;
const CARD_BASE_HEIGHT = 220;
const CARD_ASPECT_RATIO = CARD_BASE_HEIGHT / CARD_BASE_WIDTH;
const STUDY_STATES = {
  idle: 'idle',
  active: 'active',
  revealed: 'revealed',
  complete: 'complete',
  empty: 'empty',
};

const STUDY_STATUS_COPY = {
  [STUDY_STATES.idle]: {
    label: 'Idle',
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

function App() {
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [studyDeck, setStudyDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStudyFlipped, setIsStudyFlipped] = useState(false);
  const [isStudying, setIsStudying] = useState(false);
  const [studyMessage, setStudyMessage] = useState('');
  const [cardSize, setCardSize] = useState({ width: CARD_BASE_WIDTH, height: CARD_BASE_HEIGHT });
  const studyCardWrapperRef = useRef(null);
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');
  const [pendingDeletionId, setPendingDeletionId] = useState(null);
  const [studyState, setStudyState] = useState(STUDY_STATES.idle);

  useEffect(() => {
    if (isStudying) {
      setPendingDeletionId(null);
    }
  }, [isStudying]);

  const scrollToManagement = () => {
    const section = document.getElementById('management-zone');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const API_URL = 'http://127.0.0.1:8000/cards';

  const fetchCards = async () => {
    try {
      const res = await axios.get(API_URL);
      setCards(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to connect to server', err);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    const target = studyCardWrapperRef.current;
    if (!target) {
      return undefined;
    }

    const updateCardSize = () => {
      const { width: measuredWidth } = target.getBoundingClientRect();
      const safeWidth = Math.max(180, Math.round(measuredWidth || CARD_BASE_WIDTH));
      const safeHeight = Math.round(safeWidth * CARD_ASPECT_RATIO);
      setCardSize({ width: safeWidth, height: safeHeight });
    };

    updateCardSize();

    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      const observer = new window.ResizeObserver(() => updateCardSize());
      observer.observe(target);
      return () => observer.disconnect();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateCardSize);
      return () => window.removeEventListener('resize', updateCardSize);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!cards.length) {
      setStudyDeck([]);
      setCurrentIndex(0);
      setIsStudying(false);
      setIsStudyFlipped(false);
      setStudyState(STUDY_STATES.empty);
      setStudyMessage(EMPTY_DECK_MESSAGE);
      return;
    }

    if (!isStudying) {
      setStudyDeck(cards);
      setCurrentIndex(0);
      setIsStudyFlipped(false);
      if (studyState !== STUDY_STATES.complete) {
        setStudyState(STUDY_STATES.idle);
        setStudyMessage('');
      }
      return;
    }

    setStudyDeck((prevDeck) => {
      const existingIds = new Set(cards.map((card) => card.id));
      const filtered = prevDeck.filter((card) => existingIds.has(card.id));
      const missing = cards.filter(
        (card) => !filtered.some((existingCard) => existingCard.id === card.id)
      );
      const updated = [...filtered, ...missing];
      setCurrentIndex((prevIndex) => {
        if (!updated.length) return 0;
        return Math.min(prevIndex, updated.length - 1);
      });
      if (!updated.length) {
        setIsStudying(false);
        setIsStudyFlipped(false);
        setStudyState(STUDY_STATES.empty);
        setStudyMessage(EMPTY_DECK_MESSAGE);
      }
      return updated;
    });
  }, [cards, isStudying, studyState]);

  const addCard = async (e) => {
    e.preventDefault();
    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();
    if (!trimmedQuestion || !trimmedAnswer) {
      setQuestion(trimmedQuestion);
      setAnswer(trimmedAnswer);
      setFormError('Both fields are required.');
      return;
    }

    setFormError('');
    await axios.post(API_URL, { question: trimmedQuestion, answer: trimmedAnswer });
    setQuestion('');
    setAnswer('');
    fetchCards();
  };

  const startEdit = (card) => {
    setEditingId(card.id);
    setEditQ(card.question);
    setEditA(card.answer);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQ('');
    setEditA('');
    setEditError('');
  };

  const saveEdit = async (id) => {
    const trimmedQuestion = editQ.trim();
    const trimmedAnswer = editA.trim();
    if (!trimmedQuestion || !trimmedAnswer) {
      setEditQ(trimmedQuestion);
      setEditA(trimmedAnswer);
      setEditError('Both fields are required.');
      return;
    }

    setEditError('');
    await axios.put(`${API_URL}/${id}`, { question: trimmedQuestion, answer: trimmedAnswer });
    cancelEdit();
    fetchCards();
  };

  const disappearCard = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchCards();
    setPendingDeletionId(null);
  };

  const shuffleCards = (list) => {
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startShuffleStudy = () => {
    if (editingId) return;
    if (!cards.length) {
      setStudyDeck([]);
      setStudyMessage(EMPTY_DECK_MESSAGE);
      setStudyState(STUDY_STATES.empty);
      setIsStudying(false);
      return;
    }
    const shuffled = shuffleCards(cards);
    setStudyDeck(shuffled);
    setCurrentIndex(0);
    setIsStudying(true);
    setIsStudyFlipped(false);
    setStudyMessage('');
    setStudyState(STUDY_STATES.active);
  };

  const handleCardFlip = () => {
    if (!studyDeck.length || !studyDeck[currentIndex]) return;
    if (editingId || studyState === STUDY_STATES.empty || studyState === STUDY_STATES.complete) return;
    setIsStudyFlipped((prev) => {
      const next = !prev;
      setStudyState(next ? STUDY_STATES.revealed : STUDY_STATES.active);
      return next;
    });
  };

  const goPrev = () => {
    if (!canUseStudyNav) return;
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
    setIsStudyFlipped(false);
    setStudyMessage('');
    setStudyState(STUDY_STATES.active);
  };

  const goNext = () => {
    if (!canUseStudyNav) return;
    if (currentIndex === studyDeck.length - 1) {
      setStudyMessage(COMPLETION_MESSAGE);
      setStudyState(STUDY_STATES.complete);
      setIsStudying(false);
      setIsStudyFlipped(false);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setIsStudyFlipped(false);
    setStudyMessage('');
    setStudyState(STUDY_STATES.active);
  };

  const handlePrimaryStudyAction = () => {
    if (editingId || !showStudyCard) return;
    if (studyState === STUDY_STATES.active) {
      setIsStudyFlipped(true);
      setStudyState(STUDY_STATES.revealed);
      return;
    }
    if (studyState === STUDY_STATES.revealed) {
      goNext();
    }
  };

  const currentCard = studyDeck[currentIndex];
  const isFirstCard = currentIndex === 0;
  const hasDeck = studyDeck.length > 0;
  const showStudyCard = (studyState === STUDY_STATES.active || studyState === STUDY_STATES.revealed) && currentCard;
  const studyLocked = Boolean(editingId);
  const managementLocked = isStudying;
  const statusInfo = STUDY_STATUS_COPY[studyState] || STUDY_STATUS_COPY[STUDY_STATES.idle];
  const statusLabel = studyLocked ? 'Editing in Progress' : statusInfo.label;
  const statusHint = studyLocked ? 'Finish editing to continue studying.' : statusInfo.hint;
  const canUseStudyNav = !studyLocked && hasDeck && ![STUDY_STATES.empty, STUDY_STATES.complete].includes(studyState);
  const showPrimaryStudyAction = studyState === STUDY_STATES.active || studyState === STUDY_STATES.revealed;
  const showPrimaryActionFooter = showPrimaryStudyAction && showStudyCard && !studyLocked;
  const primaryActionLabel = studyState === STUDY_STATES.revealed ? 'Next Card' : 'Reveal Answer';
  const isDeckEmptyState = studyState === STUDY_STATES.empty;
  const showStudyMessage = studyMessage && !isDeckEmptyState;

  return (
    <div className="App">
      <header className="app-header">
        <h1>Flashcard Control Center</h1>
        <p>Manage every card in the top panel and deep dive into shuffle study mode below.</p>
      </header>

      <section className="management-zone" id="management-zone">
        <div className="zone-title">
          <h2>Management Zone</h2>
          <p>Build, edit, or remove cards before sending them to study.</p>
        </div>
        {managementLocked && (
          <p className="info-banner warning">
            Studying is active. Stop studying or finish the current session to edit or delete cards.
          </p>
        )}

        <form className="card-form" onSubmit={addCard}>
          <input
            placeholder="Type a question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
          <input
            placeholder="Provide the answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
          <button type="submit">Add Card</button>
        </form>
        {formError && <p className="error-text">{formError}</p>}

        <div className="card-list-container">
          {cards.length === 0 && <p className="empty-state">No cards yet. Start by adding one above.</p>}
          <ul className="card-list">
            {cards.map((card) => (
              <li key={card.id} className="card-row">
                <div className="card-row-content">
                  {editingId === card.id ? (
                    <div className="edit-fields">
                      <input value={editQ} onChange={(e) => setEditQ(e.target.value)} />
                      <input value={editA} onChange={(e) => setEditA(e.target.value)} />
                      {editError && <p className="error-text inline">{editError}</p>}
                    </div>
                  ) : (
                    <>
                      <p className="card-question">Q: {card.question}</p>
                      <p className="card-answer">A: {card.answer}</p>
                    </>
                  )}
                </div>
                <div className="card-row-actions">
                  {editingId === card.id ? (
                    <>
                      <button className="btn save-btn" type="button" onClick={() => saveEdit(card.id)}>
                        Save
                      </button>
                      <button className="btn ghost" type="button" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn edit-btn"
                        type="button"
                        onClick={() => startEdit(card)}
                        disabled={managementLocked}
                      >
                        Edit
                      </button>
                      {managementLocked ? (
                        <button className="btn danger" type="button" disabled>
                          Delete
                        </button>
                      ) : pendingDeletionId === card.id ? (
                        <div className="confirm-inline">
                          <span>Delete this card?</span>
                          <button className="btn danger" type="button" onClick={() => disappearCard(card.id)}>
                            Yes
                          </button>
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() => setPendingDeletionId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn danger"
                          type="button"
                          onClick={() => setPendingDeletionId(card.id)}
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="status-bar">
          Total Cards:
          <span className="status-count">{cards.length}</span>
        </div>
      </section>

      <section className="study-zone">
        <div className="zone-title">
          <h2>Study Zone</h2>
          <p>Enter shuffle study to focus on a single 3D flip card at a time.</p>
        </div>

        <div className="study-controls">
          <button
            className="btn shuffle"
            onClick={startShuffleStudy}
            type="button"
            disabled={studyLocked || !cards.length}
            title={!cards.length ? 'Add cards to begin studying.' : studyLocked ? 'Finish editing to start.' : undefined}
          >
            Start Shuffle Study
          </button>
          <span className="deck-size">Cards Ready: {studyDeck.length}</span>
        </div>

        <div className="study-status-bar">
          <div>
            <p className="study-status-label">{statusLabel}</p>
            <p className="study-status-hint">{statusHint}</p>
          </div>
          <span className={`study-status-pill status-${studyState}`}>{studyState}</span>
        </div>
        {studyLocked && (
          <p className="info-banner warning">Finish editing to interact with the study zone.</p>
        )}

        <div className="study-area">
          <button
            className="nav-btn nav-btn-desktop"
            onClick={goPrev}
            type="button"
            disabled={!canUseStudyNav || isFirstCard}
          >
            &#8249;
          </button>

          <div className="study-content" ref={studyCardWrapperRef}>
            {studyState === STUDY_STATES.idle && (
              <div className="study-panel">
                <h3>Shuffle Study Ready</h3>
                <p>Press the shuffle button to randomize your deck and begin.</p>
              </div>
            )}

            {isDeckEmptyState && (
              <div className="study-panel empty">
                <h3>No Cards Available</h3>
                <p>Add cards in the management zone to start studying.</p>
                <button className="btn ghost" type="button" onClick={scrollToManagement}>
                  Go to Management
                </button>
              </div>
            )}

            {(studyState === STUDY_STATES.active || studyState === STUDY_STATES.revealed) && (
              <div className="study-card-wrapper" onClick={handleCardFlip}>
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
            )}

            {studyState === STUDY_STATES.complete && (
              <div className="study-panel complete">
                <h3>{COMPLETION_MESSAGE}</h3>
                <p>Shuffle again or jump back to the management zone.</p>
                <div className="panel-actions">
                  <button className="btn shuffle" type="button" onClick={startShuffleStudy}>
                    Restart Shuffle Study
                  </button>
                  <button className="btn ghost" type="button" onClick={scrollToManagement}>
                    Go to Management
                  </button>
                </div>
              </div>
            )}

          </div>

          <button
            className={`nav-btn nav-btn-desktop ${studyState === STUDY_STATES.revealed ? 'highlight' : ''}`}
            onClick={goNext}
            type="button"
            disabled={!canUseStudyNav}
          >
            &#8250;
          </button>
        </div>

        <div className="study-mobile-nav">
          <button
            className="nav-btn mobile-nav-btn"
            onClick={goPrev}
            type="button"
            disabled={!canUseStudyNav || isFirstCard}
          >
            &#8249;
          </button>
          <button
            className={`nav-btn mobile-nav-btn ${studyState === STUDY_STATES.revealed ? 'highlight' : ''}`}
            onClick={goNext}
            type="button"
            disabled={!canUseStudyNav}
          >
            &#8250;
          </button>
        </div>

        {showPrimaryActionFooter && (
          <div className="study-primary-actions">
            <button
              className={`study-primary-btn ${studyState === STUDY_STATES.revealed ? 'next' : ''}`}
              type="button"
              onClick={handlePrimaryStudyAction}
            >
              {primaryActionLabel}
            </button>
          </div>
        )}

        <div className="study-meta">
          {showStudyMessage && <p className="status-message">{studyMessage}</p>}
        </div>
      </section>

      <div className="study-progress">
        <span className="position-label">
          {hasDeck ? `[${currentIndex + 1} / ${studyDeck.length}]` : '[0 / 0]'}
        </span>
      </div>
    </div>
  );
}

export default App;
