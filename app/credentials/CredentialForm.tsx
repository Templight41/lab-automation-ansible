"use client"

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaSave, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';

interface CredentialFormProps {
  initialCredential?: Credential;
  isEdit?: boolean;
}

interface Credential {
  id: string;
  lab: string;
  username: string;
  password?: string;
}

export default function CredentialForm({ initialCredential, isEdit = false }: CredentialFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [credential, setCredential] = useState<Partial<Credential>>({
    id: '',
    lab: '',
    username: '',
    password: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (initialCredential) {
      setCredential(initialCredential);
    } else if (isEdit && searchParams && searchParams.get('id')) {
      // Fetch credential data if in edit mode
      const fetchCredential = async () => {
        const credentialId = searchParams.get('id');
        if (!credentialId) return;
        
        try {
          // Get all credentials and find the one with matching ID
          const response = await fetch('/api/credentials');
          if (!response.ok) {
            throw new Error('Failed to fetch credential');
          }
          const data = await response.json();
          const foundCredential = data.find((c: Credential) => c.id === credentialId);
          
          if (foundCredential) {
            setCredential(foundCredential);
          } else {
            throw new Error('Credential not found');
          }
        } catch (err) {
          console.error('Error fetching credential:', err);
          setError('Failed to load credential data. Please try again.');
        }
      };
      
      fetchCredential();
    }
  }, [initialCredential, isEdit, searchParams]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredential(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const method = isEdit ? 'PATCH' : 'POST';
      
      const response = await fetch('/api/credentials', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credential),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save credential');
      }
      
      // Redirect back to credentials page
      router.push('/credentials');
      router.refresh();
    } catch (err: any) {
      console.error('Error saving credential:', err);
      setError(err.message || 'Failed to save credential. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {isEdit ? 'Edit Credential' : 'Add New Credential'}
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
              value={credential.lab}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              placeholder="e.g., Web Server Lab"
              required
              disabled={isEdit} // Lab name can't be changed when editing
            />
            <p className="text-gray-400 text-sm mt-1">
              This should match the lab name of the system you're creating credentials for
            </p>
          </div>
          
          <div>
            <label htmlFor="username" className="block text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credential.username}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
              placeholder="e.g., admin"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={credential.password || ''}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white pr-10"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
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
              <FaSave className="mr-2" /> {loading ? 'Saving...' : 'Save Credential'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
