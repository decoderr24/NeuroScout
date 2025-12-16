export enum DifficultyLevel {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Advanced = "Advanced"
}

export interface ProjectIdea {
  id: string;
  title: string;
  oneLiner: string;
  description: string;
  difficulty: DifficultyLevel;
  domain: string;
  keyFeatures: string[];
  techStack: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ArchitecturePlan {
  markdownContent: string;
  thinkingProcess?: string;
}

// Changed to string content for better flexibility with descriptions
export interface ResourceData {
  datasetsContent: string;
  papersContent: string;
  groundingLinks: GroundingSource[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
