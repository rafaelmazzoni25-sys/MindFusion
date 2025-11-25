

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, MindMapNode, Connection, TaskColumn, TaskCard, Point, NodeTemplate, MindMapText, BugReport, Label, ProjectData, NodeShape, User } from './types';
import { INITIAL_NODES, INITIAL_CONNECTIONS, INITIAL_COLUMNS, INITIAL_TEMPLATES, DEFAULT_USERS, INITIAL_TEXTS, INITIAL_BUG_REPORTS } from './constants';
import MindMap from './components/MindMap';
import TaskBoard, { TaskDetailsModal } from './components/TaskBoard';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import Timeline from './components/Timeline';
import BugTracker from './components/BugTracker';
import { BugReportModal } from './components/BugReportModal';
import GlobalSearch, { SearchResult } from './components/GlobalSearch';
import CalendarView from './components/CalendarView';
import { useCollaborators } from './hooks/useCollaborators';
import usePermissions from './hooks/usePermissions';
import { CursorIcon } from './components/icons/CursorIcon';
import TeamView from './components/TeamView';
import { getAuthToken, api } from './services/api';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import WorkspaceLoadingScreen from './components/WorkspaceLoadingScreen';
import syncService from './services/sync';

const CollaboratorCursors: React.FC<{ users: User[] }> = ({ users }) => {
  const collaborators = useCollaborators(users);

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden">
      {collaborators.map(user => (
        <div
          key={user.id}
          className="absolute transition-transform duration-[2000ms] ease-linear"
          style={{ transform: `translate(${user.position.x}px, ${user.position.y}px)` }}
        >
          <CursorIcon className="w-6 h-6 -ml-1 -mt-1" style={{ color: user.color }} />
          <span
            className="text-white text-sm font-semibold rounded-full px-2 py-0.5 whitespace-nowrap"
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </span>
        </div>
      ))}
    </div>
  );
};


// Helper functions for localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

