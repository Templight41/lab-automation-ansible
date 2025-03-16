"use client"

import { useEffect, useState } from 'react';
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
const Terminal = dynamic(
  () => import('../components/Terminal'),
  { ssr: false }
);
import { useWebSocket } from '../context/WebSocketContext';
import { usePathname, useRouter } from 'next/navigation';

interface Playbook {
    id: string;
    name: string;
    content: string;
    createdAt: string;
}

// Add interface for system data
interface System {
    id: string;
    address: string;
    lab: string;
}

export default function Playbooks() {
    const router = useRouter();
    const pathname = usePathname();
    const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
    const [selectedLab, setSelectedLab] = useState<string>('all');
    const [editorContent, setEditorContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newPlaybookName, setNewPlaybookName] = useState('');
    const [showTerminal, setShowTerminal] = useState(false);
    const { socket, isConnected, sendMessage } = useWebSocket();
    const [searchParams, setSearchParams] = useState<URLSearchParams>();
    const [availableLabs, setAvailableLabs] = useState<string[]>(['all']);
    const [labsLoading, setLabsLoading] = useState(false);

    useEffect(() => {
        // Get URL params on mount
        const params = new URLSearchParams(window.location.search);
        setSearchParams(params);

        // If playbook ID is provided, select that playbook
        const playbookId = params.get('id');
        if (playbookId) {
            const playbook = playbooks.find(p => p.id === playbookId);
            if (playbook) {
                handleSelectPlaybook(playbook);
            }
        }

        // If new flag is set, open create modal
        if (params.get('new') === 'true') {
            setShowModal(true);
        } else {
            setShowModal(false);
        }
        
    }, [playbooks]);

    // Fetch playbooks on component mount
    useEffect(() => {
        fetchPlaybooks();
        fetchLabs();
    }, []);

    const fetchPlaybooks = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/playbooks');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setPlaybooks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch playbooks');
            console.error('Error fetching playbooks:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLabs = async () => {
        setLabsLoading(true);
        try {
            const response = await fetch('/api/systems');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const systems: System[] = await response.json();
            
            // Extract unique lab values from systems
            const uniqueLabs = new Set<string>();
            uniqueLabs.add('all'); // Always include "all" option
            
            systems.forEach(system => {
                if (system.lab) {
                    uniqueLabs.add(system.lab);
                }
            });
            
            setAvailableLabs(Array.from(uniqueLabs).sort());
        } catch (err) {
            console.error('Error fetching labs:', err);
        } finally {
            setLabsLoading(false);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        setEditorContent(value || '');
    };

    const handleSelectPlaybook = (playbook: Playbook) => {
        // searchParams?.set('id', playbook.id);
        // router.push(pathname as string + '?' + searchParams?.toString());
        setSelectedPlaybook(playbook);
        setEditorContent(playbook.content);
        setIsEditing(true);
        setShowTerminal(true);
    };

    const handleCreatePlaybook = async () => {
        if (!newPlaybookName.trim()) {
            alert('Please enter a playbook name');
            return;
        }

        try {
            const newPlaybook = {
                id: uuidv4(),
                name: newPlaybookName,
                content: '# New Playbook\n---\n- hosts: all\n  tasks:\n    - name: Example task\n      debug:\n        msg: Hello World'
            };

            const response = await fetch('/api/playbooks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPlaybook),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const createdPlaybook = await response.json();
            if(createdPlaybook.error) {
                console.error('error creating playbook')
                throw new Error(createdPlaybook.error);
            }

            searchParams?.delete('new');
            router.push(pathname as string + '?' + searchParams?.toString());
            setShowModal(false);

            setPlaybooks([...playbooks, createdPlaybook]);
            setNewPlaybookName('');


            
            // Select the newly created playbook
            handleSelectPlaybook(createdPlaybook);
            return {success: true};
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create playbook');
            console.error('Error creating playbook:', err);
            return {success: false};
        }
    };

    const handleUpdatePlaybook = async () => {
        if (!selectedPlaybook) return;

        try {
            const updatedPlaybook = {
                ...selectedPlaybook,
                content: editorContent
            };

            const response = await fetch('/api/playbooks', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedPlaybook),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const updated = await response.json();
            
            // Update the playbooks list
            setPlaybooks(playbooks.map(p => 
                p.id === updated.id ? updated : p
            ));
            
            setSelectedPlaybook(updated);
            alert('Playbook updated successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update playbook');
            console.error('Error updating playbook:', err);
        }
    };

    const handleDeletePlaybook = async (id: string) => {
        if (!confirm('Are you sure you want to delete this playbook?')) return;

        try {
            const response = await fetch('/api/playbooks', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Remove from state
            setPlaybooks(playbooks.filter(p => p.id !== id));
            
            // If the deleted playbook was selected, clear the selection
            if (selectedPlaybook && selectedPlaybook.id === id) {
                setSelectedPlaybook(null);
                setEditorContent('');
                setIsEditing(false);
                setShowTerminal(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete playbook');
            console.error('Error deleting playbook:', err);
        }
    };


    const handleRunPlaybook = () => {
        if (selectedPlaybook) {
            // Just show the terminal - it will auto-run the playbook
            setShowTerminal(true);
            console.log(selectedPlaybook)
            sendMessage({
                type: 'command',
                playbookID: selectedPlaybook.id,
                command: 'run-playbook',
                lab: selectedLab || 'all'
            });
        }
    };

    const handleLabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLab(e.target.value);
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Playbooks</h1>
                <button 
                    onClick={() => {
                        searchParams?.set('new', 'true');
                        router.push(pathname as string + '?' + searchParams?.toString());
                        setShowModal(true);
                        setNewPlaybookName('');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Create New Playbook
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900 text-red-200 rounded border border-red-700">
                    Error: {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Playbooks List */}
                <div className="md:col-span-1 bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 text-white">Playbooks</h2>
                    
                    {loading ? (
                        <p className="text-gray-300">Loading playbooks...</p>
                    ) : playbooks.length === 0 ? (
                        <p className="text-gray-400">No playbooks found</p>
                    ) : (
                        <ul className="space-y-2">
                            {playbooks.map((playbook) => (
                                <li 
                                    key={playbook.id} 
                                    className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                                        selectedPlaybook?.id === playbook.id 
                                            ? 'bg-blue-900 border-l-4 border-blue-500' 
                                            : 'hover:bg-gray-700'
                                    }`}
                                >
                                    <div 
                                        className="flex-grow"
                                        onClick={() => {
                                            searchParams?.delete('id');
                                            searchParams?.set('id', playbook.id);
                                            router.push(pathname as string + '?' + searchParams?.toString());
                                            handleSelectPlaybook(playbook)
                                        }}
                                    >
                                        <div className="font-medium text-white">{playbook.name}</div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(playbook.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeletePlaybook(playbook.id)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Editor Section */}
                <div className="md:col-span-3">
                    {isEditing && selectedPlaybook ? (
                        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-white">
                                    Editing: {selectedPlaybook.name}
                                </h2>
                                <div className="flex gap-2 items-center">
                                    {/* Add Lab Selector */}
                                    <div className="mr-2">
                                        <label htmlFor="lab-select" className="text-white mr-2">Target Lab:</label>
                                        <select 
                                            id="lab-select"
                                            value={selectedLab}
                                            onChange={handleLabChange}
                                            className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={labsLoading}
                                        >
                                            {labsLoading ? (
                                                <option value="">Loading labs...</option>
                                            ) : (
                                                availableLabs.map((lab) => (
                                                    <option key={lab} value={lab}>
                                                        {lab === 'all' ? 'All Labs' : lab}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={handleRunPlaybook}
                                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                                    >
                                        Run Playbook
                                    </button>
                                    <button 
                                        onClick={handleUpdatePlaybook}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                            
                            {showTerminal ? (
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium text-white mb-2">Terminal Output</h3>
                                    <Terminal 
                                        playbookId={selectedPlaybook.id} 
                                        height="300px"
                                    />
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={() => setShowTerminal(false)}
                                            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                        >
                                            Hide Terminal
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                            
                            <div className="border border-gray-600 rounded" style={{ height: showTerminal ? '300px' : '600px' }}>
                                <MonacoEditor
                                    height="100%"
                                    width="100%"
                                    language="yaml"
                                    theme="vs-dark"
                                    value={editorContent}
                                    onChange={handleEditorChange}
                                    options={{
                                        minimap: { enabled: true },
                                        scrollBeyondLastLine: false,
                                        fontSize: 14,
                                        wordWrap: 'on'
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-lg shadow p-8 flex flex-col items-center justify-center h-[600px] border border-gray-700">
                            <p className="text-gray-400 mb-4">Select a playbook to edit or create a new one</p>
                            <button 
                                onClick={() => {
                                    searchParams?.set('new', 'true');
                                    router.push(pathname as string + '?' + searchParams?.toString());
                                    setShowModal(true);
                                    setNewPlaybookName('');
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Create New Playbook
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Playbook Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
                        <h2 className="text-xl font-semibold mb-4 text-white">Create New Playbook</h2>
                        
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">Playbook Name</label>
                            <input 
                                type="text" 
                                value={newPlaybookName}
                                onChange={(e) => setNewPlaybookName(e.target.value)}
                                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter playbook name"
                            />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => {
                                    searchParams?.delete('new');
                                    router.push(pathname as string + '?' + searchParams?.toString());
                                    setShowModal(false);
                                    setNewPlaybookName('');
                                }}
                                className="px-4 py-2 border border-gray-600 rounded bg-gray-700 text-white hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={async () => {
                                    const flag = await handleCreatePlaybook();
                                    if(flag?.success)
                                        setTimeout(() => {
                                            searchParams?.delete('new');
                                            router.push(pathname as string + '?' + searchParams?.toString());
                                            setShowModal(false);
                                        }, 300);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}