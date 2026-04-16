'use client';

import { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import toast, { Toaster } from 'react-hot-toast';

const projectSchema = z
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
        videoFile: z.any().optional(),
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

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const user = getCurrentUser();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'active',
      credentialItems: [{ username: '', password: '', notes: '' }],
      videoItems: [{ title: '', videoFile: undefined, description: '' }],
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

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    try {
      const projectData = {
        name: data.name,
        description: data.description,
        status: data.status,
        techStack: data.techStack.split(',').map(tech => tech.trim()),
        apiEndpoints: data.apiEndpoints ? data.apiEndpoints.split(',').map(url => url.trim()) : [],
        createdBy: user?.id,
        githubUrl: data.githubUrl,
        liveUrl: data.liveUrl,
        stagingUrl: data.stagingUrl,
        assignedTeam: data.assignedTeam,
      };

      const response = await api.post('/projects', projectData);
      const projectId = response.data._id;

      const setupActions: Promise<unknown>[] = [];

      data.credentialItems.forEach((item) => {
        if (item.username && item.password) {
          setupActions.push(
            api.post('/credentials', {
              projectId,
              name: data.name, // Link credential with project name
              username: item.username,
              password: item.password,
              notes: item.notes || '',
            })
          );
        }
      });

      data.videoItems.forEach((item) => {
        if (item.videoFile && item.videoFile[0]) {
          const videoFormData = new FormData();
          videoFormData.append('projectId', projectId);
          videoFormData.append('video', item.videoFile[0]);
          videoFormData.append('title', item.title || '');
          videoFormData.append('description', item.description || '');
          
          setupActions.push(
            api.post('/videos', videoFormData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
          );
        }
      });

      if (setupActions.length > 0) {
        const setupResults = await Promise.allSettled(setupActions);
        const hasSetupFailures = setupResults.some((result) => result.status === 'rejected');
        if (hasSetupFailures) {
          toast.error('Project vault created. Some credential/video items could not be saved.');
        } else {
          toast.success('Project vault, credentials, and video saved successfully!');
        }
      } else {
        toast.success('Project vault created successfully! Add credentials and working videos next.');
      }

      router.push(`/projects/${response.data._id}?onboarding=1`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to create project vault';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-2">Create Project Vault</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Create one folder for this company project with Git and deployed links now, then add credentials and working videos.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Project Name *
            </label>
            <Input
              {...register('name')}
              placeholder="Enter company project name"
              error={errors.name?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="flex min-h-20 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Describe business purpose, login flow, and key modules"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Tech Stack *
            </label>
            <Input
              {...register('techStack')}
              placeholder="React, Node.js, MongoDB (comma-separated)"
              error={errors.techStack?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Status *
            </label>
            <select
              {...register('status')}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="maintenance">Maintenance</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub URL
              </label>
              <Input
                {...register('githubUrl')}
                placeholder="https://github.com/company/repository"
                error={errors.githubUrl?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Live URL
              </label>
              <Input
                {...register('liveUrl')}
                placeholder="https://project.company.com"
                error={errors.liveUrl?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staging URL
              </label>
              <Input
                {...register('stagingUrl')}
                placeholder="https://staging.project.company.com"
                error={errors.stagingUrl?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              API Endpoints
            </label>
            <Input
              {...register('apiEndpoints')}
              placeholder="https://api.example.com/users, https://api.example.com/posts (comma-separated)"
              error={errors.apiEndpoints?.message}
            />
          </div>

          <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">After creating this vault:</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-blue-800 space-y-1">
              <li>Add project login credentials from the Credentials section.</li>
              <li>Add working demo videos from the Videos section.</li>
              <li>Keep Git, live, and staging links updated for quick access.</li>
            </ul>
          </div>

          <div className="rounded-md border border-border bg-muted p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Add Credential in This Menu (Optional)</h2>
            {credentialFields.map((field, index) => (
              <div key={field.id} className="rounded-md border border-border bg-card p-3 space-y-3">
                <p className="text-sm font-medium text-foreground/80">Credential {index + 1}</p>
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
                  className="flex min-h-[60px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
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
            <p className="text-xs text-gray-500">
              Fill username and password in any row to save that credential while creating this vault.
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Add Working Video in This Menu (Optional)</h2>
            {videoFields.map((field, index) => (
              <div key={field.id} className="rounded-md border border-border bg-card p-3 space-y-3">
                <p className="text-sm font-medium text-foreground/80">Working Video {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register(`videoItems.${index}.title`)}
                    placeholder="Video title (optional)"
                  />
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      {...register(`videoItems.${index}.videoFile`)}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/40 dark:file:text-blue-200"
                    />
                    {errors.videoItems?.[index]?.videoFile && (
                      <p className="mt-1 text-sm text-red-600">{(errors.videoItems[index]?.videoFile as any).message}</p>
                    )}
                  </div>
                </div>
                <textarea
                  {...register(`videoItems.${index}.description`)}
                  rows={2}
                  className="flex min-h-[60px] w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
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
              onClick={() => appendVideoRow({ title: '', videoFile: undefined, description: '' })}
            >
              Add Another Row
            </Button>
          </div>

          <div className="rounded-md border border-border bg-muted p-4 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Assign Team Members</h2>
            <div className="space-y-4">
              {teamFields.map((field, index) => (
                <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start bg-card p-3 rounded-md border border-border">
                  <div className="flex-1 w-full">
                    <select
                      {...register(`assignedTeam.${index}.user`)}
                      className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project Vault'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
      <Toaster />
    </div>
  );
}