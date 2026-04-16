'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getCurrentUser } from '@/lib/auth';
import api from '@/lib/api';
import {
  FolderOpen,
  Users,
  FileText,
  Video,
  Activity,
  Plus,
  Eye,
  Settings
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  status: string;
  techStack: string[];
  assignedTeam: any[];
}

interface ActivityLog {
  _id: string;
  action: string;
  entityType: string;
  entityName: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    totalDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, activityRes, statsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/activity?limit=5'),
        api.get('/projects/stats'),
      ]);

      setProjects(projectsRes.data.projects);
      setRecentActivity(activityRes.data.logs);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
      {/* Welcome Header */}
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome to your Project Vault, {user?.name}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Keep each company project in one folder with credentials, working videos, and Git/deployed links.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center">
            <FolderOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
              <p className="text-xs text-muted-foreground/70">Vault folders</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="text-xs text-muted-foreground/70">In progress now</p>
              <p className="text-2xl font-bold text-foreground">{stats.activeProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Team Members</p>
              <p className="text-xs text-muted-foreground/70">Assigned users</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Documents</p>
              <p className="text-xs text-muted-foreground/70">Project files</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalDocuments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/projects/new">
            <Button className="w-full flex items-center justify-center">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <FolderOpen className="h-4 w-4 mr-2" />
              Open Vaults
            </Button>
          </Link>
          <Link href="/credentials">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <Settings className="h-4 w-4 mr-2" />
              Credentials Vault
            </Button>
          </Link>
          <Link href="/videos">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <Video className="h-4 w-4 mr-2" />
              Working Videos
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Projects and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Projects</h2>
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div key={project._id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div>
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.techStack.join(', ')} • {project.status}
                  </p>
                </div>
                <Link href={`/projects/${project._id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-gray-500 text-center py-4">No projects yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity._id} className="flex items-start space-x-3">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    {activity.action} {activity.entityType} "{activity.entityName}"
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}