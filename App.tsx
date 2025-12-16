import React, { useState, useEffect } from 'react';
import { ProjectIdea, DifficultyLevel } from './types';
import { generateProjectIdeas } from './services/gemini';
import { getSavedProjects, saveProject, removeProject, isProjectSaved } from './services/storage';
import ProjectCard from './components/ProjectCard';
import ArchitectureView from './components/ArchitectureView';
import ChatWidget from './components/ChatWidget';
import { SparklesIcon, SearchIcon, BookmarkIcon, ChevronRightIcon, NeuroScoutLogo } from './components/Icons';

type ViewMode = 'search' | 'saved';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [view, setView] = useState<ViewMode>('search');
  
  const [topic, setTopic] = useState("Healthcare Diagnosis");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);
  const [userLevel, setUserLevel] = useState<DifficultyLevel>(DifficultyLevel.Intermediate);

  const [savedIdeas, setSavedIdeas] = useState<ProjectIdea[]>([]);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for dev environments without the wrapper
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  // Load saved projects on mount or when view changes
  useEffect(() => {
    setSavedIdeas(getSavedProjects());
  }, [view]);

  const handleConnect = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setIdeas([]);
    setSelectedIdea(null);
    setView('search');
    
    try {
      const generatedIdeas = await generateProjectIdeas(topic, userLevel);
      setIdeas(generatedIdeas);
    } catch (error) {
      console.error("Failed to generate ideas", error);
      alert("Something went wrong while contacting the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (idea: ProjectIdea) => {
    const isAlreadySaved = isProjectSaved(idea.id);
    if (isAlreadySaved) {
        removeProject(idea.id);
    } else {
        saveProject(idea);
    }
    setSavedIdeas(getSavedProjects()); // Refresh
  };

  const handleRemove = (idea: ProjectIdea) => {
      removeProject(idea.id);
      setSavedIdeas(getSavedProjects());
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
         {/* Background decoration */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-lg">
          <div className="mb-8 flex justify-center">
            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl shadow-blue-500/20">
              <NeuroScoutLogo className="w-20 h-20 text-blue-500" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">NeuroScout</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Your advanced AI architect for building production-ready Machine Learning projects. 
            To access the Gemini 3.0 Pro & Image Generation models, please connect your Google Cloud API key.
          </p>
          <button 
            onClick={handleConnect}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
          >
            Connect with Google AI
            <ChevronRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex justify-center mb-6">
             <NeuroScoutLogo className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200">
            NeuroScout
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-8">
            Your personal AI Architect for Machine Learning Final Year Projects.
          </p>

          {/* Navigation Tabs */}
          {!selectedIdea && (
            <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 mb-8">
                <button 
                    onClick={() => setView('search')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        view === 'search' 
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <SearchIcon className="w-4 h-4" />
                    Scout
                </button>
                <button 
                    onClick={() => setView('saved')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        view === 'saved' 
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <BookmarkIcon className="w-4 h-4" filled={view === 'saved'} />
                    Saved Projects
                    {savedIdeas.length > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{savedIdeas.length}</span>
                    )}
                </button>
            </div>
          )}
        </header>

        {!selectedIdea ? (
          <>
            {view === 'search' && (
                <>
                {/* Search Section */}
                <div className="max-w-2xl mx-auto mb-16 animate-fade-in-up">
                <form onSubmit={handleGenerate} className="bg-slate-900/80 backdrop-blur-sm p-2 rounded-2xl border border-slate-700 shadow-2xl shadow-blue-500/5">
                    <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1 relative">
                        <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Smart Agriculture, Financial Fraud, Sign Language"
                        className="w-full bg-slate-800 text-white placeholder-slate-500 pl-6 pr-6 md:pr-40 py-4 rounded-xl border border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
                            <select 
                                value={userLevel} 
                                onChange={(e) => setUserLevel(e.target.value as DifficultyLevel)}
                                className="bg-slate-900 border-none text-xs text-slate-400 py-1 px-2 rounded cursor-pointer hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            >
                                {Object.values(DifficultyLevel).map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !topic}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                    >
                        {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                        <>
                            <SearchIcon className="w-5 h-5" />
                            <span>Scout</span>
                        </>
                        )}
                    </button>
                    </div>
                    <div className="md:hidden mt-2 px-1">
                        <select 
                            value={userLevel} 
                            onChange={(e) => setUserLevel(e.target.value as DifficultyLevel)}
                            className="w-full bg-slate-800 text-slate-300 py-2 px-4 rounded-lg text-sm border border-slate-700 focus:outline-none focus:border-blue-500"
                        >
                            {Object.values(DifficultyLevel).map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </form>
                </div>

                {/* Results Grid */}
                {ideas.length > 0 && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-2xl font-bold text-white">Project Proposals</h2>
                    <span className="text-sm text-slate-500">{ideas.length} results found</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ideas.map((idea) => (
                        <ProjectCard 
                        key={idea.id} 
                        idea={idea} 
                        onSelect={setSelectedIdea}
                        isSaved={isProjectSaved(idea.id)}
                        onToggleSave={toggleSave}
                        />
                    ))}
                    </div>
                </div>
                )}

                {ideas.length === 0 && !loading && (
                <div className="text-center py-20 opacity-50">
                    <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <SparklesIcon className="w-10 h-10 text-slate-600" />
                    </div>
                    <p className="text-slate-400">Enter a domain or interest above to get started.</p>
                </div>
                )}
                
                <ChatWidget topic={topic} ideas={ideas} />
                </>
            )}

            {view === 'saved' && (
                 <div className="animate-fade-in max-w-6xl mx-auto">
                    {savedIdeas.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedIdeas.map((idea) => (
                            <ProjectCard 
                            key={idea.id} 
                            idea={idea} 
                            onSelect={setSelectedIdea}
                            isSaved={true}
                            onRemove={handleRemove}
                            />
                        ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                             <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <BookmarkIcon className="w-8 h-8 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-300 mb-2">No saved projects yet</h3>
                            <p className="text-slate-500">Bookmark interesting ideas from the Scout tab to save them here.</p>
                        </div>
                    )}
                 </div>
            )}
          </>
        ) : (
          <ArchitectureView 
            idea={selectedIdea} 
            onBack={() => setSelectedIdea(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default App;