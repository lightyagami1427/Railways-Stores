import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, User, Bot, History, Settings, HelpCircle, 
  FileText, Gavel, ShieldCheck, ChevronRight,
  Menu, X, Search, BookOpen, Download, ExternalLink,
  ChevronLeft, LayoutDashboard, Database, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Namaste. I am the Senior Stores Officer. I have indexed the latest IRSC Volume I & II. How can I assist you with Supply Tender compliance or Delegation of Powers today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSource, setActiveSource] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { 
      role: 'user', 
      content: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5010/api/chat', { message: input });
      const assistantMsg = { 
        role: 'assistant', 
        content: response.data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.data.source
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (response.data.source) {
        setActiveSource(response.data.source);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Error: The Stores Code engine is temporarily unavailable. Please ensure the backend is running on port 5010.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadReference = (source) => {
    if (!source) return;
    window.open(`http://localhost:5010/api/reference/${source.source}/${source.page}?t=${Date.now()}`, '_blank');
  };

  const formatMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Bold
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-500 font-bold font-mono">$1</strong>');
      // Lists
      if (line.trim().startsWith('* ')) {
        return <li key={i} className="ml-4 mb-2 list-disc" dangerouslySetInnerHTML={{ __html: formatted.replace('* ', '') }} />;
      }
      return <p key={i} className="mb-3" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-yellow-500/30">
      
      {/* Sidebar - Modern & Minimal */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-zinc-800/50 bg-[#0c0c0e] flex flex-col z-50 overflow-hidden shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-yellow-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(202,138,4,0.2)]">
                  <ShieldCheck className="w-5 h-5 text-black" />
                </div>
                <div className="leading-tight">
                  <p className="font-bold text-sm tracking-tight text-white">STORES AI</p>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">Official Advisor</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8">
              <nav className="space-y-1">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-yellow-600/10 text-yellow-500 text-xs font-semibold border border-yellow-600/20">
                  <LayoutDashboard size={16} />
                  <span>Main Terminal</span>
                </div>
                <a 
                  href="http://localhost:5010/api/ingest" 
                  target="_blank" 
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-yellow-600/10 hover:text-yellow-600 text-xs text-zinc-400 transition-colors cursor-pointer group"
                >
                  <Database size={16} />
                  <span>Ingest Documents</span>
                </a>
              </nav>

              <div className="p-4 rounded-2xl bg-[#141417]/50 border border-zinc-800/50">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Info size={10} /> Grounding Status
                 </p>
                 <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                   PDF Reference extraction is <strong>Standby</strong>. 
                 </p>
                 <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 space-y-2">
                    <p className="text-[9px] text-zinc-500 leading-tight">1. Place IRSC PDFs in <br/><code>/documents</code></p>
                    <p className="text-[9px] text-zinc-500 leading-tight">2. Click <strong>Ingest</strong> above</p>
                 </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-3">History</p>
                <div className="space-y-1">
                  {["LTE Procedures", "Para 321 Exception", "PAC Financial Rules"].map((term, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-800/30 text-[13px] text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer group">
                      <FileText size={14} className="opacity-50 group-hover:opacity-100" />
                      <span className="truncate">{term}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#09090b] border-t border-zinc-800/50">
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#141417] border border-zinc-800/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-[10px] font-bold text-black ring-2 ring-yellow-600/20">
                  SO
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate text-zinc-200">Senior Stores Officer</p>
                  <p className="text-[9px] text-zinc-500 font-medium">IR Official Profile</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[#09090b]">
        
        {/* Header - Bolt Style */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-900 bg-[#09090b]/50 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400">
                <Menu size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Supply Tender Advisory Engine
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              </h2>
              <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest">DeepSeek RAG Grounding</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-4 text-[11px] font-medium text-zinc-500 bg-[#141417] border border-zinc-800/50 px-4 py-1.5 rounded-full">
               Source: <span className="text-yellow-600">IRSC Vol I & II</span>
               <div className="w-px h-3 bg-zinc-800" />
               Index: <span className="text-zinc-300">Active</span>
            </div>
            <button className="flex items-center gap-2 text-xs font-bold bg-white text-black px-4 py-2 rounded-xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 active:scale-95">
              <Search size={14} />
              Quick Query
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 space-y-12 custom-scrollbar">
          <div className="max-w-[850px] mx-auto space-y-16 pb-20">
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={i} 
                className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-zinc-800 text-zinc-300' 
                    : 'bg-yellow-600 shadow-yellow-600/10 text-black'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <ShieldCheck size={20} />}
                </div>
                
                <div className={`flex flex-col gap-4 max-w-[85%] ${msg.role === 'user' ? 'items-end text-right' : 'items-start'}`}>
                  <div className={`px-6 py-5 rounded-3xl text-[15px] leading-[1.7] ${
                    msg.role === 'user' 
                      ? 'bg-[#18181b] text-zinc-200 border border-zinc-800' 
                      : 'text-zinc-300 font-medium'
                  }`}>
                    {formatMarkdown(msg.content)}

                    {/* Reference Indicator in Message */}
                    {msg.role === 'assistant' && (
                       msg.source ? (
                        <div className="mt-6 pt-6 border-t border-zinc-800/50 flex flex-wrap gap-3">
                           <button 
                             onClick={() => downloadReference(msg.source)}
                             className="flex items-center gap-2.5 px-4 py-2.5 bg-[#141417] hover:bg-[#1c1c21] rounded-2xl border border-yellow-600/20 transition-all text-[11px] font-bold text-yellow-500 group shadow-lg shadow-yellow-600/5"
                           >
                             <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                             Download Reference (PG {msg.source.page})
                           </button>
                           {msg.source.url && msg.source.url.startsWith('http') && (
                             <a 
                               href={msg.source.url} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center gap-2.5 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-500 rounded-2xl text-[11px] font-bold text-black transition-all shadow-lg shadow-yellow-600/10"
                             >
                               <ExternalLink size={14} />
                               Visit Official Source
                             </a>
                           )}
                           <button 
                             onClick={() => setActiveSource(msg.source)}
                             className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-800/30 rounded-2xl text-[11px] font-bold text-zinc-500 transition-all"
                           >
                             <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mr-1" />
                             View Evidence
                           </button>
                        </div>
                       ) : (
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest bg-zinc-900/30 w-fit px-3 py-1.5 rounded-lg border border-zinc-800/30">
                           <Info size={12} className="text-zinc-700" />
                           No PDF Reference Found (Grounding Inactive)
                        </div>
                       )
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-bold text-zinc-700 font-mono tracking-widest uppercase">{msg.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {loading && (
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800 animate-pulse" />
                <div className="space-y-3 pt-2">
                  <div className="h-3 w-72 bg-zinc-800 rounded-full animate-pulse" />
                  <div className="h-3 w-48 bg-zinc-800 rounded-full animate-pulse opacity-50" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Bar - Bolt Floating */}
        <div className="px-6 pb-8 md:px-12 md:pb-12 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pt-32 relative z-20">
          <div className="max-w-[850px] mx-auto">
             <div className="relative flex flex-col bg-[#141417] border border-zinc-800 rounded-[28px] overflow-hidden shadow-2xl focus-within:ring-1 focus-within:ring-yellow-600/30 focus-within:border-zinc-700 transition-all group">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 250) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask the Senior Stores Officer about Supply Tenders..."
                  className="w-full bg-transparent border-none focus:ring-0 text-[15px] p-6 pr-20 resize-none text-zinc-100 placeholder:text-zinc-600 custom-scrollbar leading-relaxed"
                />
                <div className="p-3 border-t border-zinc-800/50 flex items-center justify-between bg-[#0c0c0e]/50 backdrop-blur-md">
                   <div className="flex items-center gap-1.5 ml-2">
                      <button className="p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800">
                        <Database size={16} />
                      </button>
                      <div className="w-px h-4 bg-zinc-800 mx-1" />
                      <div className="flex gap-2">
                        {["LTE", "PAC", "Para 321"].map((chip) => (
                          <button key={chip} onClick={() => setInput(chip)} className="text-[10px] font-bold text-zinc-600 hover:text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg transition-all">
                            {chip}
                          </button>
                        ))}
                      </div>
                   </div>
                   <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-800/50 disabled:text-zinc-700 text-black px-5 py-2.5 rounded-2xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-yellow-600/5"
                  >
                    Generate Advice
                    <Send size={14} />
                  </button>
                </div>
             </div>
             <p className="text-center text-[10px] text-zinc-700 mt-6 font-bold tracking-[0.15em] uppercase">
                Official Indian Railways Stores Code RAG Node • Ver 2.0.0 (DeepSeek Active)
             </p>
          </div>
        </div>
      </main>

      {/* Side Reference Pane - Right Side */}
      <AnimatePresence>
        {activeSource && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-zinc-800/50 bg-[#0c0c0e] flex flex-col z-50 overflow-hidden relative"
          >
             <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                    <BookOpen size={16} className="text-yellow-600" />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight">Direct Evidence</h3>
                </div>
                <button onClick={() => setActiveSource(null)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500">
                  <X size={18} />
                </button>
             </div>

              <div className="flex-1 overflow-y-auto p-0 flex flex-col">
                 <div className="flex-1 bg-[#141417] flex flex-col">
                    <iframe 
                      src={`http://localhost:5010/api/reference/${activeSource.source}/${activeSource.page}?t=${Date.now()}`} 
                      className="flex-1 w-full border-none"
                      title="PDF Preview"
                    />
                 </div>
                 
                 <div className="p-6 bg-[#0c0c0e] border-t border-zinc-800/50 space-y-6">
                    <div className="flex justify-between items-center">
                       <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Source File</p>
                          <p className="text-[13px] font-bold text-zinc-100">{activeSource.source}</p>
                       </div>
                       <div className="bg-yellow-600/10 text-yellow-500 px-2 py-1 rounded text-[10px] font-bold border border-yellow-600/20">
                          PG {activeSource.page}
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                       <button 
                         onClick={() => downloadReference(activeSource)}
                         className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-black py-3 rounded-2xl text-xs font-bold transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
                       >
                         <Download size={14} />
                         Download Evidence Extract
                       </button>
                       {activeSource.url && activeSource.url.startsWith('http') && (
                          <a 
                            href={activeSource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-black py-3 rounded-2xl text-xs font-bold transition-all shadow-xl shadow-yellow-600/10 active:scale-[0.98]"
                          >
                            <ExternalLink size={14} />
                            Visit Official Source
                          </a>
                       )}
                    </div>
                 </div>
              </div>

             <div className="p-6 bg-[#09090b] border-t border-zinc-800/50">
                <p className="text-[10px] text-zinc-600 leading-relaxed text-center italic">
                  "This extraction provides the legislative basis for the advisor's response."
                </p>
             </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        textarea { height: 72px; }
      `}</style>
    </div>
  );
};

export default App;
