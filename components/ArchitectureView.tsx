import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProjectIdea, ArchitecturePlan, ResourceData, ChatMessage } from '../types';
import { generateArchitecturePlan, findResources, generateStarterCode, generateProjectImage, createChatSession } from '../services/gemini';
import { DatabaseIcon, SparklesIcon, ChevronRightIcon, CodeIcon, MessageSquareIcon, ImageIcon, SendIcon, CopyIcon, CheckIcon } from './Icons';
import { Chat } from '@google/genai';

interface Props {
  idea: ProjectIdea;
  onBack: () => void;
}

type Tab = 'blueprint' | 'code' | 'resources' | 'chat';

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');

    const handleCopy = () => {
         navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
    };

    if (inline) {
        return <code className="bg-slate-800/50 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
    }

    return (
        <div className="relative group my-6 rounded-xl overflow-hidden border border-slate-700/50 bg-[#0d1117] shadow-2xl">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-slate-800/40 px-4 py-2.5 border-b border-slate-700/50 backdrop-blur-sm">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-600/50"></div>
                </div>
                <div className="flex items-center gap-3">
                     <span className="text-xs text-slate-500 font-mono font-medium uppercase tracking-wider">{match?.[1] || 'text'}</span>
                     <button 
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${copied ? 'bg-green-500/10 text-green-400' : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                     >
                        {copied ? (
                            <CheckIcon className="w-3.5 h-3.5" />
                        ) : (
                            <CopyIcon className="w-3.5 h-3.5" />
                        )}
                        {copied ? 'Copied' : 'Copy'}
                     </button>
                </div>
            </div>
            {/* Content */}
            <div className="p-4 overflow-x-auto">
                <code className={`font-mono text-sm leading-relaxed text-slate-300 ${className}`} {...props}>
                    {children}
                </code>
            </div>
        </div>
    );
}

const PreBlock = ({ children }: any) => {
    return (
        <div className="not-prose">
            <pre className="overflow-x-auto p-0 rounded-lg bg-transparent">{children}</pre>
        </div>
    );
};

