import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { User, NodeTemplate, MindMapNode, Connection, MindMapText, TaskColumn, BugReport } from '../types';
import { INITIAL_TEMPLATES, DEFAULT_USERS } from '../constants';

interface UseWorkspaceDataProps {
    isLoggedIn: boolean;
}

export const useWorkspaceData = ({ isLoggedIn }: UseWorkspaceDataProps) => {
    const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
    const [needsWorkspaceSelection, setNeedsWorkspaceSelection] = useState(false);
    const [loadingWorkspace, setLoadingWorkspace] = useState(false);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(() => {
        const saved = localStorage.getItem('current_workspace_id');
        return saved ? parseInt(saved) : null;
    });
    const [currentWorkspaceName, setCurrentWorkspaceName] = useState<string>(() => {
        return localStorage.getItem('current_workspace_name') || 'My Workspace';
    });

    // Data states that are loaded with workspace
    const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
    const [nodeTemplates, setNodeTemplates] = useState<NodeTemplate[]>(INITIAL_TEMPLATES);

    // These will be passed to other hooks to initialize their state
    const [initialData, setInitialData] = useState<{
        nodes: MindMapNode[];
        connections: Connection[];
        texts: MindMapText[];
        columns: TaskColumn[];
        bugReports: BugReport[];
    } | null>(null);

    const handleSelectWorkspace = async (workspaceId: number) => {
        setLoadingWorkspace(true);
        setIsWorkspaceSelectorOpen(false);

        try {
            setCurrentWorkspaceId(workspaceId);
            localStorage.setItem('current_workspace_id', workspaceId.toString());
            console.log(`[App] Workspace ${workspaceId} selected, loading data...`);
            setNeedsWorkspaceSelection(false);
        } catch (error: any) {
            console.error('Failed to select workspace:', error);
            alert(`Erro ao selecionar workspace: ${error.message || 'Erro desconhecido'}`);
            setIsWorkspaceSelectorOpen(true);
        } finally {
            setLoadingWorkspace(false);
        }
    };

    const refreshWorkspaceData = useCallback(async () => {
        if (currentWorkspaceId && isLoggedIn) {
            try {
                console.log(`[App] Loading workspace ${currentWorkspaceId} data...`);
                const data = await api.workspaces.loadData(currentWorkspaceId);

                // Deduplicate data by ID
                const uniqueNodes = Array.from(
                    new Map((data.nodes || []).map((node: MindMapNode) => [node.id, node])).values()
                );
                const uniqueConnections = Array.from(
                    new Map((data.connections || []).map((conn: Connection) => [conn.id, conn])).values()
                );
                const uniqueTexts = Array.from(
                    new Map((data.texts || []).map((text: MindMapText) => [text.id, text])).values()
                );

                setInitialData({
                    nodes: uniqueNodes,
                    connections: uniqueConnections,
                    texts: uniqueTexts,
                    columns: data.columns || [],
                    bugReports: data.bugs || [],
                });

                setUsers(data.users || []);
                setNodeTemplates(data.templates || INITIAL_TEMPLATES);
                setCurrentWorkspaceName(data.workspace.name);
                localStorage.setItem('current_workspace_name', data.workspace.name);

                console.log(`[App] Workspace "${data.workspace.name}" loaded successfully`);
            } catch (error) {
                console.error('[App] Failed to auto-load workspace:', error);
            }
        }
    }, [currentWorkspaceId, isLoggedIn]);

    // Initial load
    useEffect(() => {
        refreshWorkspaceData();
    }, [refreshWorkspaceData]);

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

    return {
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
        deleteTemplate,
        initialData, // Expose this to initialize other hooks
        refreshWorkspaceData
    };
};
