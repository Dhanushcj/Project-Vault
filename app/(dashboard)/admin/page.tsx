'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { 
  ShieldAlert, 
  RotateCcw, 
  Trash2, 
  AlertTriangle,
  FolderOpen,
  Users,
  Calendar,
  Info
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Project {
  _id: string;
  name: string;
  description: string;
  deletedAt: string;
  deletedBy?: { name: string };
  status: string;
  createdAt: string;
}

import Link from 'next/link';

export default function AdminDashboard() {
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    deleted: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch all projects including deleted ones
      const response = await api.get('/projects?includeDeleted=true&limit=100');
      const allProjects = response.data.projects;
      
      const deleted = allProjects.filter((p: any) => p.isDeleted);
      const active = allProjects.filter((p: any) => !p.isDeleted);
      
      setDeletedProjects(deleted);
      setActiveProjects(active);
      setStats({
        active: active.length,
        deleted: deleted.length
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.post(`/projects/${id}/restore`);
      toast.success('Project restored successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to restore project');
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${name}"? This action cannot be undone.`)) return;

    try {
      await api.delete(`/projects/${id}/permanent`);
      toast.success('Project permanently deleted');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to permanently delete project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-blue-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center space-x-4">
          <ShieldAlert className="h-12 w-12" />
          <div>
            <h1 className="text-3xl font-bold">Admin Console</h1>
            <p className="text-blue-100 mt-2">
              Oversee all projects, manage system-wide data, and restore soft-deleted items.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="text-3xl font-bold text-foreground mt-1">{stats.active}</p>
            </div>
            <FolderOpen className="h-10 w-10 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="bg-card rounded-lg shadow border border-border p-6 underline-offset-4 decoration-red-500 underline decoration-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Deleted Projects (In Trash)</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.deleted}</p>
            </div>
            <Trash2 className="h-10 w-10 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Projects List Tabs */}
      <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center ${
              activeTab === 'active' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Active Projects ({stats.active})
          </button>
          <button
            onClick={() => setActiveTab('deleted')}
            className={`flex-1 py-4 text-sm font-semibold transition-colors flex items-center justify-center ${
              activeTab === 'deleted' 
                ? 'bg-red-50 text-red-600 border-b-2 border-red-600' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Trash Bin ({stats.deleted})
          </button>
        </div>

        <div className="p-6 border-b border-border bg-muted/50">
          <h2 className="text-xl font-semibold flex items-center">
            {activeTab === 'active' ? (
              <><FolderOpen className="h-6 w-6 mr-2 text-blue-500" /> Active System Projects</>
            ) : (
              <><Trash2 className="h-6 w-6 mr-2 text-red-500" /> Project Trash Bin</>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {activeTab === 'active' 
              ? "View and manage all projects currently uploaded by employees."
              : "Projects listed here were deleted by employees but remain in the database for your review."
            }
          </p>
        </div>

        <div className="divide-y divide-border">
          {activeTab === 'active' && (
            activeProjects.length === 0 ? (
              <div className="p-12 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground italic">No active projects found</p>
              </div>
            ) : (
              activeProjects.map((project) => (
                <div key={project._id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{project.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Created: {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          Status: <span className={`ml-1 px-1.5 py-0.5 rounded text-white capitalize ${
                            project.status === 'active' ? 'bg-green-500' : 'bg-blue-500'
                          }`}>{project.status}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Link href={`/projects/${project._id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'deleted' && (
            deletedProjects.length === 0 ? (
              <div className="p-12 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground italic">Trash bin is empty</p>
              </div>
            ) : (
              deletedProjects.map((project) => (
                <div key={project._id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{project.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Deleted: {new Date(project.deletedAt).toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          Status was: <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-700 capitalize">{project.status}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => handleRestore(project._id)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handlePermanentDelete(project._id, project.name)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Wipe
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-bold">Security Notice</p>
          <p>
            Deleting a project "soft-removes" it from all standard dashboards and search results. 
            Restoring it will instantly make it visible again to assigned team members. 
            "Wipe" permanently deletes all associated data including credentials and video links.
          </p>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
}
