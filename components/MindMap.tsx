

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MindMapNode, Connection, Point, NodeShape, NodeTemplate, MindMapText } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LinkIcon } from './icons/LinkIcon';
import { TrelloIcon } from './icons/TrelloIcon';
import { PaletteIcon } from './icons/PaletteIcon';
import { RectangleIcon } from './icons/RectangleIcon';
import { RoundedRectangleIcon } from './icons/RoundedRectangleIcon';
import { EllipseIcon } from './icons/EllipseIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TemplateIcon } from './icons/TemplateIcon';
import { XIcon } from './icons/XIcon';
import { DiamondIcon } from './icons/DiamondIcon';
import { ParallelogramIcon } from './icons/ParallelogramIcon';
import { CylinderIcon } from './icons/CylinderIcon';
import { ImageIcon } from './icons/ImageIcon';
import { TextIcon } from './icons/TextIcon';
import { FontIcon } from './icons/FontIcon';

interface MindMapProps {
    nodes: MindMapNode[];
    connections: Connection[];
    texts: MindMapText[];
    addNode: (template?: Partial<Omit<MindMapNode, 'id' | 'position'>>) => void;
    addText: (position: Point) => void;
    addNodeAndConnect: (fromNodeId: string, position: Point) => void;
    deleteNode: (nodeId: string) => void;
    deleteText: (textId: string) => void;
    updateNodeText: (nodeId: string, newText: string) => void;
    updateTextProperties: (textId: string, properties: Partial<MindMapText>) => void;
    updateNodePosition: (nodeId: string, newPosition: Point) => void;
    updateNodeDimensions: (nodeId: string, dimensions: { width: number, height: number }) => void;
    updateNodeProperties: (nodeId: string, properties: Partial<Pick<MindMapNode, 'backgroundColor' | 'borderColor' | 'shape'>>) => void;
    updateNodeImage: (nodeId: string, imageUrl: string | null) => void;
    startConnection: (nodeId: string) => void;
    finishConnection: (toNodeId: string) => void;
    cancelConnection: () => void;
    connectingNodeId: string | null;
    convertNodeToTask: (nodeId: string) => void;
    navigateToTask: (taskId: string) => void;
    nodeTemplates: NodeTemplate[];
    addTemplate: (templateData: Omit<NodeTemplate, 'id'>) => void;
    updateTemplate: (templateId: string, updatedProperties: Partial<NodeTemplate>) => void;
    deleteTemplate: (templateId: string) => void;
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
    selectedTextId: string | null;
    setSelectedTextId: (id: string | null) => void;
}

const FONT_FAMILIES = ['Inter', 'Arial', 'Georgia', 'Courier New', 'Verdana'];

