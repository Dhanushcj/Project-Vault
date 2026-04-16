'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
  Video,
  Play,
  Trash2,
  Plus,
  Search,
  ExternalLink,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface VideoDoc {
  _id: string;
  projectId?: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  uploadedBy?: string;
  createdAt: string;
}

export default function ProjectVideosPage() {
  const params = useParams();
  const projectId = params.id;
  const [videos, setVideos] = useState<VideoDoc[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
  });

  useEffect(() => {
    if (projectId) {
      fetchVideos();
    }
  }, [projectId]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredVideos(videos);
      return;
    }

    const filtered = videos.filter(
      (video) =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredVideos(filtered);
  }, [videos, searchTerm]);

  const fetchVideos = async () => {
    try {
      const response = await api.get('/videos', { params: { projectId } });
      setVideos(response.data);
    } catch {
      toast.error('Failed to load videos');
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
      await api.post('/videos', {
        projectId,
        ...formData,
      });
      toast.success('Video added successfully');
      setShowForm(false);
      setFormData({ title: '', description: '', url: '' });
      fetchVideos();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Failed to add video');
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await api.delete(`/videos/${id}`);
      setVideos(videos.filter((v) => v._id !== id));
      toast.success('Video deleted successfully');
    } catch {
      toast.error('Failed to delete video');
    }
  };

  const getVideoThumbnail = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }
    return '/video-placeholder.png';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
          <h1 className="text-2xl font-bold text-gray-900">Project Videos</h1>
          <p className="text-gray-600">Upload and manage video documentation for this project.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Video</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Video title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <textarea
              placeholder="Video description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="flex min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />

            <Input
              placeholder="Video URL (YouTube, Vimeo, etc.)"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />

            <div className="flex space-x-4">
              <Button type="submit">Add Video</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ title: '', description: '', url: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <div key={video._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="relative aspect-video bg-gray-200">
              <Image
                src={getVideoThumbnail(video.url)}
                alt={video.title}
                fill
                className="object-cover"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${video.title} in a new tab`}
                  className="bg-white rounded-full p-3 hover:bg-gray-100 transition-colors"
                >
                  <Play className="h-6 w-6 text-gray-900" />
                </a>
              </div>
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
              {video.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
              )}

              <div className="flex items-center justify-between">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  Watch Video
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteVideo(video._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">Added {new Date(video.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {videos.length === 0 ? 'No videos uploaded for this project yet' : 'No videos match your search'}
          </p>
          {videos.length === 0 && (
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first video
            </Button>
          )}
        </div>
      )}

      <Toaster />
    </div>
  );
}
