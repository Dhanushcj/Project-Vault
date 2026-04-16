'use client';

import { useEffect, useState } from 'react';
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
  Search
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Credential {
  _id: string;
  projectId?: {
    _id: string;
    name: string;
  };
  name: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  createdAt: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [loadingPasswordIds, setLoadingPasswordIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCredentials, setFilteredCredentials] = useState<Credential[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });

  const canManage = canAccess('viewer');

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await api.get('/credentials');
      setCredentials(response.data);
      setFilteredCredentials(response.data);
    } catch {
      toast.error('Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredCredentials(credentials);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = credentials.filter(c => 
      c.name?.toLowerCase().includes(term) ||
      c.username?.toLowerCase().includes(term) ||
      c.projectId?.name?.toLowerCase().includes(term)
    );
    setFilteredCredentials(filtered);
  }, [searchTerm, credentials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCredential) {
        await api.put(`/credentials/${editingCredential._id}`, formData);
        toast.success('Credential updated successfully');
      } else {
        await api.post('/credentials', formData);
        toast.success('Credential created successfully');
      }

      setShowForm(false);
      setEditingCredential(null);
      setFormData({ name: '', username: '', password: '', url: '', notes: '' });
      fetchCredentials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save credential');
    }
  };

  const deleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    try {
      await api.delete(`/credentials/${id}`);
      setCredentials(credentials.filter(c => c._id !== id));
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
      } catch {
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
      password: credential.password,
      url: credential.url || '',
      notes: credential.notes || '',
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credentials Vault</h1>
          <p className="text-muted-foreground">Securely store and manage your project credentials</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-card rounded-lg shadow p-4 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search credentials by name, username, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">
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
              required
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
              className="flex min-h-20 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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

      {/* Credentials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCredentials.map((credential) => (
          <div key={credential._id} className="bg-card rounded-lg shadow-md p-6 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h3 className="font-semibold text-foreground">{credential.name}</h3>
                  {credential.projectId && (
                    <p className="text-xs text-blue-600 font-medium">{credential.projectId.name}</p>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(credential)}
                  >
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
                  <span className="text-sm text-muted-foreground">Username:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground">
                      {credential.username}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(credential.username!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Password:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground">
                    {visiblePasswords.has(credential._id)
                      ? (loadingPasswordIds.has(credential._id) ? 'Loading...' : (revealedPasswords[credential._id] || '***'))
                      : maskPassword(credential.password)
                    }
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePasswordVisibility(credential._id)}
                  >
                    {visiblePasswords.has(credential._id) ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(credential.password)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {credential.url && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">URL:</span>
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
                  <span className="text-sm text-muted-foreground">Notes:</span>
                  <p className="text-sm text-foreground mt-1">{credential.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Created {new Date(credential.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {credentials.length === 0 && (
        <div className="text-center py-12">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No credentials stored yet</p>
          {canManage && (
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first credential
            </Button>
          )}
        </div>
      )}

      <Toaster />
    </div>
  );
}