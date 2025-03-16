"use client"

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSave, FaTimes } from 'react-icons/fa';
import { System } from '@/lib/db/schema/system';

interface SystemFormProps {
  initialSystem?: System;
  isEdit?: boolean;
}

export default function SystemForm({ initialSystem, isEdit = false }: SystemFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [system, setSystem] = useState<Partial<System>>({
    id: '',
    lab: '',
    address: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (initialSystem) {
      setSystem(initialSystem);
    } else if (isEdit && searchParams && searchParams.get('id')) {
      // Fetch system data if in edit mode
      const fetchSystem = async () => {
        const systemId = searchParams.get('id');
        if (!systemId) return;
        
        try {
          const response = await fetch(`/api/systems/${systemId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch system');
          }
          const data = await response.json();
          setSystem(data);
        } catch (err) {
          console.error('Error fetching system:', err);
          setError('Failed to load system data. Please try again.');
        }
      };
      
      fetchSystem();
    }
  }, [initialSystem, isEdit, searchParams]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSystem(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const url = isEdit ? '/api/systems' : '/api/systems/new';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(system),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save system');
      }
      
      // Redirect back to systems page
      router.push('/systems');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving system:', err);
      setError(err.message || 'Failed to save system. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {isEdit ? 'Edit System' : 'Add New System'}
      </h2>
      
      {error && (
        <div className="bg-red-500 text-white p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="lab" className="block text-gray-300 mb-2">
              Lab Name
            </label>
            <input
              type="text"
              id="lab"
              name="lab"
              value={system.lab}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              placeholder="e.g., Web Server Lab"
              required
            />
            <p className="text-gray-400 text-sm mt-1">
              Use a descriptive name like "Web Server" or "Database Server"
            </p>
          </div>
          
          <div>
            <label htmlFor="address" className="block text-gray-300 mb-2">
              IP Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={system.address}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              placeholder="e.g., 192.168.1.10"
              required
              pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
            />
            <p className="text-gray-400 text-sm mt-1">
              Enter the IP address in the format: xxx.xxx.xxx.xxx
            </p>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded flex items-center"
            >
              <FaTimes className="mr-2" /> Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
            >
              <FaSave className="mr-2" /> {loading ? 'Saving...' : 'Save System'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 