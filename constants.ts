import { MindMapNode, Connection, TaskColumn, NodeShape, TaskPriority, User, NodeTemplate, MindMapText, BugReport, BugStatus, BugType, Label, UserRole } from './types';

const USER_COLORS = ['#f87171', '#60a5fa', '#4ade80', '#fbbf24'];

// No default users - users will be created by the real user
export const DEFAULT_USERS: User[] = [];


export const INITIAL_TEMPLATES: NodeTemplate[] = [
  {
    id: 'template-1',
    name: 'Core Idea',
    text: 'Core Idea',
    width: 200,
    height: 60,
    shape: NodeShape.Ellipse,
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  {
    id: 'template-2',
    name: 'Sub-Topic',
    text: 'Sub-Topic',
    width: 180,
    height: 50,
    shape: NodeShape.Rounded,
    backgroundColor: '#f0fdf4',
    borderColor: '#4ade80',
  },
  {
    id: 'template-3',
    name: 'Question',
    text: 'Question?',
    width: 180,
    height: 50,
    shape: NodeShape.Rounded,
    backgroundColor: '#fefce8',
    borderColor: '#facc15',
  },
  {
    id: 'template-4',
    name: 'Action Item',
    text: 'To-Do',
    width: 180,
    height: 50,
    shape: NodeShape.Rectangle,
    backgroundColor: '#f1f5f9',
    borderColor: '#64748b',
  },
  {
    id: 'template-5',
    name: 'Decision',
    text: 'Decision?',
    width: 180,
    height: 80,
    shape: NodeShape.Diamond,
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  {
    id: 'template-6',
    name: 'Database',
    text: 'Data Store',
    width: 160,
    height: 90,
    shape: NodeShape.Cylinder,
    backgroundColor: '#f3e8ff',
    borderColor: '#9333ea',
  },
  {
    id: 'template-7',
    name: 'Image',
    text: 'Image Caption',
    width: 200,
    height: 150,
    shape: NodeShape.Image,
    backgroundColor: '#e5e7eb',
    borderColor: '#9ca3af',
  },
];


export const INITIAL_NODES: MindMapNode[] = [
  {
    id: 'node-1',
    text: 'Brainstorm Core Idea',
    position: { x: 400, y: 100 },
    width: 200,
    height: 60,
    shape: NodeShape.Ellipse,
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  {
    id: 'node-2',
    text: 'Feature A',
    position: { x: 200, y: 300 },
    width: 180,
    height: 50,
    shape: NodeShape.Rounded,
    backgroundColor: '#f0fdf4',
    borderColor: '#4ade80',
  },
  {
    id: 'node-3',
    text: 'Feature B',
    position: { x: 600, y: 300 },
    width: 180,
    height: 50,
    shape: NodeShape.Rounded,
    backgroundColor: '#f0fdf4',
    borderColor: '#4ade80',
  },
];

export const INITIAL_TEXTS: MindMapText[] = [
  {
    id: 'text-1',
    text: 'You can add notes and comments directly on the canvas.',
    position: { x: 50, y: 500 },
    width: 250,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#4b5563', // text-gray-600
  },
];

export const INITIAL_CONNECTIONS: Connection[] = [
  { id: 'conn-1', from: 'node-1', to: 'node-2' },
  { id: 'conn-2', from: 'node-1', to: 'node-3' },
];

// Helper dates for demonstration
const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const nextWeek = new Date();
nextWeek.setDate(today.getDate() + 7);
const threeDaysAgo = new Date();
threeDaysAgo.setDate(today.getDate() - 3);
const fiveDaysAgo = new Date();
fiveDaysAgo.setDate(today.getDate() - 5);
const tenDaysAgo = new Date();
tenDaysAgo.setDate(today.getDate() - 10);
const twoWeeksAgo = new Date();
twoWeeksAgo.setDate(today.getDate() - 14);


export const INITIAL_COLUMNS: TaskColumn[] = [
  {
    id: 'col-1',
    title: 'To Do',
    cards: [
      {
        id: 'card-1',
        content: 'Design the main UI (Overdue)',
        startDate: tenDaysAgo.toISOString(),
        dueDate: yesterday.toISOString(),
        labels: [{ id: 'label-1', text: 'UI/UX', color: '#ef4444' }],
        checklist: [],
        priority: TaskPriority.High,
        assignedUserIds: ['user-1'],
        responsibleUserId: 'user-1',
        attachments: [],
      },
      {
        id: 'card-2',
        content: 'Set up project structure (Due Today)',
        startDate: threeDaysAgo.toISOString(),
        dueDate: today.toISOString(),
        labels: [{ id: 'label-2', text: 'Dev', color: '#3b82f6' }],
        checklist: [],
        assignedUserIds: ['user-2', 'user-3'],
        responsibleUserId: 'user-2',
        dependencies: ['card-1'],
        attachments: [],
      },
    ],
  },
  {
    id: 'col-2',
    title: 'In Progress',
    cards: [
      {
        id: 'card-3',
        content: 'Develop API endpoints (Due Next Week)',
        startDate: yesterday.toISOString(),
        dueDate: nextWeek.toISOString(),
        labels: [{ id: 'label-2', text: 'Dev', color: '#3b82f6' }],
        checklist: [],
        priority: TaskPriority.Medium,
        assignedUserIds: ['user-2'],
        responsibleUserId: 'user-2',
        dependencies: ['card-2'],
        attachments: [],
      },
      {
        id: 'card-4',
        content: 'Review pull requests (Due Tomorrow)',
        startDate: today.toISOString(),
        dueDate: tomorrow.toISOString(),
        labels: [],
        checklist: [],
        assignedUserIds: ['user-4'],
        attachments: [],
      },
    ],
  },
  {
    id: 'col-3',
    title: 'Done',
    cards: [
      {
        id: 'card-5',
        content: 'Write documentation (Completed)',
        startDate: twoWeeksAgo.toISOString(),
        dueDate: fiveDaysAgo.toISOString(),
        labels: [],
        checklist: [
          { id: 'ci-1', text: 'Initial draft', completed: true },
          { id: 'ci-2', text: 'Peer review', completed: true },
        ],
        assignedUserIds: ['user-1'],
        dependencies: ['card-3'],
        attachments: [],
      },
    ],
  },
];

export const INITIAL_BUG_REPORTS: BugReport[] = [
  {
    id: 'BUG-1',
    summary: 'PDF preview not working correctly on IE 11',
    description: 'When trying to open a PDF file in the previewer using Internet Explorer 11, the page remains blank and the PDF does not render.',
    reporterId: 'user-4', // Diana
    assigneeId: 'user-1', // Alice
    status: BugStatus.Open,
    priority: TaskPriority.High,
    type: BugType.Bug,
    createdAt: threeDaysAgo.toISOString(),
    labels: [{ id: 'label-3', text: 'Critical', color: '#dc2626' }],
    attachments: [],
  },
  {
    id: 'BUG-2',
    summary: 'Typo on landing page needs fixing',
    description: 'There is a spelling mistake in the main heading of the landing page. "Creativty" should be "Creativity".',
    reporterId: 'user-3', // Charlie
    assigneeId: 'user-2', // Bob
    status: BugStatus.InProgress,
    priority: TaskPriority.Low,
    type: BugType.Bug,
    createdAt: yesterday.toISOString(),
    labels: [{ id: 'label-4', text: 'Copywriting', color: '#f59e0b' }],
  },
  {
    id: 'BUG-3',
    summary: 'Video autoplays with sound on About Us page',
    description: 'The background video on the "About Us" page starts playing with the sound on by default, which is disruptive for users.',
    reporterId: 'user-1', // Alice
    assigneeId: 'user-2', // Bob
    status: BugStatus.Open,
    priority: TaskPriority.Medium,
    type: BugType.Bug,
    createdAt: fiveDaysAgo.toISOString(),
    labels: [{ id: 'label-1', text: 'UI/UX', color: '#ef4444' }],
  },
  {
    id: 'BUG-4',
    summary: 'Implement dark mode feature',
    description: 'Add a toggle to switch the entire application UI between a light and dark theme to improve user experience in low-light environments.',
    reporterId: 'user-2', // Bob
    status: BugStatus.Resolved,
    priority: TaskPriority.Medium,
    type: BugType.Task,
    createdAt: tenDaysAgo.toISOString(),
    labels: [{ id: 'label-5', text: 'Feature', color: '#8b5cf6' }],
  },
];