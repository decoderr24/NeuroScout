import React, { useState, useEffect, useRef } from 'react';
import { ProjectIdea, ChatMessage } from '../types';
import { createGuideSession } from '../services/gemini';
import { MessageSquareIcon, SendIcon, XIcon, SparklesIcon } from './Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Chat } from '@google/genai';

interface Props {
  topic: string;
  ideas: ProjectIdea[];
}

const ChatWidget: React.FC<Props> = ({ topic, ideas }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or Reset chat when ideas/topic change heavily?
  // Actually, we should probably only init once or when ideas change.
  useEffect(() => {
    // Only reset chat if we have new context that matters significantly
    const newSession = createGuideSession(topic, ideas);
    setChatSession(newSession);
    
    // Add an initial greeting from the system (locally)
    setMessages([{
        role: 'model',
        text: ideas.length > 0 
            ? `I see you've found ${ideas.length} ideas for "${topic}". Need help choosing one or refining them?` 
            : "Hi! I can help you find a Machine Learning project topic. What are you interested in?"
    }]);
  }, [ideas, topic]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !chatSession) return;

    const userMsg = inputMsg;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputMsg('');
    setLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm having trouble connecting. Try again?" }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <SparklesIcon className="w-5 h-5" />
              <h3 className="font-bold text-sm">Project Advisor</h3>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
                }`}>
                    <div className="prose prose-invert max-w-none text-xs md:text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                        </ReactMarkdown>
                    </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                 <div className="bg-slate-700 rounded-2xl px-4 py-3 rounded-bl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="relative">
              <input 
                type="text" 
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Ask for advice..."
                className="w-full bg-slate-900 text-white pl-4 pr-10 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm"
              />
              <button 
                type="submit"
                disabled={!inputMsg.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 ${
            isOpen 
            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
            : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 hover:shadow-indigo-500/25'
        }`}
      >
        {isOpen ? (
            <>
                <XIcon className="w-5 h-5" />
                <span className="font-medium text-sm">Close</span>
            </>
        ) : (
            <>
                <MessageSquareIcon className="w-5 h-5" />
                <span className="font-medium text-sm">AI Assistant</span>
                {ideas.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                    </span>
                )}
            </>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;