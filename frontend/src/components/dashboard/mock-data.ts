import {
  BarChart3,
  CheckCircle2,
  CheckSquare,
  FolderKanban,
  FolderPlus,
  GitBranch,
  ListPlus,
  MessageSquare,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import type { ActivityItem } from './ActivityList';
import type { QuickAction } from './QuickActions';

// ── Metrics ─────────────────────────────────────────────────────────────────

interface Metric {
  label: string;
  value: string;
  delta: { value: number; period: string };
  icon: typeof FolderKanban;
}

export const METRICS: readonly Metric[] = [
  {
    label: 'Total Projects',
    value: '24',
    delta: { value: 12.5, period: 'vs last month' },
    icon: FolderKanban,
  },
  {
    label: 'Active Tasks',
    value: '47',
    delta: { value: 8.2, period: 'this week' },
    icon: CheckSquare,
  },
  {
    label: 'Completed Tasks',
    value: '312',
    delta: { value: 24.3, period: 'this quarter' },
    icon: CheckCircle2,
  },
  {
    label: 'Productivity Score',
    value: '87%',
    delta: { value: 4.1, period: 'this week' },
    icon: TrendingUp,
  },
];

// ── Recent activity ─────────────────────────────────────────────────────────

// Helper so timestamps slide with the wall clock — the demo always looks fresh.
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

export const RECENT_ACTIVITY: readonly ActivityItem[] = [
  {
    id: 'a1',
    actor: { name: 'Maria Lopez' },
    action: 'completed task',
    target: 'Update onboarding flow',
    timestamp: minutesAgo(4),
    icon: CheckCircle2,
  },
  {
    id: 'a2',
    actor: { name: 'Diego Fernandez' },
    action: 'created project',
    target: 'Q4 Roadmap',
    timestamp: minutesAgo(38),
    icon: FolderPlus,
  },
  {
    id: 'a3',
    actor: { name: 'Sofia Castro' },
    action: 'commented on',
    target: 'API Refactor',
    timestamp: hoursAgo(2),
    icon: MessageSquare,
  },
  {
    id: 'a4',
    actor: { name: 'Tomas Vargas' },
    action: 'merged branch into',
    target: 'main',
    timestamp: hoursAgo(5),
    icon: GitBranch,
  },
  {
    id: 'a5',
    actor: { name: 'Lucia Romero' },
    action: 'invited',
    target: 'Pablo Diaz to the workspace',
    timestamp: hoursAgo(9),
    icon: UserPlus,
  },
];

// ── Quick actions ──────────────────────────────────────────────────────────

export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    icon: FolderPlus,
    label: 'Create Project',
    description: 'Spin up a new project from a template or scratch.',
  },
  {
    icon: ListPlus,
    label: 'Add Task',
    description: 'Capture a follow-up, deadline, or reminder.',
  },
  {
    icon: BarChart3,
    label: 'View Reports',
    description: 'Dive into analytics across your workspace.',
  },
];