const SHAPE_COMPONENTS: Record<NodeShape, (props: { node: MindMapNode }) => React.ReactElement> = {
    [NodeShape.Rectangle]: ({ node }) => <rect x="0" y="0" width={node.width} height={node.height} fill={node.backgroundColor || '#f1f5f9'} stroke={node.borderColor || '#64748b'} strokeWidth="2" />,
    [NodeShape.Rounded]: ({ node }) => <rect x="0" y="0" width={node.width} height={node.height} rx="15" fill={node.backgroundColor || '#f0fdf4'} stroke={node.borderColor || '#4ade80'} strokeWidth="2" />,
    [NodeShape.Ellipse]: ({ node }) => <ellipse cx={node.width / 2} cy={node.height / 2} rx={node.width / 2} ry={node.height / 2} fill={node.backgroundColor || '#e0f2fe'} stroke={node.borderColor || '#38bdf8'} strokeWidth="2" />,
    [NodeShape.Diamond]: ({ node }) => {
        const points = `${node.width / 2},0 ${node.width},${node.height / 2} ${node.width / 2},${node.height} 0,${node.height / 2}`;
        return <polygon points={points} fill={node.backgroundColor || '#fffbeb'} stroke={node.borderColor || '#f59e0b'} strokeWidth="2" />
    },
    [NodeShape.Parallelogram]: ({ node }) => {
        const skew = node.width * 0.2;
        const points = `${skew},0 ${node.width},0 ${node.width - skew},${node.height} 0,${node.height}`;
        return <polygon points={points} fill={node.backgroundColor || '#faf5ff'} stroke={node.borderColor || '#a855f7'} strokeWidth="2" />
    },
    [NodeShape.Cylinder]: ({ node }) => {
        const { width, height } = node;
        const rx = width / 2;
        const ry = Math.min(height * 0.2, 20); // Cap ry for a better look
        const middleHeight = height - (2 * ry);

        if (middleHeight < 0) { // Handle case where height is too small
            return <ellipse cx={rx} cy={height / 2} rx={rx} ry={height / 2} fill={node.backgroundColor || '#f3e8ff'} stroke={node.borderColor || '#9333ea'} strokeWidth="2" />;
        }

        return (
            <g fill={node.backgroundColor || '#f3e8ff'} stroke={node.borderColor || '#9333ea'} strokeWidth="2">
                {/* Sides and bottom arc */}
                <path d={`M 0,${ry} V ${ry + middleHeight} A ${rx},${ry} 0 0 0 ${width},${ry + middleHeight} V ${ry}`} />
                {/* Top ellipse */}
                <ellipse cx={rx} cy={ry} rx={rx} ry={ry} />
            </g>
        );
    },
    [NodeShape.Image]: ({ node }) => (
        <>
            <defs>
                <clipPath id={`clip-${node.id}`}>
                    <rect x="2" y="2" width={node.width - 4} height={node.height - 4} rx="4" />
                </clipPath>
            </defs>
            <rect
                x="0"
                y="0"
                width={node.width}
                height={node.height}
                fill={node.backgroundColor || '#e5e7eb'}
                stroke={node.borderColor || '#9ca3af'}
                strokeWidth="2"
                rx="6"
            />
            {node.imageUrl ? (
                <image
                    href={node.imageUrl}
                    x="2"
                    y="2"
                    width={node.width - 4}
                    height={node.height - 4}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#clip-${node.id})`}
                />
            ) : (
                <foreignObject x="0" y="0" width={node.width} height={node.height}>
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                </foreignObject>
            )}
        </>
    ),
};

const NodeComponent: React.FC<{
    node: MindMapNode;
    isSelected: boolean;
    isEditing: boolean;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onDoubleClick: (nodeId: string) => void;
    onUpdateText: (nodeId: string, text: string) => void;
    onFinishEditing: () => void;
    onStartConnection: (e: React.MouseEvent, nodeId: string) => void;
    onFinishConnection: (nodeId: string) => void;
    onStartResize: (e: React.MouseEvent, nodeId: string) => void;
}> = ({ node, isSelected, isEditing, onMouseDown, onDoubleClick, onUpdateText, onFinishEditing, onStartConnection, onFinishConnection, onStartResize }) => {
    const patternId = `pattern-${node.id}`;

    const usePatternFill = node.imageUrl && node.shape !== NodeShape.Image;

    const nodeForShape = useMemo(() => ({
        ...node,
        backgroundColor: usePatternFill ? `url(#${patternId})` : node.backgroundColor,
    }), [node, patternId, usePatternFill]);

    const Shape = SHAPE_COMPONENTS[node.shape || NodeShape.Rectangle];
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && textAreaRef.current) {
            textAreaRef.current.focus();
            textAreaRef.current.select();
        }
    }, [isEditing]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdateText(node.id, e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            onFinishEditing();
            e.preventDefault();
        }
        if (e.key === 'Escape') {
            onFinishEditing();
        }
    };

    return (
        <g
            transform={`translate(${node.position.x}, ${node.position.y})`}
            onMouseDown={(e) => onMouseDown(e, node.id)}
            onMouseUp={() => onFinishConnection(node.id)}
            onDoubleClick={() => onDoubleClick(node.id)}
            className="cursor-pointer group"
        >
            {usePatternFill && (
                <defs>
                    <pattern id={patternId} patternUnits="userSpaceOnUse" width={node.width} height={node.height}>
                        <image href={node.imageUrl} x="0" y="0" width={node.width} height={node.height} preserveAspectRatio="xMidYMid slice" />
                    </pattern>
                </defs>
            )}

            <Shape node={nodeForShape} />
            {isEditing ? (
                <foreignObject x="5" y="5" width={node.width - 10} height={node.height - 10}>
                    <textarea
                        ref={textAreaRef}
                        value={node.text}
                        onChange={handleTextChange}
                        onBlur={onFinishEditing}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full p-1 text-center bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            lineHeight: '1.2',
                            textAlign: 'center',
                        }}
                    />
                </foreignObject>
            ) : (
                <>
                    {(node.imageUrl || node.shape === NodeShape.Image) && (
                        <rect
                            x="2"
                            y={node.height - 28}
                            width={node.width - 4}
                            height="26"
                            rx="5"
                            fill="rgba(255, 255, 255, 0.85)"
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                    <text x={node.width / 2} y={(node.imageUrl || node.shape === NodeShape.Image) ? node.height - 15 : node.height / 2} textAnchor="middle" dominantBaseline="middle" fill="#1f2937" style={{ userSelect: 'none', pointerEvents: 'none' }} className="font-medium">
                        {node.text}
                    </text>
                </>
            )}

            {isSelected && (
                <>
                    <rect x="-2" y="-2" width={node.width + 4} height={node.height + 4} fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="4 4" style={{ pointerEvents: 'none' }} />
                    <rect
                        x={node.width - 6}
                        y={node.height - 6}
                        width="12"
                        height="12"
                        fill="#4f46e5"
                        stroke="white"
                        strokeWidth="2"
                        rx="2"
                        className="cursor-nwse-resize"
                        onMouseDown={(e) => onStartResize(e, node.id)}
                    />
                </>
            )}

            <circle cx={node.width} cy={node.height / 2} r="8" fill="#4f46e5" className="opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair" onMouseDown={(e) => onStartConnection(e, node.id)} />
        </g>
    );
};

