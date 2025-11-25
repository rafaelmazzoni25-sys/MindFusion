import React from 'react';

interface WorkspaceLoadingScreenProps {
    workspaceName?: string;
}

export const WorkspaceLoadingScreen: React.FC<WorkspaceLoadingScreenProps> = ({ workspaceName }) => {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 z-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {workspaceName ? `Carregando ${workspaceName}...` : 'Carregando workspace...'}
                </h2>
                <p className="text-gray-600">
                    Aguarde enquanto preparamos tudo para você
                </p>
            </div>
        </div>
    );
};

export default WorkspaceLoadingScreen;