function App() {
  // Check if user is logged in from localStorage/token
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getAuthToken());
  const [user, setUser] = useState<any | null>(() => loadFromLocalStorage('user', null));

  const [currentView, setCurrentView] = useState<View>(() => loadFromLocalStorage('currentView', View.MindMap));
  const [nodes, setNodes] = useState<MindMapNode[]>(() => loadFromLocalStorage('nodes', INITIAL_NODES));
  const [connections, setConnections] = useState<Connection[]>(() => loadFromLocalStorage('connections', INITIAL_CONNECTIONS));
  const [texts, setTexts] = useState<MindMapText[]>(() => loadFromLocalStorage('texts', INITIAL_TEXTS));
  const [columns, setColumns] = useState<TaskColumn[]>(() => loadFromLocalStorage('columns', INITIAL_COLUMNS));
  const [bugReports, setBugReports] = useState<BugReport[]>(() => loadFromLocalStorage('bugReports', INITIAL_BUG_REPORTS));
  const [users, setUsers] = useState<User[]>(() => loadFromLocalStorage('users', DEFAULT_USERS));

  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [justUpdatedCardId, setJustUpdatedCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const [nodeTemplates, setNodeTemplates] = useState<NodeTemplate[]>(INITIAL_TEMPLATES);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const [selectedTask, setSelectedTask] = useState<{ card: TaskCard; columnId: string } | null>(null);
  const [selectedBug, setSelectedBug] = useState<BugReport | 'new' | null>(null);

  // --- New State for Global Search and Item Selection ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [highlightedBugId, setHighlightedBugId] = useState<string | null>(null);

  // --- Workspace State (MVP) ---
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
  const [needsWorkspaceSelection, setNeedsWorkspaceSelection] = useState(false);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [loadingWorkspaceName, setLoadingWorkspaceName] = useState<string>('');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(() => {
    const saved = localStorage.getItem('current_workspace_id');
    return saved ? parseInt(saved) : null;
  });
  const [currentWorkspaceName, setCurrentWorkspaceName] = useState<string>(() => {
    return localStorage.getItem('current_workspace_name') || 'My Workspace';
  });

  // --- Permissions ---
  const { permissions, role, can, loading: permissionsLoading } = usePermissions(currentWorkspaceId);

  // --- Real-time Sync ---
  const [syncConnected, setSyncConnected] = useState(false);

  // TEMPORARILY DISABLED - Fixing backend issues
  /*
  // Connect to sync service when workspace is selected
  useEffect(() => {
    if (currentWorkspaceId && isLoggedIn) {
      console.log('[App] Connecting to sync for workspace:', currentWorkspaceId);
      syncService.connect(currentWorkspaceId, setSyncConnected);

      // Listen for sync events
      const handleNodeCreated = (event: any) => {
        console.log('[Sync] Node created:', event);
        setNodes(prev => [...prev, event.data]);
      };

      const handleNodeUpdated = (event: any) => {
        console.log('[Sync] Node updated:', event);
        setNodes(prev => prev.map(n => n.id === event.entity_id ? { ...n, ...event.data } : n));
      };

      const handleNodeDeleted = (event: any) => {
        console.log('[Sync] Node deleted:', event);
        setNodes(prev => prev.filter(n => n.id !== event.entity_id));
      };

      const handleTaskUpdated = (event: any) => {
        console.log('[Sync] Task updated:', event);
        setColumns(prev => prev.map(col => ({
          ...col,
          cards: col.cards.map(t => t.id === event.entity_id ? { ...t, ...event.data } : t)
        })));
      };

      const handleTaskMoved = (event: any) => {
        console.log('[Sync] Task moved:', event);
        // Reload columns to get latest state
        // You may want to implement a more sophisticated merge strategy
      };

      syncService.on('node_created', handleNodeCreated);
      syncService.on('node_updated', handleNodeUpdated);
      syncService.on('node_deleted', handleNodeDeleted);
      syncService.on('task_updated', handleTaskUpdated);
      syncService.on('task_moved', handleTaskMoved);

      return () => {
        syncService.off('node_created', handleNodeCreated);
        syncService.off('node_updated', handleNodeUpdated);
        syncService.off('node_deleted', handleNodeDeleted);
        syncService.off('task_updated', handleTaskUpdated);
        syncService.off('task_moved', handleTaskMoved);
        syncService.disconnect();
      }
    }
  }, [currentWorkspaceId, isLoggedIn]);
  */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        setIsSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    setIsSearchOpen(false);
    // Reset highlights
    setHighlightedTaskId(null);
    setHighlightedBugId(null);
    setSelectedNodeId(null);
    setSelectedTextId(null);

    switch (result.type) {
      case 'node':
        setCurrentView(View.MindMap);
        setSelectedNodeId(result.id);
        break;
      case 'task':
        const card = result.original as TaskCard;
        const column = columns.find(c => c.cards.some(c => c.id === card.id));
        if (column) {
          setCurrentView(View.TaskBoard);
          setHighlightedTaskId(result.id);
        }
        break;
      case 'bug':
        setCurrentView(View.BugTracker);
        setHighlightedBugId(result.id);
        break;
      // no-op for 'user' type for now
    }
  }, [columns]);

  // Save user data to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage('user', user);
  }, [user]);

  // Save all data to localStorage when changed
  useEffect(() => {
    saveToLocalStorage('currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    saveToLocalStorage('nodes', nodes);
  }, [nodes]);

  useEffect(() => {
    saveToLocalStorage('connections', connections);
  }, [connections]);

  useEffect(() => {
    saveToLocalStorage('texts', texts);
  }, [texts]);

  useEffect(() => {
    saveToLocalStorage('columns', columns);
  }, [columns]);

  useEffect(() => {
    saveToLocalStorage('bugReports', bugReports);
  }, [bugReports]);

  useEffect(() => {
    saveToLocalStorage('users', users);
  }, [users]);

  // Auto-load workspace data when page loads or workspace changes
  useEffect(() => {
    const loadWorkspaceDataOnInit = async () => {
      if (currentWorkspaceId && isLoggedIn) {
        try {
          console.log(`[App] Auto-loading workspace ${currentWorkspaceId} data...`);
          const data = await api.workspaces.loadData(currentWorkspaceId);

          // Deduplicate data by ID to prevent duplicate keys in React
          const uniqueNodes = Array.from(
            new Map((data.nodes || []).map(node => [node.id, node])).values()
          );
          const uniqueConnections = Array.from(
            new Map((data.connections || []).map(conn => [conn.id, conn])).values()
          );
          const uniqueTexts = Array.from(
            new Map((data.texts || []).map(text => [text.id, text])).values()
          );

          // Load all workspace data
          setNodes(uniqueNodes);
          setConnections(uniqueConnections);
          setTexts(uniqueTexts);
          setColumns(data.columns || []);
          setBugReports(data.bugs || []);
          setUsers(data.users || []);
          setNodeTemplates(data.templates || INITIAL_TEMPLATES);
          setCurrentWorkspaceName(data.workspace.name);

          console.log(`[App] Workspace "${data.workspace.name}" loaded successfully`);
        } catch (error) {
          console.error('[App] Failed to auto-load workspace:', error);
        }
      }
    };

    loadWorkspaceDataOnInit();
  }, [currentWorkspaceId, isLoggedIn]);

  // --- Auth ---
  const handleLogin = (userData: any) => {
    setIsLoggedIn(true);
    setUser(userData);
    // After login, force workspace selection
    setNeedsWorkspaceSelection(true);
    setIsWorkspaceSelectorOpen(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentWorkspaceId(null);
    setCurrentWorkspaceName('My Workspace');
    setNeedsWorkspaceSelection(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('current_workspace_id');
    localStorage.removeItem('current_workspace_name');
  };

  // --- Notifications ---
  useEffect(() => {
    setNotificationPermission(Notification.permission);
  }, []);

  const requestNotifications = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        // Find tasks due today and send notifications
        const today = new Date().toISOString().split('T')[0];
        columns.forEach(col => {
          col.cards.forEach(card => {
            if (card.dueDate && card.dueDate.startsWith(today)) {
              new Notification('Task Due Today!', {
                body: `Don't forget: "${card.content}" is due today.`,
              });
            }
          });
        });
      }
    }
  }, [columns]);

  // --- Data Import/Export ---
  const handleExport = useCallback(() => {
    const projectData: ProjectData = {
      nodes,
      connections,
      texts,
      columns,
      bugReports,
      nodeTemplates,
      users,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mind-task-fusion-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, connections, texts, columns, bugReports, nodeTemplates, users]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const data: ProjectData = JSON.parse(result);
        if (data.version && data.nodes && data.columns) {
          setNodes(data.nodes);
          setConnections(data.connections || []);
          setTexts(data.texts || []);
          setColumns(data.columns);
          setBugReports(data.bugReports || []);
          setNodeTemplates(data.nodeTemplates || INITIAL_TEMPLATES);
          setUsers(data.users || DEFAULT_USERS);
          alert('Project imported successfully!');
        } else {
          throw new Error('Invalid project file format.');
        }
      } catch (error) {
        alert(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  }, []);


  // --- View Logic ---
  const navigateToTask = useCallback((taskId: string) => {
    setCurrentView(View.TaskBoard);
    setHighlightedTaskId(taskId);
  }, []);

  const clearHighlightedTask = useCallback(() => {
    setHighlightedTaskId(null);
  }, []);

  const handleSelectWorkspace = async (workspaceId: number) => {
    setLoadingWorkspace(true);
    setIsWorkspaceSelectorOpen(false);

    try {
      // Just set the workspace ID and save to localStorage
      // The useEffect will handle loading the data
      setCurrentWorkspaceId(workspaceId);
      localStorage.setItem('current_workspace_id', workspaceId.toString());

      console.log(`[App] Workspace ${workspaceId} selected, loading data...`);

      // Clear selection flag
      setNeedsWorkspaceSelection(false);

    } catch (error: any) {
      console.error('Failed to select workspace:', error);
      alert(`Erro ao selecionar workspace: ${error.message || 'Erro desconhecido'}`);
      // Reopen selector on error
      setIsWorkspaceSelectorOpen(true);
    } finally {
      setLoadingWorkspace(false);
      setLoadingWorkspaceName('');
    }
  };

  const triggerUpdateAnimation = (cardId: string) => {
    setJustUpdatedCardId(cardId);
    setTimeout(() => setJustUpdatedCardId(null), 1000);
  };


  // --- Mind Map Handlers ---

  const addNode = useCallback(async (template?: Partial<Omit<MindMapNode, 'id' | 'position'>>) => {
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      text: template?.text || 'New Idea',
      position: { x: 100, y: 100 },
      width: template?.width || 180,
      height: template?.height || 50,
      shape: template?.shape,
      backgroundColor: template?.backgroundColor,
      borderColor: template?.borderColor,
    };
    // Optimistic update
    setNodes(n => [...n, newNode]);
    // Save to backend
    try {
      await api.nodes.create(newNode);
    } catch (error) {
      console.error('Failed to create node:', error);
      // Rollback on error
      setNodes(n => n.filter(node => node.id !== newNode.id));
    }
  }, []);

  const addText = useCallback(async (position: Point) => {
    const newText: MindMapText = {
      id: crypto.randomUUID(),
      text: 'New Text Block',
      position,
      width: 200,
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#374151',
    };
    // Optimistic update
    setTexts(t => [...t, newText]);
    // Save to backend
    try {
      await api.texts.create(newText);
    } catch (error) {
      console.error('Failed to create text:', error);
      // Rollback on error
      setTexts(t => t.filter(text => text.id !== newText.id));
    }
  }, []);

  const addNodeAndConnect = useCallback(async (fromNodeId: string, position: Point) => {
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      text: 'New Idea',
      position,
      width: 180,
      height: 50,
      shape: NodeShape.Rounded,
      backgroundColor: '#f0fdf4',
      borderColor: '#4ade80',
    };
    const newConnection: Connection = {
      id: crypto.randomUUID(),
      from: fromNodeId,
      to: newNode.id,
    };
    // Optimistic update
    setNodes(n => [...n, newNode]);
    setConnections(c => [...c, newConnection]);
    setConnectingNodeId(null);
    // Save to backend
    try {
      await api.nodes.create(newNode);
      await api.connections.create(newConnection);
    } catch (error) {
      console.error('Failed to create node and connection:', error);
      // Rollback on error
      setNodes(n => n.filter(node => node.id !== newNode.id));
      setConnections(c => c.filter(conn => conn.id !== newConnection.id));
    }
  }, []);

  const deleteNode = useCallback(async (nodeId: string) => {
    // Optimistic update
    const previousNodes = nodes;
    const previousConnections = connections;
    setNodes(n => n.filter(node => node.id !== nodeId));
    setConnections(c => c.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
    // Save to backend
    try {
      await api.nodes.delete(nodeId);
    } catch (error) {
      console.error('Failed to delete node:', error);
      // Rollback on error
      setNodes(previousNodes);
      setConnections(previousConnections);
    }
  }, [nodes, connections]);

  const deleteText = useCallback(async (textId: string) => {
    // Optimistic update
    const previousTexts = texts;
    setTexts(t => t.filter(text => text.id !== textId));
    // Save to backend
    try {
      await api.texts.delete(textId);
    } catch (error) {
      console.error('Failed to delete text:', error);
      // Rollback on error
      setTexts(previousTexts);
    }
  }, [texts]);

  const updateNodeText = useCallback(async (nodeId: string, newText: string) => {
    // Optimistic update
    setNodes(n => n.map(node => node.id === nodeId ? { ...node, text: newText } : node));
    // Save to backend
    try {
      await api.nodes.update(nodeId, { text: newText });
    } catch (error) {
      console.error('Failed to update node text:', error);
    }
  }, []);

  const updateTextProperties = useCallback(async (textId: string, properties: Partial<MindMapText>) => {
    // Optimistic update
    setTexts(t => t.map(text => text.id === textId ? { ...text, ...properties } : text));
    // Save to backend
    try {
      await api.texts.update(textId, properties);
    } catch (error) {
      console.error('Failed to update text properties:', error);
    }
  }, []);

  const updateNodePosition = useCallback(async (nodeId: string, newPosition: Point) => {
    // Optimistic update
    setNodes(n => n.map(node => node.id === nodeId ? { ...node, position: newPosition } : node));
    // Save to backend (debounced in practice, but for now direct)
    try {
      await api.nodes.update(nodeId, { position: newPosition });
    } catch (error) {
      console.error('Failed to update node position:', error);
    }
  }, []);

  const updateNodeDimensions = useCallback(async (nodeId: string, dimensions: { width: number, height: number }) => {
    // Optimistic update
    setNodes(n => n.map(node => node.id === nodeId ? { ...node, ...dimensions } : node));
    // Save to backend
    try {
      await api.nodes.update(nodeId, dimensions);
    } catch (error) {
      console.error('Failed to update node dimensions:', error);
    }
  }, []);

  const updateNodeProperties = useCallback(async (nodeId: string, properties: Partial<Pick<MindMapNode, 'backgroundColor' | 'borderColor' | 'shape'>>) => {
    // Optimistic update
    setNodes(n => n.map(node => node.id === nodeId ? { ...node, ...properties } : node));
    // Save to backend
    try {
      await api.nodes.update(nodeId, properties);
    } catch (error) {
      console.error('Failed to update node properties:', error);
    }
  }, []);

  const updateNodeImage = useCallback(async (nodeId: string, imageUrl: string | null) => {
    // Optimistic update
    setNodes(n => n.map(node => (node.id === nodeId ? { ...node, imageUrl: imageUrl || undefined } : node)));
    // Save to backend
    try {
      await api.nodes.update(nodeId, { imageUrl: imageUrl || undefined });
    } catch (error) {
      console.error('Failed to update node image:', error);
    }
  }, []);

  const startConnection = useCallback((nodeId: string) => {
    setConnectingNodeId(nodeId);
  }, []);

  const finishConnection = useCallback(async (toNodeId: string) => {
    if (connectingNodeId && connectingNodeId !== toNodeId) {
      const newConnection: Connection = {
        id: crypto.randomUUID(),
        from: connectingNodeId,
        to: toNodeId,
      };
      // Optimisticupdate
      setConnections(c => [...c, newConnection]);
      // Save to backend
      try {
        await api.connections.create(newConnection);
      } catch (error) {
        console.error('Failed to create connection:', error);
        // Rollback on error
        setConnections(c => c.filter(conn => conn.id !== newConnection.id));
      }
    }
    setConnectingNodeId(null);
  }, [connectingNodeId]);

  const cancelConnection = useCallback(() => {
    setConnectingNodeId(null);
  }, []);

  const convertNodeToTask = useCallback(async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.linkedTaskId) return;

    const newCard: TaskCard = {
      id: crypto.randomUUID(),
      content: node.text,
      labels: [],
      checklist: [],
      attachments: [],
      dependencies: [],
    };

    try {
      // First, ensure we have a column
      let targetColumn = columns.length > 0 ? columns[0] : null;

      if (!targetColumn) {
        // Create default column first
        const defaultColumn = { id: crypto.randomUUID(), title: 'To Do', cards: [] };
        await api.columns.create(defaultColumn);
        targetColumn = defaultColumn;
        // Update columns state
        setColumns([defaultColumn]);
      }

      // Create the task in the backend
      await api.tasks.createTask(newCard, targetColumn.id);

      // Update node with linkedTaskId
      await api.nodes.update(nodeId, { linkedTaskId: newCard.id });

      // Only update local state AFTER successful backend operations
      setColumns(cols => {
        const newCols = [...cols];
        const targetColIndex = newCols.findIndex(c => c.id === targetColumn!.id);
        if (targetColIndex >= 0) {
          newCols[targetColIndex] = {
            ...newCols[targetColIndex],
            cards: [...newCols[targetColIndex].cards, newCard]
          };
        }
        return newCols;
      });

      setNodes(n => n.map(n => n.id === nodeId ? { ...n, linkedTaskId: newCard.id } : n));

      // Navigate to the task board and highlight the new task
      setCurrentView(View.TaskBoard);
      setHighlightedTaskId(newCard.id);

    } catch (error) {
      console.error('Failed to convert node to task:', error);
      alert('Falha ao converter nó em tarefa. Por favor, tente novamente.');
    }
  }, [nodes, columns]);

  const addTemplate = useCallback((templateData: Omit<NodeTemplate, 'id'>) => {
    const newTemplate: NodeTemplate = {
      id: crypto.randomUUID(),
      ...templateData,
    };
    setNodeTemplates(t => [...t, newTemplate]);
  }, []);

  const updateTemplate = useCallback((templateId: string, updatedProperties: Partial<NodeTemplate>) => {
    setNodeTemplates(t => t.map(template => template.id === templateId ? { ...template, ...updatedProperties } : template));
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setNodeTemplates(t => t.filter(template => template.id !== templateId));
  }, []);

  // --- Task Board Handlers ---

  const moveTaskCard = useCallback(async (cardId: string, fromColumnId: string, toColumnId: string, destinationIndex: number) => {
    const previousColumns = columns;
    // Optimistic update
    setColumns(prev => {
      const newCols = prev.map(c => ({ ...c, cards: [...c.cards] }));
      const fromCol = newCols.find(c => c.id === fromColumnId);
      const toCol = newCols.find(c => c.id === toColumnId);
      if (!fromCol || !toCol) return prev;

      const cardIndex = fromCol.cards.findIndex(c => c.id === cardId);
      if (cardIndex < 0) return prev;

      const [card] = fromCol.cards.splice(cardIndex, 1);
      toCol.cards.splice(destinationIndex, 0, card);

      return newCols;
    });
    // Save to backend
    try {
      await api.tasks.moveTask(cardId, toColumnId, destinationIndex);
    } catch (error) {
      console.error('Failed to move task:', error);
      setColumns(previousColumns);
    }
  }, [columns]);

  const addCard = useCallback(async (columnId: string, content: string) => {
    const newCard: TaskCard = { id: crypto.randomUUID(), content, labels: [], checklist: [], attachments: [], dependencies: [] };
    // Optimistic update
    setColumns(cols => cols.map(col => col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col));
    // Save to backend
    try {
      await api.tasks.createTask(newCard, columnId);
    } catch (error) {
      console.error('Failed to create task:', error);
      setColumns(cols => cols.map(col => col.id === columnId ? { ...col, cards: col.cards.filter(c => c.id !== newCard.id) } : col));
    }
  }, []);

  const addColumn = useCallback(async (title: string) => {
    const newColumn: TaskColumn = { id: crypto.randomUUID(), title, cards: [] };
    // Optimistic update
    setColumns(cols => [...cols, newColumn]);
    // Save to backend
    try {
      await api.columns.create(newColumn);
    } catch (error) {
      console.error('Failed to create column:', error);
      // Rollback on error
      setColumns(cols => cols.filter(col => col.id !== newColumn.id));
    }
  }, [columns]);

  const deleteColumn = useCallback(async (columnId: string) => {
    // Optimistic update
    const previousColumns = columns;
    setColumns(cols => cols.filter(col => col.id !== columnId));
    // Save to backend
    try {
      await api.columns.delete(columnId);
    } catch (error) {
      console.error('Failed to delete column:', error);
      // Rollback on error
      setColumns(previousColumns);
    }
  }, [columns]);

  const updateColumnTitle = useCallback(async (columnId: string, newTitle: string) => {
    // Optimistic update
    setColumns(cols => cols.map(col => col.id === columnId ? { ...col, title: newTitle } : col));
    // Save to backend
    try {
      await api.columns.update(columnId, { title: newTitle });
    } catch (error) {
      console.error('Failed to update column title:', error);
    }
  }, []);

  const reorderColumns = useCallback(async (startIndex: number, endIndex: number) => {
    const previousColumns = columns;
    // Optimistic update
    setColumns(cols => {
      const newCols = Array.from(cols);
      const [removed] = newCols.splice(startIndex, 1);
      newCols.splice(endIndex, 0, removed);
      return newCols;
    });
    // Backend will be updated when moveTaskCard fires or columns are reloaded
  }, [columns]);

  const updateTaskDetails = useCallback(async (cardId: string, columnId: string, updatedProperties: Partial<TaskCard>) => {
    // Optimistic update
    setColumns(cols => cols.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          cards: col.cards.map(card => card.id === cardId ? { ...card, ...updatedProperties } : card),
        };
      }
      return col;
    }));
    triggerUpdateAnimation(cardId);

    // Also update selected task if it's open
    setSelectedTask(current => {
      if (current && current.card.id === cardId) {
        return { ...current, card: { ...current.card, ...updatedProperties } };
      }
      return current;
    });

    // Save to backend
    try {
      await api.tasks.updateTask(cardId, updatedProperties);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }, []);

  const deleteTaskCard = useCallback(async (cardId: string) => {
    setDeletingCardId(cardId);
    // Save to backend first
    try {
      await api.tasks.deleteTask(cardId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      setDeletingCardId(null);
      return;
    }

    setTimeout(() => {
      setColumns(cols => cols.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== cardId)
      })));
      setNodes(n => n.map(node => node.linkedTaskId === cardId ? { ...node, linkedTaskId: undefined } : node));
      setDeletingCardId(null);
      setSelectedTask(null);
    }, 500); // match animation duration
  }, []);

  const allTasks = useMemo(() => columns.flatMap(col => col.cards), [columns]);

  // --- Bug Tracker Handlers ---
  const saveBugReport = useCallback(async (bug: BugReport) => {
    const existingIndex = bugReports.findIndex(b => b.id === bug.id);
    const isUpdate = existingIndex > -1;

    // Optimistic update
    setBugReports(bugs => {
      if (isUpdate) {
        const newBugs = [...bugs];
        newBugs[existingIndex] = bug;
        return newBugs;
      } else {
        return [...bugs, bug];
      }
    });

    // Save to backend
    try {
      if (isUpdate) {
        await api.bugs.update(bug.id, bug);
      } else {
        await api.bugs.create(bug);
      }
    } catch (error) {
      console.error('Failed to save bug report:', error);
      // Rollback on error
      if (isUpdate) {
        setBugReports(bugs => {
          const newBugs = [...bugs];
          newBugs[existingIndex] = bugReports[existingIndex];
          return newBugs;
        });
      } else {
        setBugReports(bugs => bugs.filter(b => b.id !== bug.id));
      }
    }
  }, [bugReports]);

  const deleteBugReport = useCallback(async (bugId: string) => {
    // Optimistic update
    const previousBugs = bugReports;
    setBugReports(bugs => bugs.filter(b => b.id !== bugId));
    // Save to backend
    try {
      await api.bugs.delete(bugId);
    } catch (error) {
      console.error('Failed to delete bug report:', error);
      // Rollback on error
      setBugReports(previousBugs);
    }
  }, [bugReports]);

  // --- Team Management Handlers ---
  const addUser = useCallback((user: User) => {
    setUsers(u => [...u, user]);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(u => u.map(user => user.id === updatedUser.id ? updatedUser : user));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    // Remove user
    setUsers(u => u.filter(user => user.id !== userId));

    // Unassign from tasks
    setColumns(cols => cols.map(col => ({
      ...col,
      cards: col.cards.map(card => ({
        ...card,
        assignedUserIds: card.assignedUserIds?.filter(id => id !== userId),
      })),
    })));

    // Unassign from bugs
    setBugReports(bugs => bugs.map(bug => {
      if (bug.assigneeId === userId) {
        return { ...bug, assigneeId: undefined };
      }
      return bug;
    }));

  }, []);


  const allLabels = React.useMemo(() => {
    const labelMap = new Map<string, Label>();
    columns.forEach(col => col.cards.forEach(card => card.labels.forEach(label => {
      if (!labelMap.has(label.id)) labelMap.set(label.id, label);
    })));
    bugReports.forEach(bug => bug.labels?.forEach(label => {
      if (!labelMap.has(label.id)) labelMap.set(label.id, label);
    }));
    return Array.from(labelMap.values());
  }, [columns, bugReports]);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show workspace loading screen
  if (loadingWorkspace) {
    return <WorkspaceLoadingScreen workspaceName={loadingWorkspaceName} />;
  }

  // Show workspace selector if needed (after login or no workspace selected)
  if (needsWorkspaceSelection || !currentWorkspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <WorkspaceSelector
          isOpen={true}
          onClose={() => { /* Cannot close on first selection */ }}
          onSelectWorkspace={handleSelectWorkspace}
          currentWorkspaceId={currentWorkspaceId}
          preventClose={true}
          isFirstSelection={needsWorkspaceSelection}
        />
      </div >
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <CollaboratorCursors users={users} />
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onRequestNotifications={requestNotifications}
        notificationPermission={notificationPermission}
        user={user}
        onLogout={handleLogout}
        onExport={handleExport}
        onImport={handleImport}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWorkspaceSelector={() => setIsWorkspaceSelectorOpen(true)}
        currentWorkspaceName={currentWorkspaceName}
      />
      <main className="flex-grow overflow-hidden">
        {currentView === View.MindMap && (
          <MindMap
            nodes={nodes}
            connections={connections}
            texts={texts}
            addNode={addNode}
            addText={addText}
            addNodeAndConnect={addNodeAndConnect}
            deleteNode={deleteNode}
            deleteText={deleteText}
            updateNodeText={updateNodeText}
            updateTextProperties={updateTextProperties}
            updateNodePosition={updateNodePosition}
            updateNodeDimensions={updateNodeDimensions}
            updateNodeProperties={updateNodeProperties}
            updateNodeImage={updateNodeImage}
            startConnection={startConnection}
            finishConnection={finishConnection}
            cancelConnection={cancelConnection}
            connectingNodeId={connectingNodeId}
            convertNodeToTask={convertNodeToTask}
            navigateToTask={navigateToTask}
            nodeTemplates={nodeTemplates}
            addTemplate={addTemplate}
            updateTemplate={updateTemplate}
            deleteTemplate={deleteTemplate}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            selectedTextId={selectedTextId}
            setSelectedTextId={setSelectedTextId}
          />
        )}
        {currentView === View.TaskBoard && (
          <TaskBoard
            columns={columns}
            users={users}
            allTasks={allTasks}
            moveTaskCard={moveTaskCard}
            updateTaskDetails={updateTaskDetails}
            deleteTaskCard={deleteTaskCard}
            addCard={addCard}
            addColumn={addColumn}
            deleteColumn={deleteColumn}
            updateColumnTitle={updateColumnTitle}
            reorderColumns={reorderColumns}
            highlightedTaskId={highlightedTaskId}
            clearHighlightedTask={clearHighlightedTask}
            openTaskDetails={(card, columnId) => setSelectedTask({ card, columnId })}
            justUpdatedCardId={justUpdatedCardId}
            deletingCardId={deletingCardId}
          />
        )}
        {currentView === View.Timeline && <Timeline columns={columns} users={users} onTaskClick={(card, columnId) => setSelectedTask({ card, columnId })} />}
        {currentView === View.BugTracker && (
          <BugTracker
            bugReports={bugReports}
            users={users}
            onOpenModal={setSelectedBug}
            highlightedBugId={highlightedBugId}
            clearHighlightedBug={() => setHighlightedBugId(null)}
          />
        )}
        {currentView === View.Calendar && <CalendarView columns={columns} onTaskClick={(card, columnId) => setSelectedTask({ card, columnId })} />}
        {currentView === View.Team && (
          <TeamView
            users={users}
            allTasks={allTasks}
            bugReports={bugReports}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        )}
      </main>
      {selectedTask && (
        <TaskDetailsModal
          card={selectedTask.card}
          columnId={selectedTask.columnId}
          columns={columns}
          users={users}
          allTasks={allTasks}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTaskDetails}
          onDelete={deleteTaskCard}
          onMove={moveTaskCard}
        />
      )}
      {selectedBug && (
        <BugReportModal
          bugReport={selectedBug === 'new' ? null : selectedBug}
          users={users}
          allLabels={allLabels}
          onClose={() => setSelectedBug(null)}
          onSave={saveBugReport}
          onDelete={deleteBugReport}
          nextBugId={`BUG-${bugReports.length + 1}`}
          defaultReporterId={user?.id || users[0]?.id || ''}
        />
      )}
      {isSearchOpen && (
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          nodes={nodes}
          columns={columns}
          bugReports={bugReports}
          users={users}
          onSelect={handleSearchResultSelect}
        />
      )}
      <WorkspaceSelector
        isOpen={isWorkspaceSelectorOpen}
        onClose={() => setIsWorkspaceSelectorOpen(false)}
        onSelectWorkspace={handleSelectWorkspace}
        currentWorkspaceId={currentWorkspaceId}
      />
    </div>
  );
}

export default App;