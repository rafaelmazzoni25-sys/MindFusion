import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { MindMapNode, Connection, MindMapText, Point, NodeShape } from '../types';
import { INITIAL_NODES, INITIAL_CONNECTIONS, INITIAL_TEXTS } from '../constants';

interface UseMindMapProps {
    initialData: {
        nodes: MindMapNode[];
        connections: Connection[];
        texts: MindMapText[];
    } | null;
}

export const useMindMap = ({ initialData }: UseMindMapProps) => {
    const [nodes, setNodes] = useState<MindMapNode[]>(INITIAL_NODES);
    const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
    const [texts, setTexts] = useState<MindMapText[]>(INITIAL_TEXTS);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

    // Sync with initial data when it loads
    useEffect(() => {
        if (initialData) {
            setNodes(initialData.nodes);
            setConnections(initialData.connections);
            setTexts(initialData.texts);
        }
    }, [initialData]);

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
        setNodes(n => [...n, newNode]);
        try {
            await api.nodes.create(newNode);
        } catch (error) {
            console.error('Failed to create node:', error);
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
        setTexts(t => [...t, newText]);
        try {
            await api.texts.create(newText);
        } catch (error) {
            console.error('Failed to create text:', error);
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
        setNodes(n => [...n, newNode]);
        setConnections(c => [...c, newConnection]);
        setConnectingNodeId(null);
        try {
            await api.nodes.create(newNode);
            await api.connections.create(newConnection);
        } catch (error) {
            console.error('Failed to create node and connection:', error);
            setNodes(n => n.filter(node => node.id !== newNode.id));
            setConnections(c => c.filter(conn => conn.id !== newConnection.id));
        }
    }, []);

    const deleteNode = useCallback(async (nodeId: string) => {
        const previousNodes = nodes;
        const previousConnections = connections;
        setNodes(n => n.filter(node => node.id !== nodeId));
        setConnections(c => c.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
        try {
            await api.nodes.delete(nodeId);
        } catch (error) {
            console.error('Failed to delete node:', error);
            setNodes(previousNodes);
            setConnections(previousConnections);
        }
    }, [nodes, connections]);

    const deleteText = useCallback(async (textId: string) => {
        const previousTexts = texts;
        setTexts(t => t.filter(text => text.id !== textId));
        try {
            await api.texts.delete(textId);
        } catch (error) {
            console.error('Failed to delete text:', error);
            setTexts(previousTexts);
        }
    }, [texts]);

    const updateNodeText = useCallback(async (nodeId: string, newText: string) => {
        setNodes(n => n.map(node => node.id === nodeId ? { ...node, text: newText } : node));
        try {
            await api.nodes.update(nodeId, { text: newText });
        } catch (error) {
            console.error('Failed to update node text:', error);
        }
    }, []);

    const updateTextProperties = useCallback(async (textId: string, properties: Partial<MindMapText>) => {
        setTexts(t => t.map(text => text.id === textId ? { ...text, ...properties } : text));
        try {
            await api.texts.update(textId, properties);
        } catch (error) {
            console.error('Failed to update text properties:', error);
        }
    }, []);

    const updateNodePosition = useCallback(async (nodeId: string, newPosition: Point) => {
        setNodes(n => n.map(node => node.id === nodeId ? { ...node, position: newPosition } : node));
        try {
            await api.nodes.update(nodeId, { position: newPosition });
        } catch (error) {
            console.error('Failed to update node position:', error);
        }
    }, []);

    const updateNodeDimensions = useCallback(async (nodeId: string, dimensions: { width: number, height: number }) => {
        setNodes(n => n.map(node => node.id === nodeId ? { ...node, ...dimensions } : node));
        try {
            await api.nodes.update(nodeId, dimensions);
        } catch (error) {
            console.error('Failed to update node dimensions:', error);
        }
    }, []);

    const updateNodeProperties = useCallback(async (nodeId: string, properties: Partial<Pick<MindMapNode, 'backgroundColor' | 'borderColor' | 'shape'>>) => {
        setNodes(n => n.map(node => node.id === nodeId ? { ...node, ...properties } : node));
        try {
            await api.nodes.update(nodeId, properties);
        } catch (error) {
            console.error('Failed to update node properties:', error);
        }
    }, []);

    const updateNodeImage = useCallback(async (nodeId: string, imageUrl: string | null) => {
        setNodes(n => n.map(node => (node.id === nodeId ? { ...node, imageUrl: imageUrl || undefined } : node)));
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
            setConnections(c => [...c, newConnection]);
            try {
                await api.connections.create(newConnection);
            } catch (error) {
                console.error('Failed to create connection:', error);
                setConnections(c => c.filter(conn => conn.id !== newConnection.id));
            }
        }
        setConnectingNodeId(null);
    }, [connectingNodeId]);

    const cancelConnection = useCallback(() => {
        setConnectingNodeId(null);
    }, []);

    return {
        nodes,
        setNodes,
        connections,
        setConnections,
        texts,
        setTexts,
        connectingNodeId,
        addNode,
        addText,
        addNodeAndConnect,
        deleteNode,
        deleteText,
        updateNodeText,
        updateTextProperties,
        updateNodePosition,
        updateNodeDimensions,
        updateNodeProperties,
        updateNodeImage,
        startConnection,
        finishConnection,
        cancelConnection
    };
};
