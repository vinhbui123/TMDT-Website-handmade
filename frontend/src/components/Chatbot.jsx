import { useState, useRef, useEffect } from 'react';
import '../assets/css/Chatbot.css';

const QUICK_QUESTIONS = [
  '🛍️ Sản phẩm bán chạy?',
  '💰 Sản phẩm đang giảm giá?',
  '🎁 Tư vấn quà tặng',
  '📦 Chính sách đổi trả',
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 400);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || isLoading) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for API (exclude the current message, it's sent separately)
      const history = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history })
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau! 🙏'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (question) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        id="chatbot-toggle"
        className={`chatbot-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat với AI tư vấn"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window" id="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">🤖</div>
            <div className="chatbot-header-info">
              <div className="chatbot-header-title">Handmade Shop AI</div>
              <div className="chatbot-header-status">Đang hoạt động</div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" id="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                <div className="chatbot-welcome-icon">🎨</div>
                <h4>Xin chào! 👋</h4>
                <p>Mình là trợ lý AI của Handmade Shop. Hãy hỏi mình về sản phẩm, giá cả, hay bất kỳ điều gì bạn muốn biết nhé!</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.role !== 'user' && (
                  <div className="chatbot-msg-avatar">🤖</div>
                )}
                <div className="chatbot-msg-bubble">{msg.content}</div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-typing">
                <div className="chatbot-msg-avatar" style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ee4d2d, #ff6f47)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14
                }}>🤖</div>
                <div className="chatbot-typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (show only when no messages) */}
          {messages.length === 0 && (
            <div className="chatbot-quick-actions">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} className="chatbot-quick-btn" onClick={() => handleQuickAction(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              className="chatbot-input"
              type="text"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              id="chatbot-input"
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              id="chatbot-send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
