import React from 'react';
import { ProjectIdea, DifficultyLevel } from '../types';
import { BrainCircuitIcon, BookmarkIcon, TrashIcon } from './Icons';

interface Props {
  idea: ProjectIdea;
  onSelect: (idea: ProjectIdea) => void;
  isSaved?: boolean;
  onToggleSave?: (idea: ProjectIdea) => void;
  onRemove?: (idea: ProjectIdea) => void;
}

const ProjectCard: React.FC<Props> = ({ idea, onSelect, isSaved, onToggleSave, onRemove }) => {
  const difficultyColor = {
    [DifficultyLevel.Beginner]: 'bg-green-500/20 text-green-300 border-green-500/30',
    [DifficultyLevel.Intermediate]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    [DifficultyLevel.Advanced]: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSave) onToggleSave(idea);
  };
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove(idea);
  };

  return (
    <div className="group relative bg-slate-800 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 overflow-hidden flex flex-col h-full animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${difficultyColor[idea.difficulty]}`}>
            {idea.difficulty}
          </span>
          <div className="flex items-center gap-2">
            {onToggleSave && (
                <button 
                    onClick={handleSaveClick}
                    className={`p-1.5 rounded-md transition-colors ${isSaved ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-indigo-400 hover:bg-slate-700'}`}
                    title={isSaved ? "Saved" : "Save Project"}
                >
                    <BookmarkIcon className="w-5 h-5" filled={isSaved} />
                </button>
            )}
            {onRemove && (
                <button 
                    onClick={handleRemoveClick}
                    className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                    title="Remove"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            )}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-slate-100 mb-2">{idea.title}</h3>
        <p className="text-sm text-indigo-300 mb-4 font-medium italic">{idea.oneLiner}</p>
        <p className="text-slate-400 text-sm mb-6 flex-1 leading-relaxed">
          {idea.description}
        </p>

        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tech Stack</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {idea.techStack.slice(0, 3).map(tech => (
                <span key={tech} className="text-xs bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700">
                  {tech}
                </span>
              ))}
              {idea.techStack.length > 3 && (
                <span className="text-xs text-slate-500 px-1 py-1">+{idea.techStack.length - 3}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-800/50 border-t border-slate-700">
        <button 
          onClick={() => onSelect(idea)}
          className="w-full bg-slate-700 hover:bg-indigo-600 text-slate-200 hover:text-white py-2.5 rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2"
        >
          <BrainCircuitIcon className="w-4 h-4" />
          View Architecture
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
