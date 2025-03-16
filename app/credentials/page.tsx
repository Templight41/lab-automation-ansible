"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaKey, FaPlus, FaEdit, FaTrash, FaSync, FaArrowLeft } from 'react-icons/fa';
import CredentialForm from './CredentialForm';

interface Credential {
  id: string;
  lab: string;
  username: string;
  password?: string;
}

// Component that uses useSearchParams should be separate and wrapped with Suspense
function CredentialsContent() {
  const searchParams = useSearchParams();
  const isNewForm = searchParams?.get('new') === 'true';
  const isEditForm = searchParams?.has('id');
  
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/credentials');
      if (!response.ok) {
        throw new Error('Failed to fetch credentials');
      }
      const data = await response.json();
      setCredentials(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching credentials:', err);
      setError('Failed to load credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNewForm) {
      fetchCredentials();
    }
  }, [isNewForm]);

  const handleDelete = async (lab: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/credentials', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lab }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete credential');
      }
      
      // Refresh credentials list
      fetchCredentials();
    } catch (err) {
      console.error('Error deleting credential:', err);
      setError('Failed to delete credential. Please try again.');
    }
  };

  // If we're in form mode, show the form
  if (isNewForm || isEditForm) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link 
            href="/credentials"
            className="text-blue-400 hover:text-blue-300 flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back to Credentials
          </Link>
        </div>
        
        <CredentialForm isEdit={isEditForm} />
      </div>
    );
  }

  // Otherwise show the credentials list
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Credentials</h1>
        <div className="flex space-x-4">
          <button 
            onClick={fetchCredentials}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            <FaSync className="mr-2" /> Refresh
          </button>
          <Link 
            href="/credentials?new=true"
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
          >
            <FaPlus className="mr-2" /> Add Credential
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
        <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
          <div className="bg-gray-700 p-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FaKey className="mr-2 text-yellow-500" /> Credentials
            </h2>
          </div>
          
          <div className="p-4">
            {credentials.length === 0 ? (
              <div className="bg-gray-750 rounded p-6 text-center">
                <p className="text-gray-400 mb-4">No credentials found</p>
                <Link 
                  href="/credentials?new=true"
                  className="bg-green-600 text-white px-4 py-2 rounded inline-flex items-center"
                >
                  <FaPlus className="mr-2" /> Add Your First Credential
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {credentials.map(credential => (
                  <div 
                    key={credential.id}
                    className="bg-gray-750 rounded border border-gray-700 p-4"
                  >
                    <h3 className="font-medium text-white text-lg mb-2">{credential.lab}</h3>
                    
                    <div className="text-gray-400 mb-4">
                      <p>Username: {credential.username}</p>
                      <p>Password: {credential.password ? '••••••••' : 'Not set'}</p>
                    </div>
                    
                    <div className="flex justify-between">
                      <Link 
                        href={`/credentials?id=${credential.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm inline-flex items-center"
                      >
                        <FaEdit className="mr-1" /> Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(credential.lab)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm inline-flex items-center"
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Main component that uses Suspense
export default function CredentialsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CredentialsContent />
    </Suspense>
  );
}