const TextComponent: React.FC<{
    textItem: MindMapText;
    isSelected: boolean;
    isEditing: boolean;
    onMouseDown: (e: React.MouseEvent, textId: string) => void;
    onDoubleClick: (textId: string) => void;
    onUpdate: (textId: string, newText: string) => void;
    onFinishEditing: () => void;
}> = ({ textItem, isSelected, isEditing, onMouseDown, onDoubleClick, onUpdate, onFinishEditing }) => {
    const textRef = useRef<HTMLDivElement>(null);

    // On mount and when not editing, keep the DOM in sync with React state.
    // This avoids using dangerouslySetInnerHTML which causes conflicts with contentEditable.
    useEffect(() => {
        if (textRef.current && !isEditing) {
            if (textRef.current.innerHTML !== textItem.text) {
                textRef.current.innerHTML = textItem.text;
            }
        }
    }, [textItem.text, isEditing]);

    // When we start editing, put the current text into the div if it isn't there,
    // then focus and select all content.
    useEffect(() => {
        if (isEditing && textRef.current) {
            // Set text content on entering edit mode to ensure it's current
            if (textRef.current.innerHTML !== textItem.text) {
                textRef.current.innerHTML = textItem.text;
            }

            textRef.current.focus();
            const range = document.createRange();
            range.selectNodeContents(textRef.current);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isEditing, textItem.text]); // Depend on textItem.text to handle cases where text is updated externally while editing is active.

    const handleBlur = () => {
        if (textRef.current) {
            onUpdate(textItem.id, textRef.current.innerHTML); // Use innerHTML to save any potential formatting
        }
        onFinishEditing();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            (e.target as HTMLDivElement).blur();
        }
    };

    return (
        <g
            transform={`translate(${textItem.position.x}, ${textItem.position.y})`}
            onMouseDown={(e) => onMouseDown(e, textItem.id)}
            onDoubleClick={() => onDoubleClick(textItem.id)}
            className="cursor-pointer group"
        >
            {isSelected && !isEditing && (
                <rect
                    x="-2"
                    y="-2"
                    width={textItem.width + 4}
                    height={(textRef.current?.offsetHeight || 20) + 4}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    style={{ pointerEvents: 'none' }}
                />
            )}
            <foreignObject x="0" y="0" width={textItem.width} height={9999}>
                <div
                    ref={textRef}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        fontFamily: textItem.fontFamily,
                        fontSize: `${textItem.fontSize}px`,
                        color: textItem.color,
                        outline: isEditing ? '2px solid #6366f1' : 'none',
                        borderRadius: isEditing ? '4px' : '0',
                        padding: '2px',
                        lineHeight: 1.4
                    }}
                // IMPORTANT: dangerouslySetInnerHTML is removed to prevent React from overwriting user input
                />
            </foreignObject>
        </g>
    );
};

