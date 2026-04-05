import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

import { CARD_BASE_WIDTH, CARD_BASE_HEIGHT, CARD_ASPECT_RATIO } from './constants/layout';
import { STUDY_STATES, STUDY_STATUS_COPY, EMPTY_DECK_MESSAGE, COMPLETION_MESSAGE } from './constants/study';
import { fetchCards as fetchCardsApi, createCard, updateCard, deleteCard } from './services/cards';
import CardList from './components/CardList';
import StudyCard from './components/StudyCard';
import { StudyStatusBar, StudyPrimaryAction } from './components/StudyControls';
import StudyEmptyPanel from './components/StudyEmptyPanel';
import StudyCompletePanel from './components/StudyCompletePanel';

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
  const [statusMessage, setStatusMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const announceStatus = useCallback((message) => {
    setStatusMessage(message);
  }, []);

  const loadCards = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetchCardsApi();
      setCards(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to connect to server', err);
      announceStatus('Unable to connect to the server.');
    } finally {
      setIsFetching(false);
    }
  }, [announceStatus]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

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
    setIsCreating(true);
    try {
      await createCard({ question: trimmedQuestion, answer: trimmedAnswer });
      setQuestion('');
      setAnswer('');
      announceStatus('Card added successfully.');
      loadCards();
    } catch (error) {
      console.error('Failed to add card', error);
      setFormError('Unable to add card right now.');
      announceStatus('Unable to add card right now.');
    } finally {
      setIsCreating(false);
    }
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
    setIsUpdating(true);
    try {
      await updateCard(id, { question: trimmedQuestion, answer: trimmedAnswer });
      cancelEdit();
      announceStatus('Card updated successfully.');
      loadCards();
    } catch (error) {
      console.error('Failed to update card', error);
      setEditError('Unable to save changes.');
      announceStatus('Unable to save card changes.');
    } finally {
      setIsUpdating(false);
    }
  };

  const disappearCard = async (id) => {
    setDeletingId(id);
    try {
      await deleteCard(id);
      loadCards();
      announceStatus('Card deleted.');
    } catch (error) {
      console.error('Failed to delete card', error);
      announceStatus('Unable to delete card right now.');
    } finally {
      setDeletingId(null);
      setPendingDeletionId(null);
    }
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
      announceStatus('Add cards in the management zone to start studying.');
      return;
    }
    const shuffled = shuffleCards(cards);
    setStudyDeck(shuffled);
    setCurrentIndex(0);
    setIsStudying(true);
    setIsStudyFlipped(false);
    setStudyMessage('');
    setStudyState(STUDY_STATES.active);
    announceStatus('Shuffle study started.');
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

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardFlip();
    }
  };

  const goPrev = () => {
    if (!canUseStudyNav) return;
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
    setIsStudyFlipped(false);
    setStudyMessage('');
    setStudyState(STUDY_STATES.active);
    announceStatus('Moved to previous card.');
  };

  const goNext = () => {
    if (!canUseStudyNav) return;
    if (currentIndex === studyDeck.length - 1) {
      setStudyMessage(COMPLETION_MESSAGE);
      setStudyState(STUDY_STATES.complete);
      setIsStudying(false);
      setIsStudyFlipped(false);
      announceStatus(COMPLETION_MESSAGE);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setIsStudyFlipped(false);
    setStudyMessage('');
    setStudyState(STUDY_STATES.active);
    announceStatus('Moved to next card.');
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
  const managementLocked = isStudying || isCreating || isUpdating || Boolean(deletingId);
  const statusInfo = STUDY_STATUS_COPY[studyState] || STUDY_STATUS_COPY[STUDY_STATES.idle];
  const statusLabel = studyLocked ? 'Editing in Progress' : statusInfo.label;
  const statusHint = studyLocked ? 'Finish editing to continue studying.' : statusInfo.hint;
  const canUseStudyNav = !studyLocked && hasDeck && ![STUDY_STATES.empty, STUDY_STATES.complete].includes(studyState);
  const showPrimaryStudyAction = studyState === STUDY_STATES.active || studyState === STUDY_STATES.revealed;
  const showPrimaryActionFooter = showPrimaryStudyAction && showStudyCard && !studyLocked;
  const isDeckEmptyState = studyState === STUDY_STATES.empty;
  const showStudyMessage = studyMessage && !isDeckEmptyState;

  const handleRequestDelete = (id) => {
    setPendingDeletionId(id);
  };

  const handleCancelDelete = () => {
    setPendingDeletionId(null);
  };

  return (
    <div className="App">
      <div className="sr-only" aria-live="polite" role="status">
        {statusMessage}
      </div>
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
            disabled={managementLocked}
            aria-busy={isCreating}
          />
          <input
            placeholder="Provide the answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            disabled={managementLocked}
            aria-busy={isCreating}
          />
          <button type="submit" disabled={managementLocked}>
            {isCreating ? 'Adding...' : 'Add Card'}
          </button>
        </form>
        {formError && <p className="error-text">{formError}</p>}

        <div className="card-list-container">
          {isFetching && <p className="info-banner">Loading cards...</p>}
          {cards.length === 0 && <p className="empty-state">No cards yet. Start by adding one above.</p>}
          <CardList
            cards={cards}
            editingId={editingId}
            editQ={editQ}
            editA={editA}
            editError={editError}
            managementLocked={managementLocked}
            pendingDeletionId={pendingDeletionId}
            isUpdating={isUpdating}
            deletingId={deletingId}
            onEditChange={(field, value) => {
              if (field === 'question') setEditQ(value);
              if (field === 'answer') setEditA(value);
            }}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onDelete={disappearCard}
            onConfirmDelete={handleRequestDelete}
            onCancelDelete={handleCancelDelete}
          />
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
            aria-label="Start shuffle study"
          >
            Start Shuffle Study
          </button>
          <span className="deck-size">Cards Ready: {studyDeck.length}</span>
        </div>

        <StudyStatusBar
          statusLabel={statusLabel}
          statusHint={statusHint}
          studyState={studyState}
        />
        {studyLocked && (
          <p className="info-banner warning" role="alert">
            Finish editing to interact with the study zone.
          </p>
        )}

        <div className="study-area">
          <button
            className="nav-btn nav-btn-desktop"
            onClick={goPrev}
            type="button"
            disabled={!canUseStudyNav || isFirstCard}
            aria-label="Previous card"
          >
            &#8249;
          </button>

          <div className="study-content" ref={studyCardWrapperRef}>
            {studyState === STUDY_STATES.idle && (
              <div className="study-panel">
                <h3>Ready</h3>
                <p>Press the shuffle button to randomize your deck and begin.</p>
              </div>
            )}

            {isDeckEmptyState && <StudyEmptyPanel onGoToManagement={scrollToManagement} />}

            <StudyCard
              showStudyCard={showStudyCard}
              studyState={studyState}
              isStudyFlipped={isStudyFlipped}
              cardSize={cardSize}
              currentCard={currentCard}
              onFlip={handleCardFlip}
              onKeyFlip={handleCardKeyDown}
              studyLocked={studyLocked}
            />

            {studyState === STUDY_STATES.complete && (
              <StudyCompletePanel
                onRestart={startShuffleStudy}
                onGoToManagement={scrollToManagement}
              />
            )}

          </div>

          <button
            className={`nav-btn nav-btn-desktop ${studyState === STUDY_STATES.revealed ? 'highlight' : ''}`}
            onClick={goNext}
            type="button"
            disabled={!canUseStudyNav}
            aria-label="Next card"
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
            aria-label="Previous card"
          >
            &#8249;
          </button>
          <button
            className={`nav-btn mobile-nav-btn ${studyState === STUDY_STATES.revealed ? 'highlight' : ''}`}
            onClick={goNext}
            type="button"
            disabled={!canUseStudyNav}
            aria-label="Next card"
          >
            &#8250;
          </button>
        </div>

        <StudyPrimaryAction
          show={showPrimaryActionFooter}
          studyState={studyState}
          onPrimaryAction={handlePrimaryStudyAction}
        />

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
