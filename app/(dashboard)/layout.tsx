'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { isAuthenticated, getCurrentUser, canAccess } from '@/lib/auth';
import {
  LayoutDashboard,
  FolderOpen,
  Shield,
  FileText,
  Video,
  Activity,
  LogOut,
  User,
  Users,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const navigation = [
  { name: 'Vault Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Project Vaults', href: '/projects', icon: FolderOpen },
  { name: 'Credentials', href: '/credentials', icon: Shield, requiresRole: 'developer' },
  { name: 'Project Documents', href: '/documents', icon: FileText },
  { name: 'Working Videos', href: '/videos', icon: Video },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Team Management', href: '/team', icon: Users, requiresRole: 'admin' },
  { name: 'Admin Console', href: '/admin', icon: Shield, requiresRole: 'admin' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClientReady, setIsClientReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeBrand, setActiveBrand] = useState<'antigraviity' | 'forge'>('antigraviity');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
    
    // Load brand
    const savedBrand = localStorage.getItem('selected_brand') as 'antigraviity' | 'forge';
    if (savedBrand) {
      setActiveBrand(savedBrand);
    }
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    setIsAuthed(true);
    setUser(getCurrentUser());
    
    // Load theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!isClientReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthed) {
    return null;
  }

  const filteredNavigation = navigation.filter(item => {
    if (item.requiresRole) {
      return canAccess(item.requiresRole as 'admin' | 'developer' | 'viewer');
    }
    return true;
  });

  // Sidebar component for reuse
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center space-x-3 h-16 px-4 border-b border-border">
        <div className={`p-1.5 rounded-lg transition-colors duration-500 ${activeBrand === 'antigraviity' ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-orange-600'}`}>
          <Image 
            src={activeBrand === 'antigraviity' ? '/brand/antigraviity_v2.jpeg' : '/brand/forge.png'} 
            alt={activeBrand} 
            width={24} 
            height={24}
            className="rounded-sm"
          />
        </div>
        <h1 className="text-sm font-bold text-foreground leading-tight">
          {activeBrand === 'antigraviity' ? 'Antigraviity' : 'Forge India'} <br />
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest italic">Vaults</span>
        </h1>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden ml-auto p-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center">
          <div className="shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                isActive
                  ? activeBrand === 'antigraviity' 
                    ? 'bg-zinc-100 text-zinc-900 border-l-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)] dark:bg-zinc-800 dark:text-white'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'
                  : 'text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle & Logout */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-foreground/70 rounded-md hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors"
        >
          {theme === 'light' ? (
            <>
              <Moon className="mr-3 h-5 w-5 shrink-0" />
              Dark Mode
            </>
          ) : (
            <>
              <Sun className="mr-3 h-5 w-5 shrink-0" />
              Light Mode
            </>
          )}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
          }}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-foreground/70 rounded-md hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-lg border-r border-border">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-xl border-r border-border transform transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-sidebar border-b border-border lg:hidden">
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-lg ${activeBrand === 'antigraviity' ? 'bg-white shadow-sm' : 'bg-orange-600'}`}>
            <Image 
              src={activeBrand === 'antigraviity' ? '/brand/antigraviity_v2.jpeg' : '/brand/forge.png'} 
              alt="Logo" 
              width={20} 
              height={20}
              className="rounded-sm"
            />
          </div>
          <span className="text-sm font-bold truncate">Vaults</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 py-4 lg:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}