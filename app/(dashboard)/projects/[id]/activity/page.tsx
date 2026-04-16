'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
  Activity,
  Search,
  Filter,
  FolderOpen,
  FileText,
  Video,
  Settings,
  Calendar,
} from 'lucide-react';

interface ActivityLog {
  _id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityName: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export default function ProjectActivityPage() {
  const params = useParams();
  const projectId = params.id;
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  useEffect(() => {
    if (projectId) {
      fetchActivities();
    }
  }, [projectId]);

  useEffect(() => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.entityType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (entityFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.entityType === entityFilter);
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, entityFilter]);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activity');
      const logs = response.data.logs || [];
      const projectEvents = logs.filter(
        (activity: ActivityLog) => activity.entityId === projectId
      );
      setActivities(projectEvents);
    } catch {
      // Keep UI clean; activity failures are surfaced by empty state.
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return <FolderOpen className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'credential':
        return <Settings className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'project':
        return 'text-blue-600';
      case 'document':
        return 'text-green-600';
      case 'video':
        return 'text-purple-600';
      case 'credential':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAction = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
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
          <h1 className="text-2xl font-bold text-gray-900">Project Activity</h1>
          <p className="text-gray-600">Activity logs for this specific project.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            aria-label="Filter activity entity type"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Entities</option>
            <option value="project">Projects</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="credential">Credentials</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setEntityFilter('all');
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {filteredActivities.map((activity) => (
            <div key={activity._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                <div className={`shrink-0 ${getEntityColor(activity.entityType)}`}>
                  {getEntityIcon(activity.entityType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {formatAction(activity.action)} <span className="font-semibold">{activity.entityType}</span>
                      {activity.entityName && (
                        <span className="text-gray-600"> &quot;{activity.entityName}&quot;</span>
                      )}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {activity.details && (
                    <div className="mt-2 text-sm text-gray-600">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(activity.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {activities.length === 0 ? 'No project activity yet' : 'No activities match your filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
