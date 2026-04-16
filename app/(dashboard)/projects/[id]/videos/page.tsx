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
  videoUrl: string;
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
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    videoFile: File | null;
  }>({
    title: '',
    description: '',
    videoFile: null,
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
      const videoFormData = new FormData();
      videoFormData.append('projectId', projectId as string);
      videoFormData.append('title', formData.title);
      videoFormData.append('description', formData.description);
      if (formData.videoFile) {
        videoFormData.append('video', formData.videoFile);
      }

      await api.post('/videos', videoFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Video added successfully');
      setShowForm(false);
      setFormData({ title: '', description: '', videoFile: null });
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
    if (!url) return '/video-placeholder.png';
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }
    // For local files, show the platform icon or a generic video thumbnail
    return 'https://cdn-icons-png.flaticon.com/512/3221/3221897.png';
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
          <h1 className="text-2xl font-bold text-foreground">Project Videos</h1>
          <p className="text-muted-foreground">Upload and manage video documentation for this project.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Add New Video</h2>

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
              className="flex min-h-20 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground opacity-80">Video File</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFormData({ ...formData, videoFile: e.target.files?.[0] || null })}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>

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
          <div key={video._id} className="bg-card rounded-lg shadow-md overflow-hidden border border-border hover:shadow-lg transition-shadow">
            <div className="relative aspect-video bg-muted">
              <Image
                src={getVideoThumbnail(video.videoUrl)}
                alt={video.title}
                fill
                className="object-cover p-8"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <a
                  href={video.videoUrl.startsWith('http') ? video.videoUrl : `${api.defaults.baseURL?.replace('/api', '')}${video.videoUrl}`}
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
              <h3 className="font-semibold text-foreground mb-2">{video.title}</h3>
              {video.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{video.description}</p>
              )}

              <div className="flex items-center justify-between">
                <a
                  href={video.videoUrl.startsWith('http') ? video.videoUrl : `${api.defaults.baseURL?.replace('/api', '')}${video.videoUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center"
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

              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Added {new Date(video.createdAt).toLocaleDateString()}</p>
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