const ArchitectureView: React.FC<Props> = ({ idea, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('blueprint');
  
  // Data States
  const [plan, setPlan] = useState<ArchitecturePlan | null>(null);
  const [resources, setResources] = useState<ResourceData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  // Chat States
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Execute parallel requests
        const [planData, resourceData] = await Promise.all([
          generateArchitecturePlan(idea.title, idea.description),
          findResources(idea.title)
        ]);

        if (mounted) {
          setPlan(planData);
          setResources(resourceData);
          // Initialize Chat
          setChatSession(createChatSession(idea.title, idea.description));
          // Start Image Gen in background
          generateImage();
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [idea]);

  const generateImage = async () => {
      setImageLoading(true);
      try {
        const url = await generateProjectImage(idea.title, idea.description);
        setImageUrl(url);
      } catch(e) {
          console.error(e);
      } finally {
          setImageLoading(false);
      }
  }

  const handleGenerateCode = async () => {
    setCodeLoading(true);
    try {
        const code = await generateStarterCode(idea.title, idea.techStack);
        setGeneratedCode(code);
    } catch (e) {
        console.error(e);
    } finally {
        setCodeLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMsg.trim() || !chatSession) return;

      const userMsg = inputMsg;
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setInputMsg('');
      setChatLoading(true);

      try {
        const response = await chatSession.sendMessage({ message: userMsg });
        setMessages(prev => [...prev, { role: 'model', text: response.text || "Sorry, I couldn't answer that." }]);
      } catch (e) {
        console.error(e);
      } finally {
        setChatLoading(false);
      }
  };

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const markdownComponents = {
      code: CodeBlock,
      pre: PreBlock
  };

  return (
    <div className="animate-fade-in-up w-full max-w-6xl mx-auto flex flex-col h-[calc(100vh-100px)]">
      {/* Top Navigation Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 flex-shrink-0">
         <button 
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-white transition-colors gap-2 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-800"
        >
            <ChevronRightIcon className="w-4 h-4 rotate-180" />
            Back
        </button>

        <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
             {[
                 { id: 'blueprint', icon: SparklesIcon, label: 'Blueprint' },
                 { id: 'code', icon: CodeIcon, label: 'Code' },
                 { id: 'resources', icon: DatabaseIcon, label: 'Resources' },
                 { id: 'chat', icon: MessageSquareIcon, label: 'Assistant' }
             ].map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-slate-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                 >
                     <tab.icon className="w-4 h-4" />
                     {tab.label}
                 </button>
             ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden shadow-2xl relative flex flex-col">
        
        {loading && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-300 text-lg font-medium animate-pulse">Architecting Solution...</p>
            </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
            
            {/* Header Info (Always visible or stickied? No, just scrollable) */}
            <div className="mb-8 border-b border-slate-700 pb-6">
                 <div className="flex justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{idea.title}</h1>
                        <p className="text-indigo-400 text-lg">{idea.oneLiner}</p>
                    </div>
                 </div>
            </div>

            {activeTab === 'blueprint' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    <div className="lg:col-span-2">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <SparklesIcon className="text-indigo-400" /> System Design
                        </h2>
                        <div className="markdown-content prose prose-invert max-w-none">
                            {plan && <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{plan.markdownContent}</ReactMarkdown>}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                             <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-purple-400" /> UI Mockup
                             </h3>
                             <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center relative group">
                                {imageLoading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <span className="text-xs text-purple-400">Generating 2K Mockup...</span>
                                    </div>
                                ) : imageUrl ? (
                                    <>
                                        <img src={imageUrl} alt="UI Mockup" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <span className="text-xs text-white/80 font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm">Gemini 3.0 Pro Image</span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-xs text-slate-500">Failed to load image</span>
                                )}
                             </div>
                        </div>
                        
                        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                            <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Tech Stack</h3>
                            <div className="flex flex-wrap gap-2">
                                {idea.techStack.map(t => (
                                    <span key={t} className="px-3 py-1 bg-slate-900 border border-slate-600 rounded-full text-xs text-slate-300">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'code' && (
                <div className="animate-fade-in">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <CodeIcon className="text-pink-400" /> Implementation Guide
                        </h2>
                        {!generatedCode && !codeLoading && (
                            <button 
                                onClick={handleGenerateCode}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                Generate Starter Code
                            </button>
                        )}
                    </div>

                    {codeLoading && (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                            <p className="text-slate-200 font-semibold text-xl mb-2">Thinking...</p>
                            <p className="text-slate-500 max-w-sm">Gemini 3.0 Pro is architecting your folder structure and writing production-ready code.</p>
                        </div>
                    )}

                    {generatedCode && (
                        <div className="markdown-content prose prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{generatedCode}</ReactMarkdown>
                        </div>
                    )}

                    {!generatedCode && !codeLoading && (
                        <div className="py-16 text-center bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                             <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <CodeIcon className="w-8 h-8 text-slate-600" />
                             </div>
                             <p className="text-slate-400 max-w-md mx-auto mb-6">
                                Ready to build? Click the button above to generate a complete starter kit including file structure, model training script, and API setup using Gemini 3.0 Pro.
                             </p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'resources' && (
                <div className="animate-fade-in max-w-4xl">
                     <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <DatabaseIcon className="text-emerald-400" /> Datasets & Research
                     </h2>
                     
                     {resources?.datasetsContent ? (
                        <div className="markdown-content prose prose-invert max-w-none bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
                             <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{resources.datasetsContent}</ReactMarkdown>
                        </div>
                     ) : (
                         <div className="p-4 text-slate-500">No specific dataset recommendations generated.</div>
                     )}

                     {resources?.groundingLinks && resources.groundingLinks.length > 0 && (
                         <div className="mt-8">
                             <h3 className="text-lg font-semibold text-white mb-4">Referenced Sources</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resources.groundingLinks.map((link, i) => (
                                    <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-indigo-500/50 transition-all group">
                                        <div className="bg-slate-900 p-2 rounded-md">
                                            <DatabaseIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="text-sm font-medium text-slate-200 truncate group-hover:text-indigo-300">{link.title}</div>
                                            <div className="text-xs text-slate-500 truncate">{link.uri}</div>
                                        </div>
                                    </a>
                                ))}
                             </div>
                         </div>
                     )}
                </div>
            )}

            {activeTab === 'chat' && (
                <div className="animate-fade-in h-full flex flex-col h-[600px] md:h-auto">
                     <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                        {messages.length === 0 && (
                            <div className="text-center py-10 opacity-50">
                                <MessageSquareIcon className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                                <p className="text-slate-400">Ask me anything about this project!</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                                }`}>
                                    <div className="text-sm prose prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                             <div className="flex justify-start">
                                <div className="bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700 rounded-bl-none flex gap-2">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                     </div>
                     <form onSubmit={handleSendMessage} className="relative mt-auto">
                         <input 
                            type="text" 
                            value={inputMsg}
                            onChange={(e) => setInputMsg(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full bg-slate-800 text-white pl-4 pr-12 py-4 rounded-xl border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                            disabled={chatLoading}
                         />
                         <button 
                            type="submit"
                            disabled={!inputMsg.trim() || chatLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-700 transition-colors"
                         >
                             <SendIcon className="w-4 h-4" />
                         </button>
                     </form>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ArchitectureView;