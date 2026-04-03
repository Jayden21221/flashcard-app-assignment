import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  
  const [flippedCardIds, setFlippedCardIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');

  const API_URL = 'http://127.0.0.1:8000/cards';

  const fetchCards = async () => {
    try {
      const res = await axios.get(API_URL);
      setCards(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Failed to connect to server", err); }
  };

  useEffect(() => { fetchCards(); }, []);

  const addCard = async (e) => {
    e.preventDefault();
    await axios.post(API_URL, { question, answer });
    setQuestion(''); setAnswer('');
    fetchCards();
  };

  const toggleFlip = (id) => {
    if (editingId) return; 
    const newFlipped = new Set(flippedCardIds);
    if (newFlipped.has(id)) newFlipped.delete(id);
    else newFlipped.add(id);
    setFlippedCardIds(newFlipped);
  };

  const disappearCard = async (id, e) => {
    e.stopPropagation(); 
    if (window.confirm("Do you want to delete this card?")) {
      await axios.delete(`${API_URL}/${id}`);
      fetchCards();
    }
  };

  const startEdit = (card, e) => {
    e.stopPropagation();
    setEditingId(card.id);
    setEditQ(card.question);
    setEditA(card.answer);
  };

  const saveEdit = async (id, e) => {
    e.stopPropagation();
    await axios.put(`${API_URL}/${id}`, { question: editQ, answer: editA });
    setEditingId(null);
    fetchCards();
  };

  return (
    <div className="App">
      <h1>🗂 Flashcard Master</h1>
      
      <div className="input-container">
        <h3>Make New Card</h3>
        <form onSubmit={addCard}>
          <input placeholder="Question" value={question} onChange={(e)=>setQuestion(e.target.value)} required />
          <input placeholder="Answer" value={answer} onChange={(e)=>setAnswer(e.target.value)} required />
          <button type="submit">Add</button>
        </form>
      </div>

      <div className="card-grid">
        {cards.length === 0 && <p>Add some cards to get started!</p>}
        {cards.map((card) => (
          <div key={card.id} className="card-scene">
            <div 
              className={`card-item ${flippedCardIds.has(card.id) ? 'is-flipped' : ''}`}
              onClick={() => toggleFlip(card.id)}
            >
              <div className="card-face card-front">
                <div className="card-actions" onClick={(e)=>e.stopPropagation()}>
                  <button className="btn-edit" onClick={(e)=>startEdit(card, e)}>Edit</button>
                  <button className="btn-delete" onClick={(e)=>disappearCard(card.id, e)}>X</button>
                </div>
                {editingId === card.id ? (
                  <div onClick={(e)=>e.stopPropagation()}>
                    <input value={editQ} onChange={(e)=>setEditQ(e.target.value)} /><br/>
                    <button onClick={(e)=>saveEdit(card.id, e)}>Save</button>
                    <button onClick={(e)=>{e.stopPropagation(); setEditingId(null);}}>Cancel</button>
                  </div>
                ) : (
                  <p><strong>Q: {card.question}</strong></p>
                )}
              </div>

              <div className="card-face card-back">
                <p><strong>A: {card.answer}</strong></p>
                <small style={{color: '#999'}}>Click to see Question</small>
                <button 
                  onClick={(e)=>disappearCard(card.id, e)}
                  style={{marginTop: '15px', padding: '5px 10px'}}
                >
                  Completed Learning (Delete)
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
