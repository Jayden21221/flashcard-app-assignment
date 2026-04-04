import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const EMPTY_DECK_MESSAGE = 'Add cards in the management zone to start studying.';
const COMPLETION_MESSAGE = "Great job! You've finished all cards.";
const CARD_BASE_WIDTH = 320;
const CARD_BASE_HEIGHT = 220;
const CARD_ASPECT_RATIO = CARD_BASE_HEIGHT / CARD_BASE_WIDTH;

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
      return;
    }

    if (!isStudying) {
      setStudyDeck(cards);
      setCurrentIndex(0);
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
      return updated;
    });
  }, [cards, isStudying]);

  const addCard = async (e) => {
    e.preventDefault();
    await axios.post(API_URL, { question, answer });
    setQuestion('');
    setAnswer('');
    fetchCards();
  };

  const startEdit = (card) => {
    setEditingId(card.id);
    setEditQ(card.question);
    setEditA(card.answer);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQ('');
    setEditA('');
  };

  const saveEdit = async (id) => {
    await axios.put(`${API_URL}/${id}`, { question: editQ, answer: editA });
    cancelEdit();
    fetchCards();
  };

  const disappearCard = async (id) => {
    if (window.confirm('Do you want to delete this card?')) {
      await axios.delete(`${API_URL}/${id}`);
      fetchCards();
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
    if (!cards.length) {
      setStudyDeck([]);
      setStudyMessage(EMPTY_DECK_MESSAGE);
      return;
    }
    const shuffled = shuffleCards(cards);
    setStudyDeck(shuffled);
    setCurrentIndex(0);
    setIsStudying(true);
    setIsStudyFlipped(false);
    setStudyMessage('');
  };

  const toggleStudyFlip = () => {
    if (!studyDeck.length) return;
    setIsStudyFlipped((prev) => !prev);
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
    setIsStudyFlipped(false);
    setStudyMessage('');
  };

  const goNext = () => {
    if (!studyDeck.length) return;
    if (currentIndex === studyDeck.length - 1) {
      setStudyMessage('');
      if (typeof window !== 'undefined') {
        window.alert(COMPLETION_MESSAGE);
      }
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setIsStudyFlipped(false);
    setStudyMessage('');
  };

  const currentCard = studyDeck[currentIndex];
  const isFirstCard = currentIndex === 0;
  const hasDeck = studyDeck.length > 0;
  const isEmptyDeckMessage = studyMessage === EMPTY_DECK_MESSAGE;

  return (
    <div className="App">
      <header className="app-header">
        <h1>Flashcard Control Center</h1>
        <p>Manage every card in the top panel and deep dive into shuffle study mode below.</p>
      </header>

      <section className="management-zone">
        <div className="zone-title">
          <h2>Management Zone</h2>
          <p>Build, edit, or remove cards before sending them to study.</p>
        </div>

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
                      <button className="btn edit-btn" type="button" onClick={() => startEdit(card)}>
                        Edit
                      </button>
                      <button className="btn danger" type="button" onClick={() => disappearCard(card.id)}>
                        Delete
                      </button>
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
          <button className="btn shuffle" onClick={startShuffleStudy} type="button">
            Start Shuffle Study
          </button>
          <span className="deck-size">Cards Ready: {studyDeck.length}</span>
        </div>

        <div className="study-area">
          <button
            className="nav-btn nav-btn-desktop"
            onClick={goPrev}
            type="button"
            disabled={!hasDeck || isFirstCard}
          >
            &#8249;
          </button>

          <div
            className="study-card-wrapper"
            onClick={toggleStudyFlip}
            ref={studyCardWrapperRef}
          >
            <div
              className={`study-card ${isStudyFlipped ? 'is-flipped' : ''}`}
              style={{ width: `${cardSize.width}px`, height: `${cardSize.height}px` }}
            >
              <div className="study-face study-front">
                {currentCard ? (
                  <>
                    <span className="card-label">Question</span>
                    <p>{currentCard.question}</p>
                    <small>Click to reveal the answer</small>
                  </>
                ) : (
                  <p className="empty-state">
                    {isEmptyDeckMessage ? studyMessage : 'Shuffle to load the study deck.'}
                  </p>
                )}
              </div>
              <div className="study-face study-back">
                {currentCard ? (
                  <>
                    <span className="card-label">Answer</span>
                    <p>{currentCard.answer}</p>
                    <small>Click to flip back</small>
                  </>
                ) : (
                  <p className="empty-state">
                    {isEmptyDeckMessage ? studyMessage : 'Waiting for cards ...'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            className="nav-btn nav-btn-desktop"
            onClick={goNext}
            type="button"
            disabled={!hasDeck}
          >
            &#8250;
          </button>
        </div>

        <div className="study-mobile-nav">
          <button
            className="nav-btn mobile-nav-btn"
            onClick={goPrev}
            type="button"
            disabled={!hasDeck || isFirstCard}
          >
            &#8249;
          </button>
          <button
            className="nav-btn mobile-nav-btn"
            onClick={goNext}
            type="button"
            disabled={!hasDeck}
          >
            &#8250;
          </button>
        </div>

        <div className="study-meta">
          {studyMessage && !isEmptyDeckMessage && (
            <p className="status-message">{studyMessage}</p>
          )}
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
