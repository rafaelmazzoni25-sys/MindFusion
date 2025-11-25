import React, { useState, useEffect } from 'react';
import { api, Workspace } from '../services/api';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';

interface WorkspaceSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectWorkspace: (workspaceId: number) => void;
    currentWorkspaceId: number | null;
    preventClose?: boolean; // Prevent closing when selection is mandatory
    isFirstSelection?: boolean; // Show welcome message on first selection
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
    isOpen,
    onClose,
    onSelectWorkspace,
    currentWorkspaceId,
    preventClose = false,
    isFirstSelection = false
}) => {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingNew, setCreatingNew] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadWorkspaces();
        }
    }, [isOpen]);

    const loadWorkspaces = async () => {
        try {
            setLoading(true);
            const response = await api.workspaces.list();
            setWorkspaces(response.workspaces);
        } catch (error) {
            console.error('Failed to load workspaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim()) {
            alert('Please enter a workspace name');
            return;
        }

        try {
            const newWorkspace = await api.workspaces.create(newWorkspaceName);
            setWorkspaces(prev => [...prev, newWorkspace]);
            setNewWorkspaceName('');
            setCreatingNew(false);
            alert(`Workspace "${newWorkspace.name}" created successfully!`);
        } catch (error: any) {
            alert(error.message || 'Failed to create workspace');
        }
    };

    const handleSelectWorkspace = (workspace: Workspace) => {
        onSelectWorkspace(workspace.id);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={preventClose ? undefined : onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600">
                    <h2 className="text-xl font-bold text-white">
                        {isFirstSelection ? 'Bem-vindo! Selecione um Workspace' : 'My Workspaces'}
                    </h2>
                    {!preventClose && (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                            <XIcon className="w-6 h-6 text-white" />
                        </button>
                    )}
                </header>

                <main className="p-6 overflow-y-auto max-h-[60vh]">
                    {isFirstSelection && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                <strong>👋 Olá!</strong> Selecione um workspace para começar a trabalhar, ou crie um novo.
                            </p>
                        </div>
                    )}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Loading workspaces...</p>
                        </div>
                    ) : (
                        <>
                            {/* Create New Workspace */}
                            {creatingNew ? (
                                <div className="mb-6 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                                    <h3 className="font-semibold text-gray-800 mb-3">Create New Workspace</h3>
                                    <input
                                        type="text"
                                        value={newWorkspaceName}
                                        onChange={e => setNewWorkspaceName(e.target.value)}
                                        placeholder="Workspace name"
                                        className="w-full p-2 border rounded-md mb-3"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateWorkspace}
                                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCreatingNew(false);
                                                setNewWorkspaceName('');
                                            }}
                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setCreatingNew(true)}
                                    className="w-full mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span className="font-semibold">Create New Workspace</span>
                                </button>
                            )}

                            {/* Workspaces List */}
                            <div className="space-y-3">
                                {workspaces.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No workspaces yet. Create one to get started!</p>
                                ) : (
                                    workspaces.map(workspace => (
                                        <div
                                            key={workspace.id}
                                            onClick={() => handleSelectWorkspace(workspace)}
                                            className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${workspace.id === currentWorkspaceId
                                                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                                                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                                }
                      `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                        {workspace.name}
                                                        {workspace.id === currentWorkspaceId && (
                                                            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Current</span>
                                                        )}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                                        {workspace.is_owner ? (
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                Owner
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                {workspace.role} · Shared by {workspace.owned_by}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {workspace.id === currentWorkspaceId && (
                                                    <div className="text-indigo-600">
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </main>

                <footer className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
                    </p>
                    {!preventClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Close
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};
