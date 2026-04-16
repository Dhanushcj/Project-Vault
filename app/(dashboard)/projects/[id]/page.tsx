'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { canAccess } from '@/lib/auth';
import {
  Edit,
  Trash2,
  ExternalLink,
  Users,
  Calendar,
  GitBranch,
  Globe,
  Server,
  FileText,
  Video,
  Settings
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
  apiEndpoints: string[];
  createdBy?: { name: string };
  createdAt: string;
  updatedAt: string;
}
interface ProjectActivity {
  entityType: string;
  entityId?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboardingChecklist, setShowOnboardingChecklist] = useState(false);
  const [documentCount, setDocumentCount] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [credentialCount, setCredentialCount] = useState<number>(0);
  const [activityCount, setActivityCount] = useState<number>(0);

  const canEdit = canAccess('developer');

  useEffect(() => {
    if (params.id) {
      fetchProject();
      fetchRelatedCounts();
    }
  }, [params.id]);

  useEffect(() => {
    if (searchParams.get('onboarding') === '1') {
      setShowOnboardingChecklist(true);
    }
  }, [searchParams]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${params.id}`);
      setProject(response.data);
    } catch {
      toast.error('Failed to load project');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedCounts = async () => {
    if (!params.id) return;

    try {
      const [documents, videos, credentials, activities] = await Promise.all([
        api.get('/documents', { params: { projectId: params.id } }),
        api.get('/videos', { params: { projectId: params.id } }),
        api.get('/credentials', { params: { projectId: params.id } }),
        api.get('/activity'),
      ]);

      setDocumentCount(documents.data?.length ?? 0);
      setVideoCount(videos.data?.length ?? 0);
      setCredentialCount(credentials.data?.length ?? 0);
      const projectActivities = (activities.data as ProjectActivity[] | undefined) ?? [];
      setActivityCount(projectActivities.filter(
        (item) => item.entityType === 'project' && item.entityId === params.id
      ).length);
    } catch (error) {
      console.error('Error fetching related counts:', error);
    }
  };

  const deleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/projects/${params.id}`);
      toast.success('Project deleted successfully');
      router.push('/projects');
    } catch {
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

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Project not found</p>
        <Link href="/projects">
          <Button className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const setupChecklist = [
    {
      label: 'Git repository link added',
      completed: Boolean(project.githubUrl),
      actionHref: `/projects/${project._id}/edit`,
      actionLabel: 'Update links',
    },
    {
      label: 'Deployed link (live or staging) added',
      completed: Boolean(project.liveUrl || project.stagingUrl),
      actionHref: `/projects/${project._id}/edit`,
      actionLabel: 'Add deploy URL',
    },
    {
      label: 'Project credentials saved',
      completed: false,
      actionHref: `/projects/${project._id}/credentials`,
      actionLabel: 'Add credentials',
    },
    {
      label: 'Working video attached',
      completed: false,
      actionHref: `/projects/${project._id}/videos`,
      actionLabel: 'Add video',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex space-x-2">
              <Link href={`/projects/${project._id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={deleteProject}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {showOnboardingChecklist && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg shadow p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-900">New Vault Setup Checklist</h2>
              <p className="text-sm text-blue-800 mt-1">
                Complete these steps so anyone in your team can quickly access credentials, video, and deployment details.
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowOnboardingChecklist(false)}>
              Dismiss
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {setupChecklist.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md bg-white px-3 py-2 border border-blue-100"
              >
                <p className="text-sm text-gray-800">
                  {item.completed ? 'Done:' : 'Pending:'} {item.label}
                </p>
                <Link href={item.actionHref}>
                  <Button size="sm" variant={item.completed ? 'outline' : 'primary'}>
                    {item.actionLabel}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Overview</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Vault Folder Contents</h2>
        <ul className="list-disc pl-5 text-gray-700 space-y-2">
          <li>Login credentials and secure access details for this project.</li>
          <li>Working video walkthroughs for demos, onboarding, and support.</li>
          <li>Git repository link and deployed links for live and staging environments.</li>
        </ul>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {(project.techStack || []).map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {tech}
            </span>
          ))}
          {(!project.techStack || project.techStack.length === 0) && (
            <p className="text-gray-500 text-sm italic">No tech stack specified</p>
          )}
        </div>
      </div>

      {/* Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <GitBranch className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">GitHub</p>
                <p className="text-sm text-gray-600">View source code</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </a>
          )}

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Globe className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Live Site</p>
                <p className="text-sm text-gray-600">View production</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </a>
          )}

          {project.stagingUrl && (
            <a
              href={project.stagingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Server className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Staging</p>
                <p className="text-sm text-gray-600">View staging environment</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </a>
          )}
        </div>
      </div>

      {/* API Endpoints */}
      {project.apiEndpoints && project.apiEndpoints.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Endpoints</h2>
          <div className="space-y-2">
            {(project.apiEndpoints || []).map((endpoint, index) => (
              <a
                key={index}
                href={endpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Globe className="h-4 w-4 text-gray-600 mr-3" />
                <span className="text-gray-900">{endpoint}</span>
                <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Team */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Team</h2>
        <div className="flex items-center text-gray-600">
          <Users className="h-5 w-5 mr-2" />
          <span>{(project.assignedTeam?.length) || 0} team members assigned</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Folder Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Credentials</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{credentialCount}</p>
            <p className="text-sm text-gray-600">Saved for this project</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Videos</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{videoCount}</p>
            <p className="text-sm text-gray-600">Uploaded for this project</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Documents</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{documentCount}</p>
            <p className="text-sm text-gray-600">Stored in project folder</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Project Updates</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{activityCount}</p>
            <p className="text-sm text-gray-600">Project-level activity logs</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage This Vault</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href={`/projects/${project._id}/videos`}>
            <Button variant="outline" className="w-full">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </Button>
          </Link>
          <Link href={`/projects/${project._id}/documents`}>
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </Button>
          </Link>
          <Link href={`/projects/${project._id}/credentials`}>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Credentials
            </Button>
          </Link>
          <Link href={`/projects/${project._id}/activity`}>
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Activity
            </Button>
          </Link>
        </div>
      </div>

      <Toaster />
    </div>
  );
}