import React, { RefObject } from 'react';
import logo from './logo.svg';
import ghostIcon from './ghost1.png';
import sendIcon from './send.png';
import userIcon from './user.png';
import crossIcon from './cross.png';
import { Member } from './App';

interface Props {
  isConnected: boolean;
  clientId: string;
  members: Member[];
  chatRows: React.ReactNode[];
  onPublicMessage: () => void;
  onPrivateMessage: (to: Member) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  inputName: string;
  setInputName: (val: string) => void;
  publicMessage: string;
  setPublicMessage: (val: string) => void;
  privateTarget: Member | null;
  setPrivateTarget: (val: Member | null) => void;
  privateMessage: string;
  setPrivateMessage: (val: string) => void;
  showPrivatePopup: boolean;  // now unused
  setShowPrivatePopup: (val: boolean) => void;
  joinInputRef: RefObject<HTMLInputElement>;
  publicInputRef: RefObject<HTMLInputElement>;
  privateInputRef: RefObject<HTMLInputElement>;
  isGhost: boolean;
  enableGhostMode: () => void;
  disableGhostMode: () => void;
  showSidebar: boolean;
  setShowSidebar: (v: boolean) => void;
}

export const ChatUI: React.FC<Props> = ({
  isConnected,
  clientId,
  members,
  chatRows,
  onPublicMessage,
  onPrivateMessage,
  onConnect,
  onDisconnect,
  inputName,
  setInputName,
  publicMessage,
  setPublicMessage,
  privateTarget,
  setPrivateTarget,
  privateMessage,
  setPrivateMessage,
  joinInputRef,
  publicInputRef,
  privateInputRef,
  isGhost,
  enableGhostMode,
  disableGhostMode,
  showSidebar,
  setShowSidebar,
}) => {
  const CHARACTER_LIMIT = 200;

  if (!isConnected) {
    return (
      <div className="join-screen">
        <img src={logo} alt="Logo" style={{ width: '80px', marginBottom: '20px' }} />
        <div className="join-title">LiveConnect</div>
        <input
          className="join-input"
          placeholder="Enter your name"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          maxLength={50}
          ref={joinInputRef}
          onKeyDown={(e) => e.key === 'Enter' && onConnect()}
        />
        <button className="join-button" onClick={onConnect}>
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <button
        className="sidebar-toggle-button"
        onClick={() => setShowSidebar(true)}
      >
        <img src={userIcon} alt="Members" style={{ width: '17px' }} />
      </button>
      <div className={`sidebar ${showSidebar ? 'active' : 'hidden'}`}>
        <button
          className="close-sidebar-button"
          onClick={() => setShowSidebar(false)}
        >
          <img src={crossIcon} alt="Close" style={{ width: '18px' }} />
        </button>

        <h2>LiveConnect</h2>
        <div className="sidebar-members">
          {members.map((m) => (
            <div
              key={m.id}
              className={`member ${m.id === clientId ? 'self-member' : ''}`}
              onClick={() => {
                if (m.id !== clientId) {
                  setPrivateTarget(m);
                  if (window.innerWidth < 768) setShowSidebar(false);
                }
              }}
            >
              {m.name}
              {( (m.id === clientId && isGhost) ||
                 (isGhost && m.isGhost && m.id !== clientId)
              ) && (
                <img
                  src={ghostIcon}
                  alt="ghost"
                  style={{ width: '18px', marginLeft: '6px' }}
                />
              )}
            </div>
          ))}
        </div>

        <button className="disconnect-button" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
      <div className="chat-section">
        <div className="header">
          <img
            src={ghostIcon}
            alt="ghost toggle"
            className={`ghost-button ${isGhost ? 'active' : ''}`}
            title={isGhost ? 'Disable Ghost Mode' : 'Enable Ghost Mode'}
            onClick={isGhost ? disableGhostMode : enableGhostMode}
          />
          <h3>Chat Room</h3>
          <div className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
        </div>

        <div className="chat-display">{chatRows}</div>
        {privateTarget && (
          <div className="private-target-bar">
            Private message to <strong>{privateTarget.name}</strong>
            <button
              className="cancel-private-button"
              onClick={() => {
                setPrivateTarget(null);
                setPrivateMessage('');
              }}
            >
              ×
            </button>
          </div>
        )}

        <div className="button-row" style={{ alignItems: 'center' }}>
          <div className="input-wrapper">
            <input
              ref={privateTarget ? privateInputRef : publicInputRef}
              type="text"
              placeholder={privateTarget ? "Enter private message" : "Enter public message"}
              value={privateTarget ? privateMessage : publicMessage}
              onChange={(e) =>
                privateTarget
                  ? e.target.value.length <= CHARACTER_LIMIT && setPrivateMessage(e.target.value)
                  : e.target.value.length <= CHARACTER_LIMIT && setPublicMessage(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  privateTarget
                    ? onPrivateMessage(privateTarget)
                    : onPublicMessage();
                }
              }}
            />
            <div className="char-counter">
              {(privateTarget ? privateMessage.length : publicMessage.length)}/{CHARACTER_LIMIT}
            </div>
          </div>
          <button
            className="send-button"
            onClick={() => {
              privateTarget
                ? onPrivateMessage(privateTarget)
                : onPublicMessage();
            }}
          >
            <img src={sendIcon} alt="Send" />
          </button>
        </div>
      </div>
    </div>
  );
};
