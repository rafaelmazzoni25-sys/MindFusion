import { getAuthToken } from './api';

export interface SyncEvent {
    id: number;
    type: string;
    entity_type: string;
    entity_id: string;
    data: any;
    user_name: string;
    timestamp: string;
}

export type SyncEventHandler = (event: SyncEvent) => void;

export class SyncService {
    private eventSource: EventSource | null = null;
    private workspaceId: number | null = null;
    private lastEventId: number = 0;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private handlers: Map<string, SyncEventHandler[]> = new Map();
    private onConnectionChange?: (connected: boolean) => void;

    /**
     * Connect to SSE stream for a workspace
     */
    connect(workspaceId: number, onConnectionChange?: (connected: boolean) => void) {
        this.workspaceId = workspaceId;
        this.onConnectionChange = onConnectionChange;
        this.reconnectAttempts = 0;
        this._connect();
    }

    private _connect() {
        if (!this.workspaceId) return;

        const token = getAuthToken();
        if (!token) {
            console.error('No auth token available for sync');
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const url = `${apiUrl}/sync/stream.php?workspace_id=${this.workspaceId}&lastEventId=${this.lastEventId}`;

        // Close existing connection
        this.disconnect();

        // Create new EventSource with auth header (via URL param since EventSource doesn't support headers)
        // Note: In production, consider using a session-based auth or temporary token in URL
        this.eventSource = new EventSource(url);

        this.eventSource.onopen = () => {
            console.log(`[Sync] Connected to workspace ${this.workspaceId}`);
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.onConnectionChange?.(true);
        };

        this.eventSource.addEventListener('connected', (e: any) => {
            console.log('[Sync]', JSON.parse(e.data).message);
        });

        // Listen for all event types
        const eventTypes = [
            'node_created', 'node_updated', 'node_deleted',
            'connection_created', 'connection_deleted',
            'task_created', 'task_updated', 'task_deleted', 'task_moved',
            'bug_created', 'bug_updated', 'bug_deleted',
            'text_created', 'text_updated', 'text_deleted',
            'member_added', 'member_removed', 'member_updated'
        ];

        eventTypes.forEach(eventType => {
            this.eventSource!.addEventListener(eventType, (e: any) => {
                const eventData: SyncEvent = JSON.parse(e.data);
                this.lastEventId = eventData.id;
                this._dispatchEvent(eventType, eventData);
            });
        });

        this.eventSource.onerror = (error) => {
            console.error('[Sync] Connection error:', error);
            this.onConnectionChange?.(false);

            // Attempt to reconnect
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`[Sync] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

                setTimeout(() => {
                    this._connect();
                }, this.reconnectDelay);

                // Exponential backoff
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
            } else {
                console.error('[Sync] Max reconnection attempts reached');
            }
        };
    }

    /**
     * Disconnect from SSE stream
     */
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.onConnectionChange?.(false);
            console.log('[Sync] Disconnected');
        }
    }

    /**
     * Subscribe to specific event types
     */
    on(eventType: string, handler: SyncEventHandler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
    }

    /**
     * Unsubscribe from specific event types
     */
    off(eventType: string, handler: SyncEventHandler) {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Subscribe to all events
     */
    onAny(handler: SyncEventHandler) {
        this.on('*', handler);
    }

    /**
     * Dispatch event to handlers
     */
    private _dispatchEvent(eventType: string, event: SyncEvent) {
        // Call specific handlers
        const handlers = this.handlers.get(eventType) || [];
        handlers.forEach(handler => handler(event));

        // Call wildcard handlers
        const wildcardHandlers = this.handlers.get('*') || [];
        wildcardHandlers.forEach(handler => handler(event));
    }

    /**
     * Check if currently connected
     */
    isConnected(): boolean {
        return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
    }
}

// Singleton instance
export const syncService = new SyncService();

export default syncService;
