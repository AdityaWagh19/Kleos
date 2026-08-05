import type { NodeType } from '../types';

export interface NodeTypeConfig {
  label: string;
  borderStyle: 'solid' | 'dashed' | 'double';
  borderColor: string;
  backgroundColor: string;
  labelColor: string;
  icon: string;           // Material Symbols name
  description: string;
}

export const NODE_REGISTRY: Record<NodeType, NodeTypeConfig> = {
  idea: {
    label: 'Idea',
    borderStyle: 'solid',
    borderColor: '#565656',
    backgroundColor: '#2b2b2b',
    labelColor: '#f9f9f9',
    icon: 'lightbulb',
    description: 'A concept or possibility',
  },
  evidence: {
    label: 'Evidence',
    borderStyle: 'solid',
    borderColor: '#4a90d9',
    backgroundColor: '#2b2b2b',
    labelColor: '#f9f9f9',
    icon: 'article',
    description: 'A sourced claim from a dropped artifact',
  },
  assumption: {
    label: 'Assumption',
    borderStyle: 'dashed',
    borderColor: '#e5ff5d',
    backgroundColor: '#2b2b2b',
    labelColor: '#f9f9f9',
    icon: 'help',
    description: 'A belief the AI made that is not directly sourced',
  },
  question: {
    label: 'Question',
    borderStyle: 'solid',
    borderColor: '#9c9c9c',
    backgroundColor: '#2b2b2b',
    labelColor: '#9c9c9c',
    icon: 'question_mark',
    description: 'An open question on the canvas',
  },
  constraint: {
    label: 'Constraint',
    borderStyle: 'solid',
    borderColor: '#d97b4a',
    backgroundColor: '#3a2a1a',
    labelColor: '#f9f9f9',
    icon: 'block',
    description: 'A hard limit or requirement',
  },
  insight: {
    label: 'Insight',
    borderStyle: 'solid',
    borderColor: '#7dcfb6',
    backgroundColor: '#2b2b2b',
    labelColor: '#f9f9f9',
    icon: 'psychology',
    description: 'A synthesized conclusion across multiple nodes',
  },
  decision: {
    label: 'Decision',
    borderStyle: 'solid',
    borderColor: '#f9f9f9',
    backgroundColor: '#1a1a1a',
    labelColor: '#f9f9f9',
    icon: 'check_circle',
    description: 'A committed choice, result of Commit Branch',
  },
  source: {
    label: 'Source',
    borderStyle: 'solid',
    borderColor: '#565656',
    backgroundColor: '#1f2329',
    labelColor: '#9c9c9c',
    icon: 'folder',
    description: 'A dropped artifact — parent of extracted nodes',
  },
};

export const BADGE_COLORS: Record<string, string> = {
  document:     '#4a90d9',
  core_memory:  '#4caf7d',
  ai_inference: '#f5c842',
  parametric:   '#e84040',
  user_created: '#f9f9f9',
  voice_input:  '#e5ff5d',
};
