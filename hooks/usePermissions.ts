import { useState, useEffect, useCallback } from 'react';
import { api, Role, UserPermissions } from '../services/api';

/**
 * Hook to manage user permissions in a workspace
 * Returns role and permission checking function
 */
export const usePermissions = (workspaceId: number | null) => {
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!workspaceId) {
            setPermissions(null);
            setLoading(false);
            return;
        }

        const fetchPermissions = async () => {
            try {
                setLoading(true);
                setError(null);
                const perms = await api.permissions.getMyPermissions(workspaceId);
                setPermissions(perms);
            } catch (err: any) {
                setError(err.message || 'Failed to load permissions');
                setPermissions(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, [workspaceId]);

    const can = useCallback((action: keyof UserPermissions['can']): boolean => {
        if (!permissions) return false;
        return permissions.can[action] || false;
    }, [permissions]);

    const hasRole = useCallback((role: Role): boolean => {
        if (!permissions) return false;
        return permissions.role === role;
    }, [permissions]);

    const isAtLeast = useCallback((role: Role): boolean => {
        if (!permissions) return false;
        const roleHierarchy: Role[] = ['Viewer', 'Editor', 'Admin', 'Owner'];
        const userRoleIndex = roleHierarchy.indexOf(permissions.role);
        const requiredRoleIndex = roleHierarchy.indexOf(role);
        return userRoleIndex >= requiredRoleIndex;
    }, [permissions]);

    return {
        permissions,
        role: permissions?.role || null,
        loading,
        error,
        can,
        hasRole,
        isAtLeast,
    };
};

export default usePermissions;
