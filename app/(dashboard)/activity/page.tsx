'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { debounce } from '@/lib/utils';
import {
  Activity,
  Search,
  Filter,
  User,
  FolderOpen,
  FileText,
  Video,
  Settings,
  Calendar,
  ChevronDown
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ActivityLog {
  _id: string;
  userId?: any;
  action: string;
  entityType: string;
  entityName: string;
  entityId?: string;
  details?: any;
  createdAt: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // We use this to keep track of the search term for the API call
  // to avoid fetching on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const updateSearch = useCallback(
    debounce((term: string) => {
      setDebouncedSearch(term);
      setPage(1);
    }, 500),
    []
  );

  useEffect(() => {
    updateSearch(searchTerm);
  }, [searchTerm, updateSearch]);

  const fetchActivities = async (pageNum: number, isInitial: boolean = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        entityType: entityFilter === 'all' ? '' : entityFilter,
        action: debouncedSearch
      });

      const response = await api.get(`/activity?${params.toString()}`);
      const { logs, pages } = response.data;

      if (pageNum === 1) {
        setActivities(logs);
      } else {
        setActivities(prev => [...prev, ...logs]);
      }

      setHasMore(pageNum < pages);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities(1, true);
  }, [debouncedSearch, entityFilter]);

  const handleEntityFilterChange = (val: string) => {
    setEntityFilter(val);
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage);
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'project': return <FolderOpen className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'credential': return <Settings className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'project': return 'text-blue-600';
      case 'document': return 'text-green-600';
      case 'video': return 'text-purple-600';
      case 'credential': return 'text-red-600';
      case 'user': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const formatAction = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
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
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground">Track all changes and actions in your projects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-6 border border-border">
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
            aria-label="Filter activity by entity type"
            value={entityFilter}
            onChange={(e) => handleEntityFilterChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Entities</option>
            <option value="project">Projects</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="credential">Credentials</option>
            <option value="user">Users</option>
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setEntityFilter('all');
              setPage(1);
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-card rounded-lg shadow border border-border">
        <div className="divide-y divide-border">
          {activities.map((activity) => (
            <div key={activity._id} className="p-6 hover:bg-muted transition-colors">
              <div className="flex items-start space-x-4">
                <div className={`shrink-0 ${getEntityColor(activity.entityType)}`}>
                  {getEntityIcon(activity.entityType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {formatAction(activity.action)}{' '}
                      <span className="font-semibold">{activity.entityType}</span>
                      {activity.entityName && (
                        <>
                          {' '}
                          <span className="text-muted-foreground">"{activity.entityName}"</span>
                        </>
                      )}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {activity.details && (
                    <div className="mt-2 text-sm text-gray-600">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && !loading && (
          <div className="p-12 text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm || entityFilter !== 'all' ? 'No activities match your filters' : 'No activity yet'}
            </p>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="p-4 border-t border-border flex justify-center">
            <Button
              variant="ghost"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-primary hover:text-primary/80"
            >
              {loadingMore ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              Load More Activities
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}