import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, MapPin, Tent, Camper, Loader2, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cap avall quan hi ha missatges nous
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await axios.post('/api/chat', { message: userMsg });
      const botResponse = res.data.response || "No he rebut resposta.";
      setMessages(prev => [...prev, { role: 'assistant', content: botResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Error connectant amb el servidor. Revisa que el backend estigui actiu." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      
      {/* Contenidor Principal */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] border border-slate-200">
        
        {/* Capçalera */}
        <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Tent className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">Park4Night AI</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-slate-500 font-medium">Online</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            v1.0 Beta
          </div>
        </div>

        {/* Àrea de Xat */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <Camper className="w-16 h-16 text-slate-300" />
              <div className="space-y-1">
                <p className="text-lg font-medium text-slate-600">On vols dormir avui?</p>
                <p className="text-sm text-slate-400">Pregunta per càmpings, àrees o pàrquings...</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* Avatar AI */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
              )}

              {/* Bombolla Missatge */}
              <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed text-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
              }`}>
                {msg.content}
              </div>

              {/* Avatar User */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </div>
          ))}
          
          {/* Animació "Escrivint..." */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2 max-w-4xl mx-auto bg-slate-50 p-1.5 rounded-full border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <input
              type="text"
              className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-slate-700 placeholder-slate-400 text-sm"
              placeholder="Ex: Busca un lloc tranquil prop de Girona..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">L'AI pot cometre errors. Verifica la informació a l'app oficial.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
