import React from 'react';

const CardRow = ({
  card,
  isEditing,
  editingData,
  editError,
  managementLocked,
  pendingDeletionId,
  isUpdating,
  deletingId,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}) => (
  <li className="card-row">
    <div className="card-row-content">
      {isEditing ? (
        <div className="edit-fields">
          <label className="sr-only" htmlFor={`edit-question-${card.id}`}>
            Edit question for {card.question}
          </label>
          <input
            id={`edit-question-${card.id}`}
            value={editingData.editQ}
            onChange={(e) => onEditChange('question', e.target.value)}
          />
          <label className="sr-only" htmlFor={`edit-answer-${card.id}`}>
            Edit answer for {card.question}
          </label>
          <input
            id={`edit-answer-${card.id}`}
            value={editingData.editA}
            onChange={(e) => onEditChange('answer', e.target.value)}
          />
          {editError && (
            <p className="error-text inline" role="alert">
              {editError}
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="card-question">Q: {card.question}</p>
          <p className="card-answer">A: {card.answer}</p>
        </>
      )}
    </div>
    <div className="card-row-actions">
      {isEditing ? (
        <>
          <button
            className="btn save-btn"
            type="button"
            onClick={() => onSaveEdit(card.id)}
            disabled={isUpdating}
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </button>
          <button className="btn ghost" type="button" onClick={onCancelEdit}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <button
            className="btn edit-btn"
            type="button"
            onClick={() => onStartEdit(card)}
            disabled={managementLocked}
            aria-label={`Edit card: ${card.question}`}
          >
            Edit
          </button>
          {managementLocked ? (
            <button className="btn danger" type="button" disabled aria-label="Delete disabled">
              Delete
            </button>
          ) : pendingDeletionId === card.id ? (
            <div className="confirm-inline">
              <span>Delete this card?</span>
              <button
                className="btn danger"
                type="button"
                onClick={() => onDelete(card.id)}
                disabled={deletingId === card.id}
              >
                Yes
              </button>
              <button className="btn ghost" type="button" onClick={onCancelDelete}>
                No
              </button>
            </div>
          ) : (
            <button
              className="btn danger"
              type="button"
              onClick={() => onConfirmDelete(card.id)}
              aria-label={`Delete card: ${card.question}`}
              disabled={deletingId === card.id}
            >
              {deletingId === card.id ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </>
      )}
    </div>
  </li>
);

const CardList = ({
  cards,
  editingId,
  editQ,
  editA,
  editError,
  managementLocked,
  pendingDeletionId,
  isUpdating,
  deletingId,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}) => (
  <ul className="card-list">
    {cards.map((card) => (
      <CardRow
        key={card.id}
        card={card}
        isEditing={editingId === card.id}
        editingData={{ editQ, editA }}
        editError={editError}
        managementLocked={managementLocked}
        pendingDeletionId={pendingDeletionId}
        isUpdating={isUpdating}
        deletingId={deletingId}
        onEditChange={onEditChange}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        onSaveEdit={onSaveEdit}
        onDelete={onDelete}
        onConfirmDelete={onConfirmDelete}
        onCancelDelete={onCancelDelete}
      />
    ))}
  </ul>
);

export default CardList;
