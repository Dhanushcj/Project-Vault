'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

const editProjectSchema = z
  .object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().min(1, 'Description is required'),
    techStack: z.string().min(1, 'Tech stack is required'),
    status: z.enum(['active', 'completed', 'maintenance']),
    githubUrl: z.string().url().optional().or(z.literal('')),
    liveUrl: z.string().url().optional().or(z.literal('')),
    stagingUrl: z.string().url().optional().or(z.literal('')),
    apiEndpoints: z.string().optional(),
    credentialItems: z.array(
      z.object({
        username: z.string().optional(),
        password: z.string().optional(),
        notes: z.string().optional(),
      })
    ),
    videoItems: z.array(
      z.object({
        title: z.string().optional(),
        url: z.string().url('Enter a valid video URL').optional().or(z.literal('')),
        description: z.string().optional(),
      })
    ),
    assignedTeam: z.array(
      z.object({
        user: z.string().min(1, 'Please select a user'),
        projectRole: z.string().min(1, 'Please specify a role'),
      })
    ).optional(),
  })
  .superRefine((data, ctx) => {
    data.credentialItems.forEach((item, index) => {
      const hasUsername = Boolean(item.username?.trim());
      const hasPassword = Boolean(item.password?.trim());
      if (hasUsername !== hasPassword) {
        if (!hasUsername) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Username is required when password is provided',
            path: ['credentialItems', index, 'username'],
          });
        }
        if (!hasPassword) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password is required when username is provided',
            path: ['credentialItems', index, 'password'],
          });
        }
      }
    });
  });

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface ProjectResponse {
  _id: string;
  name: string;
  description: string;
  techStack: string[];
  status: 'active' | 'completed' | 'maintenance';
  githubUrl?: string;
  liveUrl?: string;
  stagingUrl?: string;
  apiEndpoints?: string[];
  assignedTeam?: { user: any; projectRole: string }[];
}

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id;
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      status: 'active',
      credentialItems: [{ username: '', password: '', notes: '' }],
      videoItems: [{ title: '', url: '', description: '' }],
      assignedTeam: [],
    },
  });

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/auth/users');
        setAvailableUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

  const {
    fields: teamFields,
    append: appendTeamMember,
    remove: removeTeamMember,
  } = useFieldArray({
    control,
    name: 'assignedTeam',
  });

  const {
    fields: credentialFields,
    append: appendCredentialRow,
    remove: removeCredentialRow,
  } = useFieldArray({
    control,
    name: 'credentialItems',
  });

  const {
    fields: videoFields,
    append: appendVideoRow,
    remove: removeVideoRow,
  } = useFieldArray({
    control,
    name: 'videoItems',
  });

  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        const response = await api.get<ProjectResponse>(`/projects/${projectId}`);
        const project = response.data;
        reset({
          name: project.name,
          description: project.description,
          techStack: project.techStack.join(', '),
          status: project.status,
          githubUrl: project.githubUrl || '',
          liveUrl: project.liveUrl || '',
          stagingUrl: project.stagingUrl || '',
          apiEndpoints: project.apiEndpoints?.join(', ') || '',
          credentialItems: [{ username: '', password: '', notes: '' }],
          videoItems: [{ title: '', url: '', description: '' }],
          assignedTeam: project.assignedTeam?.map(tm => ({
            user: typeof tm.user === 'object' ? tm.user._id : tm.user,
            projectRole: tm.projectRole
          })) || [],
        });
      } catch {
        toast.error('Failed to load project details');
        router.push('/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, reset, router]);

  const onSubmit = async (data: EditProjectFormData) => {
    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/projects/${projectId}`, {
        name: data.name,
        description: data.description,
        techStack: data.techStack.split(',').map((tech) => tech.trim()).filter(Boolean),
        status: data.status,
        githubUrl: data.githubUrl || '',
        liveUrl: data.liveUrl || '',
        stagingUrl: data.stagingUrl || '',
        apiEndpoints: data.apiEndpoints
          ? data.apiEndpoints.split(',').map((endpoint) => endpoint.trim()).filter(Boolean)
          : [],
        assignedTeam: data.assignedTeam,
      });

      const setupActions: Promise<unknown>[] = [];

      data.credentialItems.forEach((item) => {
        if (item.username && item.password) {
          setupActions.push(
            api.post('/credentials', {
              projectId,
              username: item.username,
              password: item.password,
              notes: item.notes || '',
            })
          );
        }
      });

      data.videoItems.forEach((item) => {
        if (item.url) {
          setupActions.push(
            api.post('/videos', {
              projectId,
              videoUrl: item.url,
              title: item.title || 'Project Demo',
              description: item.description || '',
            })
          );
        }
      });

      if (setupActions.length > 0) {
        const setupResults = await Promise.allSettled(setupActions);
        const hasSetupFailures = setupResults.some((result) => result.status === 'rejected');
        if (hasSetupFailures) {
          toast.error('Project updated. Some credentials/videos could not be saved.');
        }
      }

      toast.success('Project vault updated successfully');
      router.push(`/projects/${projectId}`);
    } catch {
      toast.error('Failed to update project vault');
    } finally {
      setIsSubmitting(false);
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Project Vault</h1>
        <p className="text-sm text-gray-600 mb-6">Update project details, links, and APIs for this vault.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
            <Input {...register('name')} placeholder="Enter project name" error={errors.name?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className="flex min-h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Describe this project"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack *</label>
            <Input
              {...register('techStack')}
              placeholder="React, Node.js, MongoDB (comma-separated)"
              error={errors.techStack?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              {...register('status')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="maintenance">Maintenance</option>
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GitHub URL</label>
              <Input {...register('githubUrl')} placeholder="https://github.com/..." error={errors.githubUrl?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Live URL</label>
              <Input {...register('liveUrl')} placeholder="https://..." error={errors.liveUrl?.message} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staging URL</label>
              <Input {...register('stagingUrl')} placeholder="https://..." error={errors.stagingUrl?.message} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Endpoints</label>
            <Input
              {...register('apiEndpoints')}
              placeholder="https://api.example.com/users, https://api.example.com/posts"
              error={errors.apiEndpoints?.message}
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Add Credentials While Editing (Optional)</h2>
            {credentialFields.map((field, index) => (
              <div key={field.id} className="rounded-md border border-gray-200 bg-white p-3 space-y-3">
                <p className="text-sm font-medium text-gray-700">Credential {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register(`credentialItems.${index}.username`)}
                    placeholder="Credential username/email"
                    error={errors.credentialItems?.[index]?.username?.message}
                  />
                  <Input
                    type="password"
                    {...register(`credentialItems.${index}.password`)}
                    placeholder="Credential password"
                    error={errors.credentialItems?.[index]?.password?.message}
                  />
                </div>
                <textarea
                  {...register(`credentialItems.${index}.notes`)}
                  rows={2}
                  className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Credential notes (optional)"
                />
                {credentialFields.length > 1 && (
                  <Button type="button" variant="outline" onClick={() => removeCredentialRow(index)}>
                    Remove Row
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendCredentialRow({ username: '', password: '', notes: '' })}
            >
              Add Another Row
            </Button>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Add Working Videos While Editing (Optional)</h2>
            {videoFields.map((field, index) => (
              <div key={field.id} className="rounded-md border border-gray-200 bg-white p-3 space-y-3">
                <p className="text-sm font-medium text-gray-700">Working Video {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input {...register(`videoItems.${index}.title`)} placeholder="Video title (optional)" />
                  <Input
                    {...register(`videoItems.${index}.url`)}
                    placeholder="https://youtube.com/... or https://loom.com/..."
                    error={errors.videoItems?.[index]?.url?.message}
                  />
                </div>
                <textarea
                  {...register(`videoItems.${index}.description`)}
                  rows={2}
                  className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Video description (optional)"
                />
                {videoFields.length > 1 && (
                  <Button type="button" variant="outline" onClick={() => removeVideoRow(index)}>
                    Remove Row
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendVideoRow({ title: '', url: '', description: '' })}
            >
              Add Another Row
            </Button>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Assign Team Members</h2>
            <div className="space-y-4">
              {teamFields.map((field, index) => (
                <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start bg-white p-3 rounded-md border border-gray-200">
                  <div className="flex-1 w-full">
                    <select
                      {...register(`assignedTeam.${index}.user`)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Select User</option>
                      {availableUsers.map((u) => (
                        <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                    {errors.assignedTeam?.[index]?.user && (
                      <p className="mt-1 text-xs text-red-600">{errors.assignedTeam[index]?.user?.message}</p>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <Input
                      {...register(`assignedTeam.${index}.projectRole`)}
                      placeholder="e.g. Project Lead, Frontend dev"
                      error={errors.assignedTeam?.[index]?.projectRole?.message}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeTeamMember(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendTeamMember({ user: '', projectRole: 'Developer' })}
              >
                Add Team Member
              </Button>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Project Vault'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(`/projects/${projectId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
      <Toaster />
    </div>
  );
}
