// src/components/notesSection/NotesSection.jsx
import React from "react";
import "./NotesSection.css";
import { useAuthContext } from "../../hooks/useAuthContext";

const NotesSection = ({
  notes = [],
  newNoteValue = "",
  onNewNoteChange,
  onAddNoteBlur,
  onDeleteNote,
}) => {
  const { isAdmin, isAdminPlus } = useAuthContext();
  const showAddNote = isAdmin || isAdminPlus;

  return (
    <div className="NotesContainer">
      {showAddNote && (
        <div className="AddNote">
          <div className="NoteLabel">Add Note:</div>
          <textarea
            className="TextArea"
            rows="2"
            cols="80"
            value={newNoteValue}
            onChange={onNewNoteChange}
            onBlur={(e) => onAddNoteBlur?.(e.target.value)} // pass string
            placeholder="Type a note and click away to save…"
          />
        </div>
      )}

      {Array.isArray(notes) &&
        notes.map((note, index) => {
          const date = note?.date ?? "";
          const text = note?.text ?? "";

          return (
            <div key={`${date}-${index}`} className="AddNote">
              <div className="NoteLabel">{date}:</div>
              <textarea
                className="TextArea"
                rows="2"
                cols="80"
                value={text}
                readOnly
              />

              {showAddNote && typeof onDeleteNote === "function" && (
                <button
                  className="DeleteButton"
                  type="button"
                  onMouseDown={(e) => e.preventDefault()} // prevents blur
                  onClick={() => onDeleteNote(index)}
                  aria-label="Delete note"
                >
                  X
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default NotesSection;