import React from 'react';
import { Paperclip, Send, X } from 'lucide-react';

export default function ChatInput({ 
  inputText, 
  setInputText, 
  selectedFile, 
  setSelectedFile, 
  handleSend 
}) {
  return (
    <div className="chat-input-wrapper">
      <form onSubmit={handleSend} className="chat-input-form">
        <textarea 
          className="chat-textarea"
          placeholder="Escribe un mensaje o pega una nota..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />

        <div className="chat-input-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <input 
              type="file" 
              id="file-upload" 
              style={{ display: 'none' }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <label 
              htmlFor="file-upload" 
              className="btn-copy" 
              style={{ cursor: 'pointer', display: 'inline-flex', padding: '0.4rem 0.75rem', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px' }}
            >
              <Paperclip size={16} />
              <span>Adjuntar</span>
            </label>

            {selectedFile && (
              <div className="selected-file-chip">
                <span>{selectedFile.name.length > 18 ? selectedFile.name.substring(0, 15) + '...' : selectedFile.name}</span>
                <X 
                  size={14} 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => setSelectedFile(null)} 
                />
              </div>
            )}
          </div>

          <button type="submit" className="btn-send">
            <span>Enviar</span>
            <Send size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}
