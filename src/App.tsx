import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatUI } from './ChatClient';

export interface Member {
  name: string;
  id: string;
  isGhost?: boolean;
}

const WEBSOCKET_URL = 'wss://6wlyb2jxxi.execute-api.ap-south-2.amazonaws.com/production/';

const App: React.FC = () => {
  const socket = useRef<WebSocket | null>(null);

  const [clientId, setClientId] = useState('');
  const clientIdRef = useRef('');

  const [isConnected, setIsConnected] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const isGhostRef = useRef(false);
  const [members, setMembers] = useState<Member[]>([]);
  const membersRef = useRef<Member[]>([]);
  const [chatRows, setChatRows] = useState<React.ReactNode[]>([]);

  const [inputName, setInputName] = useState('');
  const [publicMessage, setPublicMessage] = useState('');
  const [privateTarget, setPrivateTarget] = useState<Member | null>(null);
  const [privateMessage, setPrivateMessage] = useState('');
  const [showPrivatePopup, setShowPrivatePopup] = useState(false);

  const [showGhostPassPopup, setShowGhostPassPopup] = useState(false);
  const [ghostPass, setGhostPass] = useState('');
  const [ghostMessage, setGhostMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [showSidebar, setShowSidebar] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const joinInputRef = useRef<HTMLInputElement | null>(null);
  const publicInputRef = useRef<HTMLInputElement | null>(null);
  const privateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatRows]);

  useEffect(() => {
    if (!isConnected) joinInputRef.current?.focus();
  }, [isConnected]);

  useEffect(() => {
    if (showPrivatePopup) privateInputRef.current?.focus();
  }, [showPrivatePopup]);

  useEffect(() => {
    if (ghostMessage) {
      const timer = setTimeout(() => setGhostMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [ghostMessage]);

  const sendMessage = (data: any) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify(data));
    }
  };

  const onSocketOpen = useCallback(() => {
    setIsConnected(true);
    sendMessage({ action: 'setName', name: inputName.trim() });
  }, [inputName]);

  const onSocketClose = useCallback(() => {
    setIsConnected(false);
    setMembers([]);
    membersRef.current = [];
    setChatRows([]);
    setClientId('');
    clientIdRef.current = '';
    setIsGhost(false);
    isGhostRef.current = false;
  }, []);

  const onSocketMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data);

    if (data.clientId) {
      setClientId(data.clientId);
      clientIdRef.current = data.clientId;
    }

    if (data.members) {
      setMembers(data.members);
      membersRef.current = data.members;
      const me = data.members.find((m: Member) => m.id === clientIdRef.current);
      if (me) {
        setIsGhost(me.isGhost ?? false);
        isGhostRef.current = me.isGhost ?? false;
      }
    }

    if (data.action === 'verifyGhostResponse') {
      const { verified } = data;
      console.log('👻 Ghost verification response:', data);

      setGhostMessage({
        text: verified ? '👻 Ghost Mode Enabled!' : '❌ Incorrect passkey!',
        type: verified ? 'success' : 'error',
      });

      setIsGhost(verified);
      isGhostRef.current = verified;
    }

    if (data.publicMessage) {
      const [from, ...msgParts] = data.publicMessage.split(': ');
      const msg = msgParts.join(': ');
      const isSender = data.senderId === clientIdRef.current;

      setChatRows((prev) => [
        ...prev,
        <div className={isSender ? 'my-message' : 'public-message'} key={Date.now() + Math.random()}>
          {isSender ? ` ${msg} ` : (<><span className="sender-inline">{from}:</span> {msg}</>)}
        </div>,
      ]);
    }

    if (data.privateMessage) {
      const isToMessage = data.privateMessage.startsWith('To ');
      const label = isToMessage ? '(Private) To' : '(Private)';
      const msgParts = data.privateMessage.replace(/^To /, '').split(': ');
      const targetOrFrom = msgParts[0];
      const msg = msgParts.slice(1).join(': ');

      setChatRows((prev) => [
        ...prev,
        <div className={`private-message ${isToMessage ? 'self' : ''}`} key={Date.now() + Math.random()}>
          <b>{label} {targetOrFrom}:</b> {msg}
        </div>,
      ]);
    }

    if (data.ghostView && isGhostRef.current) {
      const match = data.ghostView.match(/\(Private\) (.+) TO (.+):/);
      const ghostSender = match?.[1]?.trim();
      const ghostReceiver = match?.[2]?.trim();

      const self = membersRef.current.find((m) => m.id === clientIdRef.current);
      if (self && self.name !== ghostSender && self.name !== ghostReceiver) {
        setChatRows((prev) => [
          ...prev,
          <div className="private-message ghost-view" key={Date.now() + Math.random()}>
            {data.ghostView}
          </div>,
        ]);
      }
    }

    if (data.systemMessage) {
      const msg = data.systemMessage;
      const styleClass = msg.includes('left') ? 'leave-message' : 'join-message';

      if (msg === 'Ghost mode disabled.') {
        setGhostMessage({ text: '🚫 Ghost Mode Disabled.', type: 'success' });
        setIsGhost(false);
        isGhostRef.current = false;
      }

      setChatRows((prev) => [
        ...prev,
        <div className={styleClass} key={Date.now() + Math.random()}>
          {msg}
        </div>,
      ]);
    }

  }, []);

  const onConnect = useCallback(() => {
    if (socket.current?.readyState !== WebSocket.OPEN) {
      socket.current = new WebSocket(WEBSOCKET_URL);
      socket.current.addEventListener('open', onSocketOpen);
      socket.current.addEventListener('close', onSocketClose);
      socket.current.addEventListener('message', onSocketMessage);
    }
  }, [onSocketOpen, onSocketClose, onSocketMessage]);

  const onDisconnect = useCallback(() => {
    socket.current?.close();
  }, []);

  const onPublicMessage = useCallback(() => {
    if (publicMessage.trim()) {
      sendMessage({ action: 'sendPublic', message: publicMessage.trim() });
      setPublicMessage('');
      publicInputRef.current?.focus();
    }
  }, [publicMessage]);

  const onPrivateMessage = useCallback((to: Member) => {
    if (privateMessage.trim()) {
      sendMessage({ action: 'sendPrivate', to: to.name, message: privateMessage.trim() });
      setPrivateMessage('');
      setShowPrivatePopup(false);
      publicInputRef.current?.focus();
    }
  }, [privateMessage]);

  const enableGhostMode = () => {
    setShowGhostPassPopup(true);
  };

  const submitGhostPass = () => {
    if (ghostPass.trim()) {
      sendMessage({ action: 'verifyGhost', passkey: ghostPass.trim() });
      setGhostPass('');
      setShowGhostPassPopup(false);
    }
  };

  const disableGhostMode = () => {
    sendMessage({ action: 'disableGhost' });
  };

  useEffect(() => {
    return () => {
      socket.current?.close();
    };
  }, []);

  return (
    <>
      <ChatUI
        isConnected={isConnected}
        clientId={clientId}
        members={members}
        chatRows={[...chatRows, <div key="end" ref={chatEndRef} />]}
        onPublicMessage={onPublicMessage}
        onPrivateMessage={onPrivateMessage}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        inputName={inputName}
        setInputName={setInputName}
        publicMessage={publicMessage}
        setPublicMessage={setPublicMessage}
        privateTarget={privateTarget}
        setPrivateTarget={setPrivateTarget}
        privateMessage={privateMessage}
        setPrivateMessage={setPrivateMessage}
        showPrivatePopup={showPrivatePopup}
        setShowPrivatePopup={setShowPrivatePopup}
        joinInputRef={joinInputRef}
        publicInputRef={publicInputRef}
        privateInputRef={privateInputRef}
        isGhost={isGhost}
        enableGhostMode={enableGhostMode}
        disableGhostMode={disableGhostMode}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />

      {showGhostPassPopup && (
        <div className="private-popup">
          <div className="popup-content">
            <h3>Enter Ghost Mode Passkey</h3>
            <input
              type="password"
              placeholder="Passkey"
              value={ghostPass}
              onChange={(e) => setGhostPass(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitGhostPass();
                if (e.key === 'Escape') setShowGhostPassPopup(false);
              }}
            />
            <div className="popup-buttons">
              <button onClick={submitGhostPass}>Verify</button>
              <button onClick={() => setShowGhostPassPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {ghostMessage && (
        <div className={`ghost-toast ${ghostMessage.type}`}>
          {ghostMessage.text}
        </div>
      )}
    </>
  );
};

export default App;
