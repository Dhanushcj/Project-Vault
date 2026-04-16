'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { canAccess } from '@/lib/auth';
import {
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  Shield,
  Key,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Credential {
  _id: string;
  projectId?: string;
  name: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

export default function ProjectCredentialsPage() {
  const params = useParams();
  const projectId = params.id;
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [loadingPasswordIds, setLoadingPasswordIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });

  const canManage = canAccess('viewer');

  useEffect(() => {
    if (projectId) {
      fetchCredentials();
    }
  }, [projectId]);

  const fetchCredentials = async () => {
    try {
      const response = await api.get('/credentials', { params: { projectId } });
      setCredentials(response.data);
    } catch {
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    try {
      if (editingCredential) {
        await api.put(`/credentials/${editingCredential._id}`, {
          projectId,
          ...formData,
        });
        toast.success('Credential updated successfully');
      } else {
        await api.post('/credentials', {
          projectId,
          ...formData,
        });
        toast.success('Credential created successfully');
      }

      setShowForm(false);
      setEditingCredential(null);
      setFormData({ name: '', username: '', password: '', url: '', notes: '' });
      fetchCredentials();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to save credential');
    }
  };

  const deleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    try {
      await api.delete(`/credentials/${id}`);
      setCredentials(credentials.filter((c) => c._id !== id));
      toast.success('Credential deleted successfully');
    } catch {
      toast.error('Failed to delete credential');
    }
  };

  const togglePasswordVisibility = async (id: string) => {
    if (visiblePasswords.has(id)) {
      setVisiblePasswords((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      return;
    }

    if (!revealedPasswords[id]) {
      setLoadingPasswordIds((prev) => new Set(prev).add(id));
      try {
        const response = await api.get(`/credentials/${id}/unmask`);
        setRevealedPasswords((prev) => ({
          ...prev,
          [id]: response.data.password,
        }));
      } catch (error) {
        toast.error('Failed to reveal password');
        setLoadingPasswordIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        return;
      } finally {
        setLoadingPasswordIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    }

    setVisiblePasswords((prev) => new Set(prev).add(id));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const maskPassword = (password: string) => {
    return '•'.repeat(Math.min(password.length, 12));
  };

  const startEdit = (credential: Credential) => {
    setEditingCredential(credential);
    setFormData({
      name: credential.name,
      username: credential.username || '',
      password: '',
      url: credential.url || '',
      notes: credential.notes || '',
    });
    setShowForm(true);
  };

  if (!projectId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Project not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credentials for Project</h1>
          <p className="text-gray-600">Securely manage credentials linked to this project.</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingCredential ? 'Edit Credential' : 'Add New Credential'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Credential name (e.g., Database, API Key)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                placeholder="Username (optional)"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <Input
              type="password"
              placeholder="Password or API Key"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingCredential}
            />

            <Input
              placeholder="URL or Service (optional)"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />

            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="flex min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="flex space-x-4">
              <Button type="submit">
                {editingCredential ? 'Update' : 'Save'} Credential
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingCredential(null);
                  setFormData({ name: '', username: '', password: '', url: '', notes: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map((credential) => (
          <div key={credential._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900">{credential.name}</h3>
              </div>
              {canManage && (
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(credential)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCredential(credential._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {credential.username && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Username:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {credential.username}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credential.username!)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Password:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {visiblePasswords.has(credential._id)
                      ? (loadingPasswordIds.has(credential._id) ? 'Loading...' : (revealedPasswords[credential._id] || '***'))
                      : maskPassword(credential.password)}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => togglePasswordVisibility(credential._id)}>
                    {visiblePasswords.has(credential._id) ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credential.password)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {credential.url && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">URL:</span>
                  <a
                    href={credential.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {credential.url}
                  </a>
                </div>
              )}

              {credential.notes && (
                <div>
                  <span className="text-sm text-gray-600">Notes:</span>
                  <p className="text-sm text-gray-800 mt-1">{credential.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Created {new Date(credential.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {credentials.length === 0 && (
        <div className="text-center py-12">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No credentials stored for this project yet.</p>
          {canManage && (
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add credential
            </Button>
          )}
        </div>
      )}

      <Toaster />
    </div>
  );
}
