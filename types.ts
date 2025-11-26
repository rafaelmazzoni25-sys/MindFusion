export enum View {
  MindMap = 'MIND_MAP',
  TaskBoard = 'TASK_BOARD',
  Timeline = 'TIMELINE',
  BugTracker = 'BUG_TRACKER',
  Calendar = 'CALENDAR',
  Team = 'TEAM',
}

export interface Point {
  x: number;
  y: number;
}

export enum NodeShape {
  Rectangle = 'rectangle',
  Rounded = 'rounded',
  Ellipse = 'ellipse',
  Diamond = 'diamond',
  Parallelogram = 'parallelogram',
  Cylinder = 'cylinder',
  Image = 'image',
}

export interface MindMapNode {
  id: string;
  text: string;
  position: Point;
  width: number;
  height: number;
  linkedTaskId?: string;
  backgroundColor?: string;
  borderColor?: string;
  shape?: NodeShape;
  imageUrl?: string;
}

export interface MindMapText {
  id: string;
  text: string;
  position: Point;
  width: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface NodeTemplate {
  id: string;
  name: string;
  text: string;
  width: number;
  height: number;
  shape?: NodeShape;
  backgroundColor?: string;
  borderColor?: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Label {
  id: string;
  text: string;
  color: string;
}

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum UserRole {
  Admin = 'Admin',
  Editor = 'Editor',
  Viewer = 'Viewer',
}

export interface User {
  id: string;
  name: string;
  initials: string;
  color?: string;
  role?: UserRole;
  avatar?: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: number;
  workspaceName: string;
  inviterId: string;
  inviterName: string;
  invitedEmail: string;
  role: UserRole;
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  token?: string; // Token needed to accept the invite
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: UserRole;
  createdAt: string;
  bio?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface TaskCard {
  id: string;
  content: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  labels: Label[];
  checklist: ChecklistItem[];
  priority?: TaskPriority;
  assignedUserIds?: string[];
  responsibleUserId?: string;
  coverImageUrl?: string;
  dependencies?: string[];
  attachments?: Attachment[];
}

export interface TaskColumn {
  id: string;
  title: string;
  cards: TaskCard[];
}

// --- Bug Tracker Specific Types ---

export enum BugStatus {
  Open = 'Open',
  InProgress = 'In Progress',
  Resolved = 'Resolved',
  Closed = 'Closed',
}

export enum BugType {
  Bug = 'Bug',
  Task = 'Task',
  Story = 'Story',
}

export interface BugReport {
  id: string; // e.g., "BUG-123"
  summary: string;
  description: string;
  reporterId: string;
  assigneeId?: string;
  status: BugStatus;
  priority: TaskPriority;
  type: BugType;
  createdAt: string; // ISO date string
  labels?: Label[];
  attachments?: Attachment[];
}

// --- Project Data for Import/Export ---
export interface ProjectData {
  nodes: MindMapNode[];
  connections: Connection[];
  texts: MindMapText[];
  columns: TaskColumn[];
  bugReports: BugReport[];
  nodeTemplates: NodeTemplate[];
  users: User[];
  version: string;
  exportedAt: string;
}