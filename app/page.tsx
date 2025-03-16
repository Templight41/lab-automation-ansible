"use client"

import { System } from "@/lib/db/schema/system";
import { Credential } from "@/lib/db/schema/credential";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FaPlay, FaServer, FaKey, FaPlus } from "react-icons/fa";

// Mock data for demonstration
const mockPlaybooks = [
  { id: '1', name: 'Setup Web Server', createdAt: '2023-05-15T10:30:00Z' },
  { id: '2', name: 'Configure Database', createdAt: '2023-05-20T14:45:00Z' },
  { id: '3', name: 'Deploy Application', createdAt: '2023-06-01T09:15:00Z' },
];

const mockSystems = [
  { id: '1', lab: 'Web Server', address: '192.168.1.10', status: 'online' },
  { id: '2', lab: 'Database Server', address: '192.168.1.11', status: 'online' },
  { id: '3', lab: 'Load Balancer', address: '192.168.1.12', status: 'offline' },
];

const mockCredentials = [
  { id: '1', name: 'Web Server Credentials', username: 'webadmin' },
  { id: '2', name: 'Database Credentials', username: 'dbadmin' },
  { id: '3', name: 'Admin Credentials', username: 'sysadmin' },
];

// Frontend types
interface PlaybookUI {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

interface SystemUI extends System {
  status?: 'online' | 'offline';
}

export default function Home() {

  const [playbooks, setPlaybooks] = useState<PlaybookUI[]>([]);
  const [systems, setSystems] = useState<SystemUI[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  const getPlaybooks = async () => {
    const fetchPlaybooks = async () => {
      try {
        const response = await fetch('/api/playbooks');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        const formattedData = data.map((playbook: any) => ({
          ...playbook,
          createdAt: new Date(playbook.createdAt).toLocaleDateString()
        }));
        setPlaybooks(formattedData);
        clearInterval(playbookInterval); // Clear interval on success
      } catch (error) {
        console.error('Error fetching playbooks:', error);
      }
    };

    fetchPlaybooks(); // Initial fetch
    const playbookInterval = setInterval(fetchPlaybooks, 5000); // Retry every 5 seconds
  }

  const getSystems = async () => {
    const fetchSystems = async () => {
      try {
        const response = await fetch('/api/systems');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setSystems(data);
        clearInterval(systemInterval); // Clear interval on success
      } catch (error) {
        console.error('Error fetching systems:', error);
      }
    };

    fetchSystems(); // Initial fetch
    const systemInterval = setInterval(fetchSystems, 5000); // Retry every 5 seconds
  }

  const getCredentials = async () => {
    const fetchCredentials = async () => {
      try {
        const response = await fetch('/api/credentials');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setCredentials(data);
        clearInterval(credentialInterval); // Clear interval on success
      } catch (error) {
        console.error('Error fetching credentials:', error);
      }
    };

    fetchCredentials(); // Initial fetch
    const credentialInterval = setInterval(fetchCredentials, 5000); // Retry every 5 seconds
  }
  
  

  useEffect(() => {
    
    getPlaybooks();
    getSystems();
    getCredentials();
  }, []);
  

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-white mb-8">Lab Automation Dashboard</h1>
      
      <div className="flex flex-wrap gap-8 justify-around">
        {/* Playbooks Section */}
        <div className="flex-1 min-w-[300px] bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
          <div className="bg-gray-700 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FaPlay className="mr-2 text-blue-500" /> Ansible Playbooks
            </h2>
            <Link 
              href="/playbooks" 
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              View All
            </Link>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {playbooks?.slice(0, 3).map(playbook => (
                <Link 
                  key={playbook?.id}
                  href={`/playbooks?id=${playbook?.id}`}
                  className="p-3 rounded border border-gray-700 hover:bg-gray-700 transition-colors flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-white">{playbook?.name}</div>
                    <div className="text-xs text-gray-400">
                      {playbook?.createdAt}
                    </div>
                  </div>
                  <button className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700">
                    <FaPlay size={12} />
                  </button>
                </Link>
              ))}
              
              <Link 
                href="/playbooks?new=true" 
                className="p-3 rounded border border-dashed border-gray-600 hover:border-blue-500 hover:bg-gray-700/50 transition-colors flex items-center justify-center text-gray-400 hover:text-blue-400"
              >
                <FaPlus className="mr-2" /> Create New Playbook
              </Link>
            </div>
          </div>
        </div>
        
        {/* Systems Section */}
        {/* <div className="flex-1 min-w-[300px] bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
          <div className="bg-gray-700 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FaServer className="mr-2 text-green-500" /> Systems
            </h2>
            <Link 
              href="/systems" 
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              View All
            </Link>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {systems?.slice(0, 3).map(system => (
                <Link 
                  key={system.id}
                  href={`/systems?id=${system.id}`}
                  className="p-3 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-white">{system.lab}</div>
                    <div className={`w-2 h-2 rounded-full ${system.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{system.address}</div>
                </Link>
              ))}
              
              <Link 
                href="/systems?new=true" 
                className="p-3 rounded border border-dashed border-gray-600 hover:border-green-500 hover:bg-gray-700/50 transition-colors flex items-center justify-center text-gray-400 hover:text-green-400"
              >
                <FaPlus className="mr-2" /> Add New System
              </Link>
            </div>
          </div>
        </div> */}
        
        {/* Credentials Section */}
        <div className="flex-1 min-w-[300px] bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
          <div className="bg-gray-700 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FaKey className="mr-2 text-yellow-500" /> Credentials
            </h2>
            <Link 
              href="/credentials" 
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              View All
            </Link>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3">
              {credentials?.slice(0, 3).map(credential => (
                <Link 
                  key={credential.id}
                  href={`/credentials?id=${credential.id}`}
                  className="p-3 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-white">{credential.lab}</div>
                  <div className="text-xs text-gray-400 mt-1">Username: {credential.username}</div>
                </Link>
              ))}
              
              <Link 
                href="/credentials?new=true" 
                className="p-3 rounded border border-dashed border-gray-600 hover:border-yellow-500 hover:bg-gray-700/50 transition-colors flex items-center justify-center text-gray-400 hover:text-yellow-400"
              >
                <FaPlus className="mr-2" /> Add New Credential
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 bg-gray-800 rounded-lg shadow-md border border-gray-700 p-4">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
          <Link 
            href="/playbooks?new=true"
            className="bg-blue-600 text-white p-4 rounded hover:bg-blue-700 flex items-center justify-center"
          >
            <FaPlus className="mr-2" /> Create Playbook
          </Link>
          {/* <Link 
            href="/systems?new=true"
            className="bg-green-600 text-white p-4 rounded hover:bg-green-700 flex items-center justify-center"
          >
            <FaPlus className="mr-2" /> Add System
          </Link> */}
          <Link 
            href="/credentials?new=true"
            className="bg-yellow-600 text-white p-4 rounded hover:bg-yellow-700 flex items-center justify-center"
          >
            <FaPlus className="mr-2" /> Add Credential
          </Link>
        </div>
      </div>
    </div>
  );
}
