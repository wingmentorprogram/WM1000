export enum Page {
  DASHBOARD = 'DASHBOARD', // The Six Pack Menu
  PFD = 'PFD', // Primary Flight Display
  HANDBOOK = 'HANDBOOK',
  EXAMS = 'EXAMS',
  SIMULATOR = 'SIMULATOR',
  COMMS = 'COMMS',
  FORUM = 'FORUM',
  BLACKBOX = 'BLACKBOX',
  PROFILE = 'PROFILE',
}

export enum ExamType {
  PPL = 'PPL',
  CPL = 'CPL',
  IR = 'IR',
  ME = 'ME',
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  dateUnlocked?: string;
}

export interface SimulatorSession {
  id: string;
  name: string;
  type: string;
  status: 'Available' | 'Maintenance' | 'In Use';
  image: string;
}

export interface ForumPost {
  id: string;
  author: string;
  title: string;
  content: string;
  replies: number;
  views: number;
  tags: string[];
  timestamp: string;
}

// FIX: Added missing ChatMessage interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
