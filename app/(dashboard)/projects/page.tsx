'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { canAccess } from '@/lib/auth';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  GitBranch,
  Globe,
  Shield,
  Video
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Project {
  _id: string;
  name: string;
  description: string;
  techStack: string[];
  status: 'active' | 'completed' | 'maintenance';
  assignedTeam: { name: string; role?: string }[];
  githubUrl?: string;
  liveUrl?: string;
  stagingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');

  const user = canAccess('developer'); // Can edit if developer or admin

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, techFilter]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        (project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Tech stack filter
    if (techFilter !== 'all') {
      filtered = filtered.filter(project =>
        project.techStack?.some(tech => tech.toLowerCase().includes(techFilter.toLowerCase())) ?? false
      );
    }

    setFilteredProjects(filtered);
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p._id !== id));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Project Vaults</h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl">Each project stores credentials, working videos, and deployment links in one place.</p>
        </div>
        {user && (
          <Link href="/projects/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            aria-label="Filter projects by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <Input
            placeholder="Tech stack..."
            value={techFilter === 'all' ? '' : techFilter}
            onChange={(e) => setTechFilter(e.target.value || 'all')}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTechFilter('all');
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-1" />
                {project.assignedTeam?.length || 0} team members
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                >
                  <GitBranch className="h-3 w-3" />
                  Git
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
                >
                  <Globe className="h-3 w-3" />
                  Live
                </a>
              )}
              {project.stagingUrl && (
                <a
                  href={project.stagingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-700 hover:bg-amber-200"
                >
                  <Globe className="h-3 w-3" />
                  Staging
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {(project.techStack || []).slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                >
                  {tech}
                </span>
              ))}
              {(project.techStack?.length ?? 0) > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                  +{(project.techStack?.length ?? 0) - 3} more
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/projects/${project._id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </Link>
              <Link href={`/projects/${project._id}/credentials`}>
                <Button variant="outline" size="sm">
                  <Shield className="h-4 w-4 mr-1" />
                  Credentials
                </Button>
              </Link>
              <Link href={`/projects/${project._id}/videos`}>
                <Button variant="outline" size="sm">
                  <Video className="h-4 w-4 mr-1" />
                  Videos
                </Button>
              </Link>
              {user && (
                <>
                  <Link href={`/projects/${project._id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteProject(project._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No projects found</p>
          {user && (
            <Link href="/projects/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            </Link>
          )}
        </div>
      )}

      <Toaster />
    </div>
  );
}