import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/cards';

export const fetchCards = () => axios.get(API_URL);
export const createCard = (payload) => axios.post(API_URL, payload);
export const updateCard = (id, payload) => axios.put(`${API_URL}/${id}`, payload);
export const deleteCard = (id) => axios.delete(`${API_URL}/${id}`);
