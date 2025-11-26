/**
 * API Service - Client para comunicação com backend PHP
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Store JWT token
let authToken: string | null = localStorage.getItem('auth_token');

/**
 * Set authentication token
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

/**
 * Get current auth token
 */
export const getAuthToken = (): string | null => {
  return authToken || localStorage.getItem('auth_token');
};

/**
 * Get current workspace ID
 */
const getCurrentWorkspaceId = (): number | null => {
  const saved = localStorage.getItem('current_workspace_id');
  return saved ? parseInt(saved) : null;
};

/**
 * Request helper with authentication
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const workspaceId = getCurrentWorkspaceId();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add workspace_id to URL if available and not login/register
  let url = `${API_URL}/${endpoint}`;
  if (workspaceId && !endpoint.includes('auth/')) {
    const separator = endpoint.includes('?') ? '&' : '?';
    url = `${url}${separator}workspace_id=${workspaceId}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ============================================
// Authentication API
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    workspace_id: number;
  };
}

export const authAPI = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await request<AuthResponse>('auth/register.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(response.token);
    return response;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await request<AuthResponse>('auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(response.token);
    return response;
  },

  logout: () => {
    setAuthToken(null);
  },
};

// ============================================
// Mind Map API - Nodes
// ============================================

import type { MindMapNode } from '../types';

export const nodesAPI = {
  getAll: async (): Promise<MindMapNode[]> => {
    const response = await request<{ success: boolean; nodes: MindMapNode[] }>('nodes/index.php');
    return response.nodes;
  },

  create: async (node: MindMapNode): Promise<void> => {
    await request('nodes/index.php', {
      method: 'POST',
      body: JSON.stringify(node),
    });
  },

  update: async (nodeId: string, updates: Partial<MindMapNode>): Promise<void> => {
    await request('nodes/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id: nodeId, ...updates }),
    });
  },

  delete: async (nodeId: string): Promise<void> => {
    await request(`nodes/index.php?id=${nodeId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Mind Map API - Connections
// ============================================

import type { Connection } from '../types';

export const connectionsAPI = {
  getAll: async (): Promise<Connection[]> => {
    const response = await request<{ success: boolean; connections: Connection[] }>('nodes/connections.php');
    return response.connections;
  },

  create: async (connection: Connection): Promise<void> => {
    await request('nodes/connections.php', {
      method: 'POST',
      body: JSON.stringify(connection),
    });
  },

  delete: async (connectionId: string): Promise<void> => {
    await request(`nodes/connections.php?id=${connectionId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Tasks API
// ============================================

import type { TaskColumn, TaskCard } from '../types';

export const tasksAPI = {
  createTask: async (task: TaskCard, columnId: string): Promise<void> => {
    await request('tasks/index.php', {
      method: 'POST',
      body: JSON.stringify({ ...task, columnId }),
    });
  },

  updateTask: async (taskId: string, updates: Partial<TaskCard>): Promise<void> => {
    await request('tasks/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id: taskId, ...updates }),
    });
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await request(`tasks/index.php?id=${taskId}`, {
      method: 'DELETE',
    });
  },

  moveTask: async (cardId: string, toColumnId: string, destinationIndex: number): Promise<void> => {
    await request('tasks/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id: cardId, columnId: toColumnId, position: destinationIndex }),
    });
  },
};

// ============================================
// Columns API
// ============================================

export const columnsAPI = {
  create: async (column: TaskColumn): Promise<void> => {
    await request('tasks/columns.php', {
      method: 'POST',
      body: JSON.stringify(column),
    });
  },

  update: async (columnId: string, updates: Partial<TaskColumn>): Promise<void> => {
    await request('tasks/columns.php', {
      method: 'PUT',
      body: JSON.stringify({ id: columnId, ...updates }),
    });
  },

  delete: async (columnId: string): Promise<void> => {
    await request(`tasks/columns.php?id=${columnId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Bugs API
// ============================================

import type { BugReport } from '../types';

export const bugsAPI = {
  create: async (bug: BugReport): Promise<void> => {
    await request('bugs/index.php', {
      method: 'POST',
      body: JSON.stringify(bug),
    });
  },

  update: async (bugId: string, updates: Partial<BugReport>): Promise<void> => {
    await request('bugs/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id: bugId, ...updates }),
    });
  },

  delete: async (bugId: string): Promise<void> => {
    await request(`bugs/index.php?id=${bugId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Mind Map API - Texts
// ============================================

import type { MindMapText } from '../types';

export const textsAPI = {
  create: async (text: MindMapText): Promise<void> => {
    await request('texts/index.php', {
      method: 'POST',
      body: JSON.stringify(text),
    });
  },

  update: async (textId: string, updates: Partial<MindMapText>): Promise<void> => {
    await request('texts/index.php', {
      method: 'PUT',
      body: JSON.stringify({ id: textId, ...updates }),
    });
  },

  delete: async (textId: string): Promise<void> => {
    await request(`texts/index.php?id=${textId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Team Invites API
// ============================================

export interface TeamInvite {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
  invited_by?: string;
}

export const teamAPI = {
  sendInvite: async (email: string, role: string): Promise<TeamInvite> => {
    const workspaceId = localStorage.getItem('current_workspace_id');
    const response = await request<{ success: boolean; invite: TeamInvite }>('workspaces/invites.php', {
      method: 'POST',
      body: JSON.stringify({ email, role, workspace_id: workspaceId }),
    });
    return response.invite;
  },

  getInvites: async (): Promise<TeamInvite[]> => {
    const workspaceId = localStorage.getItem('current_workspace_id');
    const response = await request<{ success: boolean; invites: TeamInvite[] }>(`workspaces/invites.php?workspace_id=${workspaceId}`);
    return response.invites;
  },

  cancelInvite: async (inviteId: number): Promise<void> => {
    await request(`workspaces/invites.php?id=${inviteId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Workspaces API
// ============================================

export interface Workspace {
  id: number;
  name: string;
  is_owner: boolean;
  role: string;
  owned_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceData {
  workspace: Workspace;
  nodes: any[];
  connections: any[];
  texts: any[];
  columns: any[];
  bugs: any[];
  users: any[];
  templates: any[];
}

export const workspacesAPI = {
  list: async (): Promise<{ workspaces: Workspace[]; current_workspace_id: number | null }> => {
    const response = await request<{ success: boolean; workspaces: Workspace[]; current_workspace_id: number | null }>('workspaces/index.php');
    return response;
  },

  create: async (name: string): Promise<Workspace> => {
    const response = await request<{ success: boolean; workspace: Workspace }>('workspaces/index.php', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return response.workspace;
  },

  update: async (workspaceId: number, name: string): Promise<void> => {
    await request('workspaces/index.php', {
      method: 'PUT',
      body: JSON.stringify({ workspace_id: workspaceId, name }),
    });
  },

  delete: async (workspaceId: number): Promise<void> => {
    await request(`workspaces/index.php?id=${workspaceId}`, {
      method: 'DELETE',
    });
  },

  loadData: async (workspaceId: number): Promise<WorkspaceData> => {
    const response = await request<{ success: boolean } & WorkspaceData>(`workspaces/data.php?workspace_id=${workspaceId}`);
    return response;
  },

  // Members management
  listMembers: async (workspaceId: number): Promise<any[]> => {
    const response = await request<{ success: boolean; members: any[] }>(`workspaces/members.php?workspace_id=${workspaceId}`);
    return response.members;
  },

  updateMemberRole: async (workspaceId: number, memberId: string, role: Role): Promise<void> => {
    await request('workspaces/members.php', {
      method: 'PUT',
      body: JSON.stringify({ workspace_id: workspaceId, member_id: memberId, role }),
    });
  },

  removeMember: async (workspaceId: number, memberId: string): Promise<void> => {
    await request(`workspaces/members.php?workspace_id=${workspaceId}&member_id=${memberId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Workspace Invites API
// ============================================

export interface WorkspaceInvite {
  id: number;
  workspace_id?: number;
  workspace_name?: string;
  invited_email: string;
  invited_by?: string;
  invited_by_name?: string;
  role: Role;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  token?: string;
  created_at: string;
  expires_at: string;
}

export const invitesAPI = {
  // Send invitation to email
  send: async (workspaceId: number, email: string, role: Role): Promise<WorkspaceInvite> => {
    const response = await request<{ success: boolean; invite: WorkspaceInvite }>('workspaces/invites.php', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, email, role }),
    });
    return response.invite;
  },

  // List invites for a workspace (for admins)
  listForWorkspace: async (workspaceId: number): Promise<WorkspaceInvite[]> => {
    const response = await request<{ success: boolean; invites: WorkspaceInvite[] }>(`workspaces/invites.php?workspace_id=${workspaceId}`);
    return response.invites;
  },

  // List invites for current user
  listMine: async (): Promise<WorkspaceInvite[]> => {
    const response = await request<{ success: boolean; invites: WorkspaceInvite[] }>('workspaces/invites.php');
    return response.invites;
  },

  // Cancel an invitation
  cancel: async (inviteId: number): Promise<void> => {
    await request(`workspaces/invites.php?id=${inviteId}`, {
      method: 'DELETE',
    });
  },

  // Accept an invitation
  accept: async (token: string): Promise<{ workspace: Workspace; role: Role }> => {
    const response = await request<{ success: boolean; workspace: Workspace; role: Role }>('workspaces/accept-invite.php', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return { workspace: response.workspace, role: response.role };
  },
};

// ============================================
// Permissions API
// ============================================

export type Role = 'Owner' | 'Admin' | 'Editor' | 'Viewer';

export interface UserPermissions {
  role: Role;
  permissions: string[];
  can: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    manage_members: boolean;
    manage_workspace: boolean;
  };
}

export const permissionsAPI = {
  getMyPermissions: async (workspaceId: number): Promise<UserPermissions> => {
    const response = await request<{ success: boolean; permissions: UserPermissions }>(`workspaces/permissions.php?workspace_id=${workspaceId}`);
    return response.permissions;
  },
};

// ============================================
// User Profile API
// ============================================

import type { UserProfile } from '../types';

export const profileAPI = {
  get: async (): Promise<UserProfile> => {
    const response = await request<{ success: boolean; profile: UserProfile }>('user/profile.php');
    return response.profile;
  },

  update: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await request<{ success: boolean; profile: UserProfile }>('user/profile.php', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.profile;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await request('user/password.php', {
      method: 'PUT',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = getAuthToken();
    const workspaceId = localStorage.getItem('current_workspace_id');
    const url = workspaceId
      ? `${API_URL}/user/avatar.php?workspace_id=${workspaceId}`
      : `${API_URL}/user/avatar.php`;

    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data.avatar_url;
  },
};

// ============================================
// Activities API
// ============================================

export interface Activity {
  id: number;
  action_type: 'created' | 'updated' | 'deleted' | 'shared' | 'commented' | 'moved' | 'assigned' | 'completed';
  entity_type: 'node' | 'connection' | 'task' | 'bug' | 'workspace' | 'member' | 'text' | 'comment';
  entity_id: string | null;
  entity_name: string | null;
  details: any;
  created_at: string;
  user_name: string;
  user_id: number;
}

export interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActivityFilters {
  action_type?: string;
  entity_type?: string;
  user_id?: number;
  from_date?: string;
  to_date?: string;
}

export const activitiesAPI = {
  list: async (workspaceId: number, limit = 50, offset = 0, filters?: ActivityFilters): Promise<ActivitiesResponse> => {
    const params = new URLSearchParams({
      workspace_id: workspaceId.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }

    const response = await request<{ success: boolean } & ActivitiesResponse>(`activities/index.php?${params}`);
    return {
      activities: response.activities,
      total: response.total,
      limit: response.limit,
      offset: response.offset,
    };
  },
};

// ============================================
// Combined API Export
// ============================================

export const api = {
  auth: authAPI,
  nodes: nodesAPI,
  connections: connectionsAPI,
  texts: textsAPI,
  tasks: tasksAPI,
  columns: columnsAPI,
  bugs: bugsAPI,
  team: teamAPI,
  workspaces: workspacesAPI,
  invites: invitesAPI,
  permissions: permissionsAPI,
  activities: activitiesAPI,
  profile: profileAPI,
};

export default api;
