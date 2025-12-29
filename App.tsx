
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, MessageRole, SolveResponse, ExplanationLevel, ChatHistoryItem } from './types';
import { solveMathProblem } from './services/geminiService';
import DrawingBoard from './components/DrawingBoard';
import MathResponse from './components/MathResponse';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('standard');
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('math_solver_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSolving]);

  const saveToHistory = (title: string, lastMsg: string) => {
    const newItem: ChatHistoryItem = {
      id: Date.now().toString(),
      title: title.length > 30 ? title.substring(0, 30) + '...' : title,
      timestamp: Date.now(),
      lastMessage: lastMsg
    };
    const updated = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem('math_solver_history', JSON.stringify(updated));
  };

  const handleSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[\$\*\#]/g, ''));
      utterance.voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('en')) || null;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processSolution = async (text: string, image: string | null) => {
    if (isSolving) return;
    setIsSolving(true);
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text || "Help me solve this image.",
      image: image || undefined,
      timestamp: Date.now(),
      type: image ? 'image' : 'text'
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSelectedImage(null);
    setShowDrawing(false);

    try {
      const responseData = await solveMathProblem(text, explanationLevel, image || undefined);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content: JSON.stringify(responseData),
        timestamp: Date.now(),
        metadata: responseData
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      saveToHistory(responseData.description || text || "Math Problem", responseData.finalAnswer);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content: "I ran into a problem calculation. Please check your connection or try a different question.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsSolving(false);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() && !selectedImage) return;
    processSolution(inputValue, selectedImage);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.onresult = (event: any) => setInputValue(event.results[0][0].transcript);
      recognition.start();
    } else {
      alert("Voice input not supported.");
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      {/* Sidebar - History */}
      <aside className={`fixed lg:relative z-40 h-full bg-white border-r border-slate-200 transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0 lg:w-20'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-4 flex items-center justify-between min-w-[320px]">
            <h2 className="font-bold text-slate-800 text-sm uppercase tracking-widest">History</h2>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-2 min-w-[320px]">
            {history.map(item => (
              <button 
                key={item.id}
                onClick={() => {/* Load history logic if needed */}}
                className="w-full text-left p-4 rounded-2xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 mb-1 group-hover:text-indigo-600">{item.title}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">{item.lastMessage}</div>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 min-w-[320px]">
            <button onClick={() => {setMessages([]); setHistory([]); localStorage.removeItem('math_solver_history');}} className="text-xs text-red-400 font-bold hover:text-red-600">Clear All History</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>
              </div>
              <h1 className="font-black text-lg text-slate-800 tracking-tighter">DB MATHSOLVER<span className="text-indigo-600">.AI</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['quick', 'standard', 'deep'] as ExplanationLevel[]).map(lvl => (
                  <button 
                    key={lvl}
                    onClick={() => setExplanationLevel(lvl)}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${explanationLevel === lvl ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {lvl}
                  </button>
                ))}
             </div>
             <button onClick={() => setMessages([])} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
             </button>
          </div>
        </header>

        {/* Chat Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 scroll-smooth bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20 rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                </div>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Solve anything math.</h2>
              <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">Snap, Draw or Type your homework problems for instant, step-by-step tutoring powered by AI.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
                {[
                  { label: "Photo Solver", desc: "Snap & Solve", icon: "📷", action: () => fileInputRef.current?.click() },
                  { label: "Drawing Board", desc: "Digital Ink", icon: "🎨", action: () => setShowDrawing(true) },
                  { label: "Voice Query", desc: "Speak Math", icon: "🎙️", action: startVoiceInput }
                ].map((btn, idx) => (
                  <button key={idx} onClick={btn.action} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group active:scale-95 text-left">
                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{btn.icon}</div>
                    <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600">{btn.label}</div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">{btn.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] lg:max-w-[70%] p-6 md:p-8 rounded-[2rem] shadow-sm transition-all ${
                msg.role === MessageRole.USER 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-indigo-100/50'
              }`}>
                {msg.role === MessageRole.USER ? (
                  <div className="space-y-4">
                    {msg.image && <img src={msg.image} className="max-w-full h-auto rounded-2xl border-4 border-white/20 shadow-lg mb-4" alt="Captured Problem" />}
                    <p className="text-base md:text-lg font-medium leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div>
                    {msg.metadata ? (
                      <MathResponse data={msg.metadata} onSpeech={handleSpeech} />
                    ) : (
                      <p className="text-base leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                )}
                <div className={`text-[10px] mt-4 font-black uppercase tracking-widest opacity-40 ${msg.role === MessageRole.USER ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isSolving && (
            <div className="flex justify-start">
              <div className="bg-white rounded-[2rem] rounded-tl-none border border-slate-200 p-8 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">Architecting Solution...</span>
                </div>
                <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Floating Input Controls */}
        <footer className="px-4 pb-6 pt-2 bg-transparent sticky bottom-0 z-30 pointer-events-none">
          <div className="max-w-3xl mx-auto w-full bg-white/95 backdrop-blur-xl border border-slate-200 p-3 rounded-[2.5rem] shadow-2xl pointer-events-auto flex items-center gap-2 group focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            <div className="flex gap-1 pl-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all" title="Upload Image">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </button>
              <button onClick={() => setShowDrawing(true)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all" title="Drawing Board">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3 7.22 9-5.22 8h-4l-5.22-8L12 3Z"/></svg>
              </button>
            </div>
            
            <div className="flex-1 relative">
              {selectedImage && (
                <div className="absolute -top-16 left-0 bg-indigo-600 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-3 border-2 border-white animate-in zoom-in slide-in-from-bottom-2">
                  <img src={selectedImage} className="w-8 h-8 rounded-lg object-cover" alt="Selected" />
                  <span className="text-xs font-bold">Image Attached</span>
                  <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-white/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              )}
              <input 
                type="text" 
                placeholder="Type any math problem (e.g. solve 2x + 5 = 15)" 
                className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-medium px-2 py-3 placeholder:text-slate-300"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>
            
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setSelectedImage(reader.result as string);
                reader.readAsDataURL(file);
              }
            }} />

            <div className="flex gap-2 pr-2">
              <button onClick={startVoiceInput} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </button>
              <button 
                disabled={isSolving || (!inputValue.trim() && !selectedImage)}
                onClick={handleSend}
                className="w-14 h-14 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-200 active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Drawing Overlay */}
      {showDrawing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg">
            <DrawingBoard 
              onCancel={() => setShowDrawing(false)}
              onCapture={(data) => {
                setSelectedImage(data);
                setShowDrawing(false);
              }} 
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
};

export default App;
