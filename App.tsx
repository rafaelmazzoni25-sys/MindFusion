import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, TaskCard, BugReport, Label, ProjectData, UserProfile, User } from './types';
import { INITIAL_BUG_REPORTS } from './constants';
import MindMap from './components/MindMap';
import TaskBoard, { TaskDetailsModal } from './components/TaskBoard';
import Header from './components/Header';
import LoginScreen from './components/LoginScreen';
import Timeline from './components/Timeline';
import BugTracker from './components/BugTracker';
import { BugReportModal } from './components/BugReportModal';
import GlobalSearch, { SearchResult } from './components/GlobalSearch';
import CalendarView from './components/CalendarView';
import TeamView from './components/TeamView';
import { getAuthToken, api } from './services/api';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import WorkspaceLoadingScreen from './components/WorkspaceLoadingScreen';
import UserProfileModal from './components/UserProfileModal';
import { CollaboratorCursors } from './components/CollaboratorCursors';

// Hooks
import { useWorkspaceData } from './hooks/useWorkspaceData';
import { useMindMap } from './hooks/useMindMap';
import { useTaskBoard } from './hooks/useTaskBoard';

function App() {
  // --- Auth & User State ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getAuthToken());
  const [user, setUser] = useState<any | null>(() => {
    const item = localStorage.getItem('user');
    return item ? JSON.parse(item) : null;
  });

  // --- View State ---
  const [currentView, setCurrentView] = useState<View>(() => {
    const item = localStorage.getItem('currentView');
    return item ? JSON.parse(item) : View.MindMap;
  });

  // --- Custom Hooks ---
  const {
    currentWorkspaceId,
    setCurrentWorkspaceId,
    currentWorkspaceName,
    isWorkspaceSelectorOpen,
    setIsWorkspaceSelectorOpen,
    needsWorkspaceSelection,
    setNeedsWorkspaceSelection,
    loadingWorkspace,
    handleSelectWorkspace,
    users,
    setUsers,
    nodeTemplates,
    setNodeTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate: deleteNodeTemplate,
    initialData
  } = useWorkspaceData({ isLoggedIn });

  const {
    nodes, setNodes, connections, setConnections, texts, setTexts,
    connectingNodeId, addNode, addText, addNodeAndConnect, deleteNode, deleteText,
    updateNodeText, updateTextProperties, updateNodePosition, updateNodeDimensions,
    updateNodeProperties, updateNodeImage, startConnection, finishConnection, cancelConnection
  } = useMindMap({ initialData });

  const {
    columns, setColumns, highlightedTaskId, setHighlightedTaskId,
    justUpdatedCardId, deletingCardId, moveTaskCard, addCard, addColumn,
    deleteColumn, updateColumnTitle, reorderColumns, updateTaskDetails, deleteTaskCard,
    clearHighlightedTask
  } = useTaskBoard({ initialData });

  // --- Other State (Bug Reports, Search, Profile) ---
  const [bugReports, setBugReports] = useState<BugReport[]>(INITIAL_BUG_REPORTS);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [selectedTask, setSelectedTask] = useState<{ card: TaskCard; columnId: string } | null>(null);
  const [selectedBug, setSelectedBug] = useState<BugReport | 'new' | null>(null);

  // Search & Selection
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [highlightedBugId, setHighlightedBugId] = useState<string | null>(null);

  // Invites & Profile
  const [invites, setInvites] = useState<any[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  // --- Effects ---

  // Sync Bug Reports from initial data
  useEffect(() => {
    if (initialData) {
      setBugReports(initialData.bugReports);
    }
  }, [initialData]);

  // Persist View
  useEffect(() => {
    localStorage.setItem('currentView', JSON.stringify(currentView));
  }, [currentView]);

  // Persist User
  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        setIsSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Handlers ---

  const handleLogin = (userData: any) => {
    setIsLoggedIn(true);
    setUser(userData);
    setNeedsWorkspaceSelection(true);
    setIsWorkspaceSelectorOpen(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentWorkspaceId(null);
    setNeedsWorkspaceSelection(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('current_workspace_id');
    localStorage.removeItem('current_workspace_name');
  };

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    setIsSearchOpen(false);
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
    }
  }, [columns, setHighlightedTaskId]);

  // --- Cross-Domain Logic (Node -> Task) ---
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
      let targetColumn = columns.length > 0 ? columns[0] : null;

      if (!targetColumn) {
        const defaultColumn = { id: crypto.randomUUID(), title: 'To Do', cards: [] };
        await api.columns.create(defaultColumn);
        targetColumn = defaultColumn;
        setColumns([defaultColumn]);
      }

      await api.tasks.createTask(newCard, targetColumn.id);
      await api.nodes.update(nodeId, { linkedTaskId: newCard.id });

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
      setCurrentView(View.TaskBoard);
      setHighlightedTaskId(newCard.id);

    } catch (error) {
      console.error('Failed to convert node to task:', error);
      alert('Falha ao converter nó em tarefa. Por favor, tente novamente.');
    }
  }, [nodes, columns, setColumns, setNodes, setHighlightedTaskId]);

  // --- Import/Export ---
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
          setNodeTemplates(data.nodeTemplates || []);
          setUsers(data.users || []);
          alert('Project imported successfully!');
        } else {
          throw new Error('Invalid project file format.');
        }
      } catch (error) {
        alert(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  }, [setNodes, setConnections, setTexts, setColumns, setUsers, setNodeTemplates]);

  // --- Notifications ---
  const requestNotifications = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
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

  // --- Bug Tracker Logic ---
  const saveBugReport = useCallback(async (bug: BugReport) => {
    const existingIndex = bugReports.findIndex(b => b.id === bug.id);
    const isUpdate = existingIndex > -1;

    setBugReports(bugs => {
      if (isUpdate) {
        const newBugs = [...bugs];
        newBugs[existingIndex] = bug;
        return newBugs;
      } else {
        return [...bugs, bug];
      }
    });

    try {
      if (isUpdate) {
        await api.bugs.update(bug.id, bug);
      } else {
        await api.bugs.create(bug);
      }
    } catch (error) {
      console.error('Failed to save bug report:', error);
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
    const previousBugs = bugReports;
    setBugReports(bugs => bugs.filter(b => b.id !== bugId));
    try {
      await api.bugs.delete(bugId);
    } catch (error) {
      console.error('Failed to delete bug report:', error);
      setBugReports(previousBugs);
    }
  }, [bugReports]);

  // --- Team Logic ---
  const addUser = useCallback((user: User) => {
    setUsers(u => [...u, user]);
  }, [setUsers]);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(u => u.map(user => user.id === updatedUser.id ? updatedUser : user));
  }, [setUsers]);

  const deleteUser = useCallback((userId: string) => {
    setUsers(u => u.filter(user => user.id !== userId));
    setColumns(cols => cols.map(col => ({
      ...col,
      cards: col.cards.map(card => ({
        ...card,
        assignedUserIds: card.assignedUserIds?.filter(id => id !== userId),
      })),
    })));
    setBugReports(bugs => bugs.map(bug => {
      if (bug.assigneeId === userId) {
        return { ...bug, assigneeId: undefined };
      }
      return bug;
    }));
  }, [setUsers, setColumns]);

  // --- Invites & Profile Logic ---
  const handleAcceptInvite = useCallback(async (inviteId: string) => {
    try {
      await api.invites.accept(inviteId);
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
      alert('Convite aceito com sucesso!');
    } catch (error) {
      console.error('Failed to accept invite:', error);
      alert('Falha ao aceitar convite. Tente novamente.');
    }
  }, []);

  const handleRejectInvite = useCallback(async (inviteId: string) => {
    try {
      const numericId = parseInt(inviteId);
      if (isNaN(numericId)) throw new Error('Invalid invite ID');
      await api.invites.cancel(numericId);
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (error) {
      console.error('Failed to reject invite:', error);
      alert('Falha ao recusar convite. Tente novamente.');
    }
  }, []);

  const handleUpdateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const updatedProfile = await api.profile.update(updates);
      setUserProfile(updatedProfile);
      setUser((prev: any) => ({
        ...prev,
        ...updatedProfile,
        username: updatedProfile.name,
        avatar: updatedProfile.avatar
      }));
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }, []);

  const handleChangePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      await api.profile.changePassword(oldPassword, newPassword);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (isLoggedIn) {
        try {
          const profile = await api.profile.get();
          setUserProfile(profile);
          setUser((prev: any) => ({
            ...prev,
            ...profile,
            username: profile.name,
            avatar: profile.avatar
          }));
        } catch (error) {
          console.error('[App] Failed to load user profile:', error);
        }
      }
    };
    loadUserProfile();
  }, [isLoggedIn]);

  useEffect(() => {
    const loadInvites = async () => {
      if (isLoggedIn) {
        try {
          const userInvites = await api.invites.listMine();
          const transformedInvites = userInvites.map(inv => ({
            id: inv.id.toString(),
            workspaceId: inv.workspace_id || 0,
            workspaceName: inv.workspace_name || 'Unknown Workspace',
            inviterId: inv.invited_by || '',
            inviterName: inv.invited_by_name || 'Unknown',
            invitedEmail: inv.invited_email,
            role: inv.role,
            createdAt: inv.created_at,
            status: inv.status,
          }));
          setInvites(transformedInvites);
        } catch (error) {
          console.error('[App] Failed to load invites:', error);
        }
      }
    };
    loadInvites();
  }, [isLoggedIn]);

  const allTasks = useMemo(() => columns.flatMap(col => col.cards), [columns]);

  const allLabels = useMemo(() => {
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

  if (loadingWorkspace) {
    return <WorkspaceLoadingScreen workspaceName={loadingWorkspaceName || 'Workspace'} />;
  }

  if (needsWorkspaceSelection || !currentWorkspaceId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <WorkspaceSelector
          isOpen={true}
          onClose={() => { }}
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
        invites={invites}
        onAcceptInvite={handleAcceptInvite}
        onRejectInvite={handleRejectInvite}
        onOpenProfile={() => setIsProfileModalOpen(true)}
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
            navigateToTask={(taskId) => {
              setCurrentView(View.TaskBoard);
              setHighlightedTaskId(taskId);
            }}
            nodeTemplates={nodeTemplates}
            addTemplate={addTemplate}
            updateTemplate={updateTemplate}
            deleteTemplate={deleteNodeTemplate}
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
      {userProfile && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          onChangePassword={handleChangePassword}
        />
      )}
    </div>
  );
}

export default App;