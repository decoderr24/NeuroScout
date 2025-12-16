import { ProjectIdea } from '../types';

const STORAGE_KEY = 'neuroscout_saved_projects';

export const getSavedProjects = (): ProjectIdea[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load projects", e);
    return [];
  }
};

export const saveProject = (idea: ProjectIdea): boolean => {
  try {
    const saved = getSavedProjects();
    if (saved.some(p => p.id === idea.id)) return false;
    
    const updated = [idea, ...saved];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error("Failed to save project", e);
    return false;
  }
};

export const removeProject = (id: string): void => {
  try {
    const saved = getSavedProjects();
    const updated = saved.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to remove project", e);
  }
};

export const isProjectSaved = (id: string): boolean => {
    const saved = getSavedProjects();
    return saved.some(p => p.id === id);
};
