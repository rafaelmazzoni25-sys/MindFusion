import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MindMapNode, TaskCard, TaskColumn, BugReport, User } from '../types';
import { MindMapIcon } from './icons/MindMapIcon';
import { TrelloIcon } from './icons/TrelloIcon';
import { BugIcon } from './icons/BugIcon';
import { SearchIcon } from './icons/SearchIcon';
import { UserIcon } from './icons/UserIcon';

export interface SearchResult {
  type: 'node' | 'task' | 'bug' | 'user';
  id: string;
  title: string;
  context: string;
  original: MindMapNode | TaskCard | BugReport | User;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: MindMapNode[];
  columns: TaskColumn[];
  bugReports: BugReport[];
  users: User[];
  onSelect: (result: SearchResult) => void;
}

const ResultItem: React.FC<{ result: SearchResult; isSelected: boolean; onClick: () => void; }> = ({ result, isSelected, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected) {
      ref.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  const ICONS: Record<SearchResult['type'], React.ReactNode> = {
    node: <MindMapIcon className="w-5 h-5 text-sky-500" />,
    task: <TrelloIcon className="w-5 h-5 text-blue-500" />,
    bug: <BugIcon className="w-5 h-5 text-red-500" />,
    user: <UserIcon className="w-5 h-5 text-gray-500" />,
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer ${isSelected ? 'bg-indigo-100' : 'hover:bg-gray-100'}`}
    >
      <div className="flex-shrink-0">{ICONS[result.type]}</div>
      <div className="flex-grow overflow-hidden">
        <p className="font-semibold text-gray-800 truncate">{result.title}</p>
        <p className="text-sm text-gray-500 truncate">{result.context}</p>
      </div>
    </div>
  );
};


const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, nodes, columns, bugReports, users, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search nodes
    nodes.forEach(node => {
      if (node.text.toLowerCase().includes(lowerCaseQuery)) {
        searchResults.push({ type: 'node', id: node.id, title: node.text, context: 'Mind Map Node', original: node });
      }
    });

    // Search tasks
    columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.content.toLowerCase().includes(lowerCaseQuery) || card.description?.toLowerCase().includes(lowerCaseQuery)) {
          searchResults.push({ type: 'task', id: card.id, title: card.content, context: `Task in "${column.title}"`, original: card });
        }
      });
    });

    // Search bugs
    bugReports.forEach(bug => {
      if (bug.summary.toLowerCase().includes(lowerCaseQuery) || bug.description.toLowerCase().includes(lowerCaseQuery) || bug.id.toLowerCase().includes(lowerCaseQuery)) {
        searchResults.push({ type: 'bug', id: bug.id, title: bug.summary, context: `Bug Report (${bug.id})`, original: bug });
      }
    });
    
    // Search users
    users.forEach(user => {
        if (user.name.toLowerCase().includes(lowerCaseQuery) || user.initials.toLowerCase().includes(lowerCaseQuery)) {
            searchResults.push({ type: 'user', id: user.id, title: user.name, context: 'User', original: user });
        }
    });

    setResults(searchResults);
    setActiveIndex(0);
  }, [query, nodes, columns, bugReports, users]);
  
  const groupedResults = useMemo(() => {
      return results.reduce((acc, result) => {
          if (!acc[result.type]) {
              acc[result.type] = [];
          }
          acc[result.type].push(result);
          return acc;
      }, {} as Record<SearchResult['type'], SearchResult[]>);
  }, [results]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex(i => (i + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex(i => (i - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
          if (results[activeIndex]) {
            handleSelect(results[activeIndex]);
          }
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, activeIndex, onClose]);
  
  const handleSelect = (result: SearchResult) => {
    if (result.type !== 'user') { // Do not navigate for users for now
      onSelect(result);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center pt-20" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center gap-3">
          <SearchIcon className="w-6 h-6 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for nodes, tasks, bugs..."
            className="w-full bg-transparent text-lg text-gray-800 focus:outline-none"
          />
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar p-3">
          {results.length > 0 ? (
            Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="mb-4">
                    <h3 className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider capitalize">{type}s</h3>
                    {/* FIX: Cast 'items' to SearchResult[] to resolve TypeScript inference issue. */}
                    {(items as SearchResult[]).map((result) => {
                        const globalIndex = results.findIndex(r => r.id === result.id && r.type === result.type);
                        return (
                            <ResultItem
                                key={`${result.type}-${result.id}`}
                                result={result}
                                isSelected={globalIndex === activeIndex}
                                onClick={() => handleSelect(result)}
                            />
                        )
                    })}
                </div>
            ))
          ) : (
            query.length > 1 && <p className="text-center text-gray-500 p-8">No results found for "{query}"</p>
          )}
        </div>
         <div className="flex-shrink-0 border-t p-3 text-sm text-gray-500 flex items-center justify-between">
            <span>{results.length} results</span>
            <div className="flex items-center gap-4">
                <span><kbd className="font-sans bg-gray-200 rounded px-1.5 py-0.5">↑</kbd> <kbd className="font-sans bg-gray-200 rounded px-1.5 py-0.5">↓</kbd> to navigate</span>
                <span><kbd className="font-sans bg-gray-200 rounded px-1.5 py-0.5">↵</kbd> to select</span>
                <span><kbd className="font-sans bg-gray-200 rounded px-1.5 py-0.5">esc</kbd> to close</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;