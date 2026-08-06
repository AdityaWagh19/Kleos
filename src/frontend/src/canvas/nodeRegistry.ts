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
    borderColor: 'var(--color-warm-stone)',
    backgroundColor: 'var(--color-frosted-white)',
    labelColor: 'var(--color-charcoal-body)',
    icon: 'lightbulb',
    description: 'A concept or possibility',
  },
  evidence: {
    label: 'Evidence',
    borderStyle: 'solid',
    borderColor: 'var(--color-warm-stone)',
    backgroundColor: 'var(--color-frosted-white)',
    labelColor: 'var(--color-charcoal-body)',
    icon: 'article',
    description: 'A sourced claim from a dropped artifact',
  },
  assumption: {
    label: 'Assumption',
    borderStyle: 'dashed',
    borderColor: '#f5c842',
    backgroundColor: 'var(--color-frosted-white)',
    labelColor: 'var(--color-charcoal-body)',
    icon: 'help',
    description: 'A belief the AI made that is not directly sourced',
  },
  question: {
    label: 'Question',
    borderStyle: 'solid',
    borderColor: 'var(--color-quartz)',
    backgroundColor: 'var(--color-frosted-white)',
    labelColor: 'var(--color-charcoal-body)',
    icon: 'question_mark',
    description: 'An open question on the canvas',
  },
  constraint: {
    label: 'Constraint',
    borderStyle: 'solid',
    borderColor: '#e84040',
    backgroundColor: 'var(--color-frosted-white)',
    labelColor: 'var(--color-charcoal-body)',
    icon: 'block',
    description: 'A hard limit or requirement',
  },
  insight: {
    label: 'Insight',
    borderStyle: 'solid',
    borderColor: '#7dcfb6',
    backgroundColor: 'var(--color-frosted-white)',
    labelColor: 'var(--color-charcoal-body)',
    icon: 'psychology',
    description: 'A synthesized conclusion across multiple nodes',
  },
  decision: {
    label: 'Decision',
    borderStyle: 'solid',
    borderColor: '#4a90d9',
    backgroundColor: 'var(--color-frosted-white)',
    labelColor: 'var(--color-charcoal-body)',
    icon: 'check_circle',
    description: 'A committed choice, result of Commit Branch',
  },
  source: {
    label: 'Source',
    borderStyle: 'solid',
    borderColor: 'var(--color-warm-stone)',
    backgroundColor: 'var(--color-linen-canvas)',
    labelColor: 'var(--color-charcoal-body)',
    icon: 'folder',
    description: 'A dropped artifact — parent of extracted nodes',
  },
};

export const BADGE_COLORS: Record<string, string> = {
  document:     '#4a90d9',
  core_memory:  '#7dcfb6',
  ai_inference: '#f5c842',
  parametric:   '#e84040',
  user_created: 'var(--color-charcoal-body)',
  voice_input:  '#9a73d1',
};