const MindMap: React.FC<MindMapProps> = ({
    nodes,
    connections,
    texts,
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
    cancelConnection,
    connectingNodeId,
    convertNodeToTask,
    navigateToTask,
    nodeTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    selectedNodeId,
    setSelectedNodeId,
    selectedTextId,
    setSelectedTextId,
}) => {
    const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
    const [draggingState, setDraggingState] = useState<{ type: 'pan' | 'node' | 'text'; start: Point; nodeId?: string; textId?: string; offset: Point } | null>(null);
    const [resizingState, setResizingState] = useState<{ nodeId: string; initialWidth: number; initialHeight: number; start: Point; } | null>(null);
    const [mousePosition, setMousePosition] = useState<Point | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const screenToWorld = useCallback((p: Point): Point => {
        if (!containerRef.current) return p;
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (p.x - rect.left - view.x) / view.zoom,
            y: (p.y - rect.top - view.y) / view.zoom,
        };
    }, [view]);

    const handleAddText = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerPoint = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
        const worldPoint = screenToWorld(centerPoint);
        addText(worldPoint);
    };

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or alt+click for panning
            setDraggingState({ type: 'pan', start: { x: e.clientX, y: e.clientY }, offset: { x: 0, y: 0 } });
        } else if (e.target === e.currentTarget && e.button === 0) {
            setSelectedNodeId(null);
            setSelectedTextId(null);
            if (connectingNodeId) cancelConnection();
        }
    }, [connectingNodeId, cancelConnection, setSelectedNodeId, setSelectedTextId]);

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const startPos = screenToWorld({ x: e.clientX, y: e.clientY });
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setDraggingState({ type: 'node', nodeId, start: startPos, offset: { x: startPos.x - node.position.x, y: startPos.y - node.position.y } });
            setSelectedNodeId(nodeId);
            setSelectedTextId(null);
        }
    }, [screenToWorld, nodes, setSelectedNodeId, setSelectedTextId]);

    const handleTextMouseDown = useCallback((e: React.MouseEvent, textId: string) => {
        e.stopPropagation();
        const startPos = screenToWorld({ x: e.clientX, y: e.clientY });
        const textItem = texts.find(t => t.id === textId);
        if (textItem) {
            setDraggingState({ type: 'text', textId, start: startPos, offset: { x: startPos.x - textItem.position.x, y: startPos.y - textItem.position.y } });
            setSelectedTextId(textId);
            setSelectedNodeId(null);
        }
    }, [screenToWorld, texts, setSelectedNodeId, setSelectedTextId]);

    const handleResizeStart = useCallback((e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        setResizingState({
            nodeId,
            initialWidth: node.width,
            initialHeight: node.height,
            start: { x: e.clientX, y: e.clientY },
        });
        setDraggingState(null);
    }, [nodes]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const currentPos = { x: e.clientX, y: e.clientY };
        setMousePosition(screenToWorld(currentPos));

        if (resizingState) {
            const deltaX = (currentPos.x - resizingState.start.x) / view.zoom;
            const deltaY = (currentPos.y - resizingState.start.y) / view.zoom;

            const newWidth = Math.max(50, resizingState.initialWidth + deltaX);
            const newHeight = Math.max(50, resizingState.initialHeight + deltaY);

            updateNodeDimensions(resizingState.nodeId, { width: newWidth, height: newHeight });
            return;
        }

        if (!draggingState) return;

        if (draggingState.type === 'pan') {
            setView(v => ({ ...v, x: v.x + (currentPos.x - draggingState.start.x), y: v.y + (currentPos.y - draggingState.start.y) }));
            setDraggingState(s => s ? { ...s, start: currentPos } : null);
        } else if (draggingState.type === 'node' && draggingState.nodeId) {
            const worldPos = screenToWorld(currentPos);
            const newPosition = { x: worldPos.x - draggingState.offset.x, y: worldPos.y - draggingState.offset.y };
            updateNodePosition(draggingState.nodeId, newPosition);
        } else if (draggingState.type === 'text' && draggingState.textId) {
            const worldPos = screenToWorld(currentPos);
            const newPosition = { x: worldPos.x - draggingState.offset.x, y: worldPos.y - draggingState.offset.y };
            updateTextProperties(draggingState.textId, { position: newPosition });
        }
    }, [draggingState, resizingState, screenToWorld, updateNodePosition, updateNodeDimensions, view.zoom, updateTextProperties]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (resizingState) {
            setResizingState(null);
            return;
        }
        if (draggingState) {
            setDraggingState(null);
            return;
        }

        if (connectingNodeId && mousePosition && e.target === containerRef.current) {
            addNodeAndConnect(connectingNodeId, mousePosition);
        }
    }, [resizingState, draggingState, connectingNodeId, mousePosition, addNodeAndConnect]);

    const nodesMap = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);
    const textsMap = useMemo(() => new Map(texts.map(text => [text.id, text])), [texts]);

    const connectionPath = useCallback((fromNode: MindMapNode, toNode: MindMapNode) => {
        const start = { x: fromNode.position.x + fromNode.width, y: fromNode.position.y + fromNode.height / 2 };
        const end = { x: toNode.position.x, y: toNode.position.y + toNode.height / 2 };
        const dx = Math.abs(start.x - end.x) * 0.6;
        return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
    }, []);

    const finishEditing = useCallback(() => {
        setEditingNodeId(null);
    }, []);

    const selectedNode = selectedNodeId ? nodesMap.get(selectedNodeId) : null;
    const selectedText = selectedTextId ? textsMap.get(selectedTextId) : null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedNodeId) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                updateNodeImage(selectedNodeId, reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // Reset file input
    };

    // Use native event listener with passive: false to allow preventDefault
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();
            const scale = 1 - e.deltaY * 0.001;
            const newZoom = Math.max(0.2, Math.min(3, view.zoom * scale));

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const newX = mouseX - (mouseX - view.x) * (newZoom / view.zoom);
            const newY = mouseY - (mouseY - view.y) * (newZoom / view.zoom);

            setView({ x: newX, y: newY, zoom: newZoom });
        };

        container.addEventListener('wheel', wheelHandler, { passive: false });
        return () => container.removeEventListener('wheel', wheelHandler);
    }, [view.zoom, view.x, view.y]);

    return (
        <div className="w-full h-full bg-gray-100 relative overflow-hidden" ref={containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <svg className="w-full h-full absolute top-0 left-0 pointer-events-none">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
                    </marker>
                </defs>
                <g transform={`translate(${view.x}, ${view.y}) scale(${view.zoom})`}>
                    {connections.map(conn => {
                        const fromNode = nodesMap.get(conn.from);
                        const toNode = nodesMap.get(conn.to);
                        if (!fromNode || !toNode) return null;
                        return <path key={conn.id} d={connectionPath(fromNode, toNode)} stroke="#9ca3af" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />;
                    })}
                    {connectingNodeId && mousePosition && (() => {
                        const fromNode = nodesMap.get(connectingNodeId);
                        if (!fromNode) return null;
                        const start = { x: fromNode.position.x + fromNode.width, y: fromNode.position.y + fromNode.height / 2 };
                        const end = { x: mousePosition.x, y: mousePosition.y };
                        const dx = Math.abs(start.x - end.x) * 0.6;
                        const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;
                        return <path d={path} stroke="#4f46e5" strokeWidth="2" fill="none" strokeDasharray="5 5" markerEnd="url(#arrow)" />;
                    })()}
                </g>
            </svg>
            <div style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: 'top left', width: '1px', height: '1px' }}>
                <svg className="overflow-visible">
                    {nodes.map(node => (
                        <NodeComponent
                            key={node.id}
                            node={node}
                            isSelected={selectedNodeId === node.id}
                            isEditing={editingNodeId === node.id}
                            onMouseDown={handleNodeMouseDown}
                            onDoubleClick={setEditingNodeId}
                            onUpdateText={updateNodeText}
                            onFinishEditing={finishEditing}
                            onStartConnection={(e, nodeId) => { e.stopPropagation(); startConnection(nodeId); }}
                            onFinishConnection={finishConnection}
                            onStartResize={handleResizeStart}
                        />
                    ))}
                    {texts.map(textItem => (
                        <TextComponent
                            key={textItem.id}
                            textItem={textItem}
                            isSelected={selectedTextId === textItem.id}
                            isEditing={editingTextId === textItem.id}
                            onMouseDown={handleTextMouseDown}
                            onDoubleClick={setEditingTextId}
                            onUpdate={(id, newText) => updateTextProperties(id, { text: newText })}
                            onFinishEditing={() => setEditingTextId(null)}
                        />
                    ))}
                </svg>
            </div>

            <div className="absolute top-4 left-4 flex gap-2">
                <button onClick={() => addNode()} className="p-2 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors"><PlusIcon className="w-6 h-6 text-gray-700" /></button>
                <button onClick={handleAddText} title="Add text" className="p-2 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors"><TextIcon className="w-6 h-6 text-gray-700" /></button>
            </div>

            {selectedNode && (
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 w-[calc(100%-2rem)] max-w-sm sm:w-64 animate-fade-in-scale-up max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
                    <h3 className="font-bold mb-3 text-lg text-gray-900">Node Properties</h3>
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-700">Actions</h4>
                            <div className="space-y-1">
                                <button onClick={() => setEditingNodeId(selectedNodeId)} className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 text-gray-700">
                                    <PencilIcon className="w-5 h-5" /> Edit Text
                                </button>
                                <button onClick={() => startConnection(selectedNodeId)} className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 text-gray-700">
                                    <LinkIcon className="w-5 h-5" /> Create Link
                                </button>
                                {selectedNode.linkedTaskId ? (
                                    <button onClick={() => navigateToTask(selectedNode.linkedTaskId!)} className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 text-indigo-600 font-semibold">
                                        <TrelloIcon className="w-5 h-5" /> View Task
                                    </button>
                                ) : (
                                    <button onClick={() => convertNodeToTask(selectedNodeId)} className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 text-gray-700">
                                        <TrelloIcon className="w-5 h-5" /> Convert to Task
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="border-t my-2" />

                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-2"><PaletteIcon className="w-5 h-5" /> Appearance</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600">Shape</label>
                                    <div className="flex justify-around items-center mt-1 bg-gray-100 p-1 rounded-md">
                                        {(Object.values(NodeShape) as NodeShape[]).map(shape => {
                                            const ShapeIcon = {
                                                [NodeShape.Rectangle]: RectangleIcon,
                                                [NodeShape.Rounded]: RoundedRectangleIcon,
                                                [NodeShape.Ellipse]: EllipseIcon,
                                                [NodeShape.Diamond]: DiamondIcon,
                                                [NodeShape.Parallelogram]: ParallelogramIcon,
                                                [NodeShape.Cylinder]: CylinderIcon,
                                                [NodeShape.Image]: ImageIcon,
                                            }[shape];
                                            return (
                                                <button
                                                    key={shape}
                                                    onClick={() => updateNodeProperties(selectedNodeId, { shape })}
                                                    className={`p-1.5 rounded ${selectedNode.shape === shape ? 'bg-indigo-500 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
                                                    title={`Shape: ${shape}`}
                                                >
                                                    <ShapeIcon className="w-5 h-5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                {selectedNode.shape !== NodeShape.Image && (
                                    <div className="flex gap-3">
                                        <div className="w-1/2">
                                            <label htmlFor={`bg-color-${selectedNodeId}`} className="text-xs font-medium text-gray-600">Fill</label>
                                            <div className="relative mt-1 h-8 w-full rounded border border-gray-300" style={{ backgroundColor: selectedNode.backgroundColor || '#ffffff' }}>
                                                <input
                                                    id={`bg-color-${selectedNodeId}`}
                                                    type="color"
                                                    value={selectedNode.backgroundColor || '#ffffff'}
                                                    onChange={(e) => updateNodeProperties(selectedNodeId, { backgroundColor: e.target.value })}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-1/2">
                                            <label htmlFor={`border-color-${selectedNodeId}`} className="text-xs font-medium text-gray-600">Stroke</label>
                                            <div className="relative mt-1 h-8 w-full rounded border border-gray-300" style={{ backgroundColor: selectedNode.borderColor || '#000000' }}>
                                                <input
                                                    id={`border-color-${selectedNodeId}`}
                                                    type="color"
                                                    value={selectedNode.borderColor || '#000000'}
                                                    onChange={(e) => updateNodeProperties(selectedNodeId, { borderColor: e.target.value })}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t my-2" />

                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Image</h4>
                            {selectedNode.imageUrl ? (
                                <div className="relative group">
                                    <img src={selectedNode.imageUrl} alt={selectedNode.text} className="w-full rounded-md border" />
                                    <button
                                        onClick={() => updateNodeImage(selectedNodeId, null)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium cursor-pointer">
                                    <PlusIcon className="w-5 h-5" /> Upload Image
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}
                        </div>

                        <div className="border-t my-2" />

                        <button onClick={() => deleteNode(selectedNodeId)} className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-semibold">
                            <TrashIcon className="w-5 h-5" /> Delete Node
                        </button>
                    </div>
                </div>
            )}

            {selectedText && (
                <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 w-[calc(100%-2rem)] max-w-sm sm:w-64 animate-fade-in-scale-up max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
                    <h3 className="font-bold mb-3 text-lg text-gray-900">Text Properties</h3>
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-700">Actions</h4>
                            <button onClick={() => setEditingTextId(selectedTextId)} className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 text-gray-700">
                                <PencilIcon className="w-5 h-5" /> Edit Text
                            </button>
                        </div>
                        <div className="border-t my-2" />
                        <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-700 flex items-center gap-2"><FontIcon className="w-5 h-5" /> Appearance</h4>
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor={`font-family-${selectedTextId}`} className="text-xs font-medium text-gray-600">Font</label>
                                    <select
                                        id={`font-family-${selectedTextId}`}
                                        value={selectedText.fontFamily}
                                        onChange={(e) => updateTextProperties(selectedTextId, { fontFamily: e.target.value })}
                                        className="mt-1 w-full p-1.5 border rounded-md text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
                                    >
                                        {FONT_FAMILIES.map(font => <option key={font} value={font} className="text-black bg-white">{font}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-3 items-end">
                                    <div className="w-1/2">
                                        <label htmlFor={`font-size-${selectedTextId}`} className="text-xs font-medium text-gray-600">Size</label>
                                        <input
                                            id={`font-size-${selectedTextId}`}
                                            type="number"
                                            value={selectedText.fontSize}
                                            onChange={(e) => updateTextProperties(selectedTextId, { fontSize: parseInt(e.target.value, 10) || 16 })}
                                            className="mt-1 w-full p-1.5 border rounded-md text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label htmlFor={`color-${selectedTextId}`} className="text-xs font-medium text-gray-600">Color</label>
                                        <div className="relative mt-1 h-8 w-full rounded border border-gray-300" style={{ backgroundColor: selectedText.color }}>
                                            <input
                                                id={`color-${selectedTextId}`}
                                                type="color"
                                                value={selectedText.color}
                                                onChange={(e) => updateTextProperties(selectedTextId, { color: e.target.value })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor={`width-${selectedTextId}`} className="text-xs font-medium text-gray-600">Width</label>
                                    <input
                                        id={`width-${selectedTextId}`}
                                        type="number"
                                        value={selectedText.width}
                                        onChange={(e) => updateTextProperties(selectedTextId, { width: parseInt(e.target.value, 10) || 200 })}
                                        className="mt-1 w-full p-1.5 border rounded-md text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="border-t my-2" />
                        <button onClick={() => deleteText(selectedTextId)} className="w-full flex items-center justify-center gap-2 p-2 rounded-md bg-red-50 hover:bg-red-100 text-red-600 font-semibold">
                            <TrashIcon className="w-5 h-5" /> Delete Text
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MindMap;