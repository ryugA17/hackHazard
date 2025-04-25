import React from 'react';
import './DungeonChat.css';

interface ChatMessage {
  role: 'user' | 'dm';
  content: string;
}

interface DungeonChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  onRollDice: (diceType: string) => void;
  waitingForDiceRoll?: boolean;
}

const DungeonChat: React.FC<DungeonChatProps> = ({
  chatHistory,
  onSendMessage,
  onRollDice,
  waitingForDiceRoll = false
}: DungeonChatProps) => {
  const [userInput, setUserInput] = React.useState<string>('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = React.useState<boolean>(true);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    onSendMessage(userInput);
    setUserInput('');
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="dungeon-chat">
      <div className="chat-header">
        <h3>Dungeon Master Chat</h3>
      </div>

      <div className="chat-messages">
        {chatHistory.length === 0 ? (
          <div className="welcome-message">
            <p>Welcome to the Dungeon Master Chat! Interact with the DM to guide your adventure.</p>
          </div>
        ) : (
          chatHistory.map((message: ChatMessage, index: number) => (
            <div key={index} className={`chat-message ${message.role}`}>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {showSuggestions && chatHistory.length < 2 && (
        <div className="suggestion-chips">
          <div className="suggestion-chip" onClick={() => handleSuggestionClick("Hello Dungeon Master")}>
            Hello Dungeon Master
          </div>
          <div className="suggestion-chip" onClick={() => handleSuggestionClick("Tell me about this world")}>
            Tell me about this world
          </div>
          <div className="suggestion-chip" onClick={() => handleSuggestionClick("I want to explore")}>
            I want to explore
          </div>
          <div className="suggestion-chip" onClick={() => handleSuggestionClick("Are there any quests?")}>
            Are there any quests?
          </div>
        </div>
      )}

      {waitingForDiceRoll && (
        <div className="dice-roll-prompt">
          <p>Roll a dice to determine the outcome:</p>
          <div className="dice-buttons">
            <button onClick={() => onRollDice('d4')}>d4</button>
            <button onClick={() => onRollDice('d6')}>d6</button>
            <button onClick={() => onRollDice('d8')}>d8</button>
            <button onClick={() => onRollDice('d10')}>d10</button>
            <button onClick={() => onRollDice('d12')}>d12</button>
            <button onClick={() => onRollDice('d20')}>d20</button>
          </div>
        </div>
      )}

      <div className="chat-input-container">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message to the Dungeon Master..."
          className="chat-input"
        />
        <button onClick={handleSendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default DungeonChat;
