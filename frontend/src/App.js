import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');

  const API_URL = 'http://127.0.0.1:8000/cards';

  // 1. Fetch Cards (Read)
  const fetchCards = async () => {
    try {
      const res = await axios.get(API_URL);
      console.log("Response from backend:", res.data);
      setCards(res.data);
    } catch (err) {
      console.error("Backend server is offline!", err);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // 2. Add Card (Create)
  const addCard = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, { question, answer });
      setQuestion('');
      setAnswer('');
      fetchCards();
    } catch (err) {
      alert("Failed to add card. Check if Backend is running.");
    }
  };

  const startEditing = (card) => {
    setEditingCard(card);
    setEditedQuestion(card.question);
    setEditedAnswer(card.answer);
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(`${API_URL}/${id}`, { question: editedQuestion, answer: editedAnswer });
      setEditingCard(null);
      fetchCards();
    } catch (err) {
      alert("Failed to update card. Check if Backend is running.");
    }
  };

  const deleteCard = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchCards();
      } catch (err) {
        alert("Failed to delete card. Check if Backend is running.");
      }
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>🗂 Flashcard Learning App</h1>
      
      <form onSubmit={addCard} style={{ marginBottom: '40px' }}>
        <input 
          placeholder="Question" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
          style={{ padding: '10px', marginRight: '10px' }}
          required 
        />
        <input 
          placeholder="Answer" 
          value={answer} 
          onChange={(e) => setAnswer(e.target.value)} 
          style={{ padding: '10px', marginRight: '10px' }}
          required 
        />
        <button type="submit" style={{ padding: '10px 20px' }}>Add Card</button>
      </form>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {cards.map((card) => (
          <div 
            key={card.id} 
            onClick={() => alert('Answer: ' + card.answer)}
            style={{ 
              border: '2px solid #333', 
              borderRadius: '10px', 
              padding: '20px', 
              width: '180px',
              cursor: 'pointer',
              backgroundColor: '#f9f9f9',
              position: 'relative'
            }}
          >
            {editingCard && editingCard.id === card.id ? (
              <div>
                <input value={editedQuestion} onChange={(e) => setEditedQuestion(e.target.value)} style={{ width: '90%', marginBottom: '5px' }} />
                <input value={editedAnswer} onChange={(e) => setEditedAnswer(e.target.value)} style={{ width: '90%' }} />
                <button onClick={() => saveEdit(card.id)} style={{ padding: '5px'}}>Save</button>
                <button onClick={() => setEditingCard(null)} style={{ padding: '5px' }}>Cancel</button>
              </div>
            ) : (
              <div onClick={() => alert('Answer: ' + card.answer)}>
                <button 
                  onClick={(e) => deleteCard(card.id, e)} 
                  style={{ 
                    position: 'absolute', top: '5px', right: '5px', 
                    background: '#ff4d4d', color: 'white', border: 'none', 
                    borderRadius: '50%', cursor: 'pointer', width: '25px', height: '25px',
                  }}
                >
                  X
                  </button>
                <p><strong>{card.question}</strong></p>
                <small style={{ color: '#888' }}>Click for Answer</small>
                <button 
                  onClick={(e) => { e.stopPropagation(); startEditing(card); }}
                  style={{ marginTop: '10px', display: 'block', width: '100%' }}>Edit</button>
              </div>
            )}
          </div>
        ))}
          </div>
        </div>
      );
    }

export default App;
