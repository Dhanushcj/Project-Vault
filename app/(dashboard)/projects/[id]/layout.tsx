'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  FolderOpen,
  Shield,
  FileText,
  Video,
  Calendar,
} from 'lucide-react';

interface ProjectLayoutProps {
  children: ReactNode;
}

export default function ProjectFolderLayout({ children }: ProjectLayoutProps) {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';

  const navItems = [
    { href: `/projects/${projectId}`, label: 'Overview', Icon: FolderOpen },
    { href: `/projects/${projectId}/credentials`, label: 'Credentials', Icon: Shield },
    { href: `/projects/${projectId}/documents`, label: 'Documents', Icon: FileText },
    { href: `/projects/${projectId}/videos`, label: 'Videos', Icon: Video },
    { href: `/projects/${projectId}/activity`, label: 'Activity', Icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Project folder</p>
            <h1 className="text-2xl font-semibold text-gray-900">Project {projectId}</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
