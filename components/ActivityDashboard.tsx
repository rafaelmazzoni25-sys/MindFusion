import React, { useState, useEffect } from 'react';
import { api, Activity, ActivityFilters } from '../services/api';

interface ActivityDashboardProps {
    workspaceId: number;
}

const ActivityDashboard: React.FC<ActivityDashboardProps> = ({ workspaceId }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [offset, setOffset] = useState(0);
    const [filters, setFilters] = useState<ActivityFilters>({});
    const limit = 20;

    useEffect(() => {
        loadActivities();
    }, [workspaceId, offset, filters]);

    const loadActivities = async () => {
        try {
            setLoading(true);
            const response = await api.activities.list(workspaceId, limit, offset, filters);
            setActivities(response.activities);
            setTotal(response.total);
        } catch (error) {
            console.error('Failed to load activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (actionType: string) => {
        const icons: Record<string, string> = {
            created: '➕',
            updated: '✏️',
            deleted: '🗑️',
            shared: '📤',
            commented: '💬',
            moved: '↔️',
            assigned: '👤',
            completed: '✅',
        };
        return icons[actionType] || '📝';
    };

    const getEntityIcon = (entityType: string) => {
        const icons: Record<string, string> = {
            node: '🔵',
            connection: '🔗',
            task: '📋',
            bug: '🐛',
            workspace: '📁',
            member: '👥',
            text: '📝',
            comment: '💬',
        };
        return icons[entityType] || '📄';
    };

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

        if (seconds < 60) return 'há poucos segundos';
        if (seconds < 3600) return `há ${Math.floor(seconds / 60)} minutos`;
        if (seconds < 86400) return `há ${Math.floor(seconds / 3600)} horas`;
        if (seconds < 604800) return `há ${Math.floor(seconds / 86400)} dias`;
        return then.toLocaleDateString('pt-BR');
    };

    const groupByDate = (activities: Activity[]) => {
        const groups: Record<string, Activity[]> = {};

        activities.forEach(activity => {
            const date = new Date(activity.created_at);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let label: string;
            if (date.toDateString() === today.toDateString()) {
                label = 'Hoje';
            } else if (date.toDateString() === yesterday.toDateString()) {
                label = 'Ontem';
            } else {
                label = date.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            if (!groups[label]) {
                groups[label] = [];
            }
            groups[label].push(activity);
        });

        return groups;
    };

    const groupedActivities = groupByDate(activities);

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900">Atividades Recentes</h2>
                <p className="text-sm text-gray-600 mt-1">
                    {total} atividade{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200 p-4 flex gap-3">
                <select
                    value={filters.action_type || ''}
                    onChange={(e) => setFilters({ ...filters, action_type: e.target.value || undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Todas as ações</option>
                    <option value="created">Criadas</option>
                    <option value="updated">Atualizadas</option>
                    <option value="deleted">Deletadas</option>
                    <option value="shared">Compartilhadas</option>
                    <option value="commented">Comentadas</option>
                </select>

                <select
                    value={filters.entity_type || ''}
                    onChange={(e) => setFilters({ ...filters, entity_type: e.target.value || undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Todos os tipos</option>
                    <option value="node">Nodes</option>
                    <option value="task">Tasks</option>
                    <option value="bug">Bugs</option>
                    <option value="member">Membros</option>
                </select>

                {(filters.action_type || filters.entity_type) && (
                    <button
                        onClick={() => setFilters({})}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Activity List */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : Object.keys(groupedActivities).length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nenhuma atividade encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedActivities).map(([date, items]) => (
                            <div key={date}>
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 sticky top-0 bg-gray-50 py-2">
                                    {date}
                                </h3>
                                <div className="space-y-3">
                                    {items.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                                                    {getActionIcon(activity.action_type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900">
                                                        <span className="font-semibold">{activity.user_name}</span>
                                                        {' '}
                                                        <span className="text-gray-600">
                                                            {activity.action_type === 'created' && 'criou'}
                                                            {activity.action_type === 'updated' && 'atualizou'}
                                                            {activity.action_type === 'deleted' && 'deletou'}
                                                            {activity.action_type === 'shared' && 'compartilhou'}
                                                            {activity.action_type === 'commented' && 'comentou em'}
                                                            {activity.action_type === 'moved' && 'moveu'}
                                                            {activity.action_type === 'assigned' && 'atribuiu'}
                                                            {activity.action_type === 'completed' && 'completou'}
                                                        </span>
                                                        {' '}
                                                        <span className="inline-flex items-center gap-1">
                                                            <span>{getEntityIcon(activity.entity_type)}</span>
                                                            <span className="font-medium">{activity.entity_name || activity.entity_type}</span>
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatTimeAgo(activity.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        <span className="text-sm text-gray-600">
                            {offset + 1} - {Math.min(offset + limit, total)} de {total}
                        </span>
                        <button
                            onClick={() => setOffset(offset + limit)}
                            disabled={offset + limit >= total}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próxima
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityDashboard;
