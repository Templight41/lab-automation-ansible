"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaServer, FaPlus, FaEdit, FaTrash, FaSync, FaArrowLeft } from 'react-icons/fa';
import { System } from '@/lib/db/schema/system';
import SystemForm from './SystemForm';

interface SystemUI extends System {
  status?: 'online' | 'offline';
}

// Component that uses useSearchParams should be separate and wrapped with Suspense
function SystemsContent() {
  const searchParams = useSearchParams();
  const isNewForm = searchParams?.get('new') === 'true';
  const isEditForm = searchParams?.has('id');
  
  const [systems, setSystems] = useState<SystemUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [labGroups, setLabGroups] = useState<Record<string, SystemUI[]>>({});

  const fetchSystems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/systems');
      if (!response.ok) {
        throw new Error('Failed to fetch systems');
      }
      const data = await response.json();
      setSystems(data);
      
      // Group systems by lab type
      const groups: Record<string, SystemUI[]> = {};
      data.forEach((system: SystemUI) => {
        const labType = system.lab.split(' ')[0]; // Use first word as lab type
        if (!groups[labType]) {
          groups[labType] = [];
        }
        groups[labType].push(system);
      });
      setLabGroups(groups);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching systems:', err);
      setError('Failed to load systems. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNewForm) {
      fetchSystems();
    }
  }, [isNewForm]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this system?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/systems', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete system');
      }
      
      // Refresh systems list
      fetchSystems();
    } catch (err) {
      console.error('Error deleting system:', err);
      setError('Failed to delete system. Please try again.');
    }
  };

  const checkStatus = async (system: SystemUI) => {
    // In a real application, this would ping the system or check its status
    // For demo purposes, we'll just toggle the status
    const updatedSystems = systems.map(s => 
      s.id === system.id 
        ? { ...s, status: s.status === 'online' ? 'offline' as const : 'online' as const } 
        : s
    );
    setSystems(updatedSystems);
    
    // Update lab groups
    const updatedGroups: Record<string, SystemUI[]> = {};
    Object.keys(labGroups).forEach(labType => {
      updatedGroups[labType] = labGroups[labType].map(s => 
        s.id === system.id 
          ? { ...s, status: s.status === 'online' ? 'offline' as const : 'online' as const } 
          : s
      );
    });
    setLabGroups(updatedGroups);
  };

  // If we're in form mode, show the form
  if (isNewForm || isEditForm) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link 
            href="/systems"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back to Systems
          </Link>
        </div>
        
        <SystemForm isEdit={isEditForm} />
      </div>
    );
  }

  // Otherwise show the systems list
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Lab Systems</h1>
        <div className="flex space-x-4">
          <button 
            onClick={fetchSystems}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            <FaSync className="mr-2" /> Refresh
          </button>
          <Link 
            href="/systems?new=true"
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
          >
            <FaPlus className="mr-2" /> Add System
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500 text-white p-4 rounded mb-6">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(labGroups).length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-4">No systems found</p>
              <Link 
                href="/systems?new=true"
                className="bg-green-600 text-white px-4 py-2 rounded inline-flex items-center"
              >
                <FaPlus className="mr-2" /> Add Your First System
              </Link>
            </div>
          ) : (
            Object.entries(labGroups).map(([labType, labSystems]) => (
              <div key={labType} className="bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
                <div className="bg-gray-700 p-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <FaServer className="mr-2 text-green-500" /> {labType} Systems
                  </h2>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {labSystems.map(system => (
                      <div 
                        key={system.id}
                        className="bg-gray-750 rounded border border-gray-700 p-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-white text-lg">{system.lab}</h3>
                          <div className="flex items-center">
                            <div 
                              className={`w-3 h-3 rounded-full mr-2 ${system.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}
                            ></div>
                            <span className="text-sm text-gray-400">
                              {system.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-gray-400 mb-4">
                          <p>Address: {system.address}</p>
                        </div>
                        
                        <div className="flex justify-between">
                          <div className="space-x-2">
                            <Link 
                              href={`/systems?id=${system.id}`}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm inline-flex items-center"
                            >
                              <FaEdit className="mr-1" /> Edit
                            </Link>
                            <button 
                              onClick={() => handleDelete(system.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm inline-flex items-center"
                            >
                              <FaTrash className="mr-1" /> Delete
                            </button>
                          </div>
                          <button 
                            onClick={() => checkStatus(system)}
                            className="bg-purple-600 text-white px-3 py-1 rounded text-sm inline-flex items-center"
                          >
                            <FaSync className="mr-1" /> Check
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Main component that uses Suspense
export default function SystemsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <SystemsContent />
    </Suspense>
  );
}