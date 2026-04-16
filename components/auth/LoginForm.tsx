'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { setAuthData } from '@/lib/auth';
import toast, { Toaster } from 'react-hot-toast';
import { Shield, Lock, User, Globe, ChevronRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type Brand = 'antigraviity' | 'forge';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeBrand, setActiveBrand] = useState<Brand>('antigraviity');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      setAuthData(response.data);
      // Store selected brand for dashboard branding
      localStorage.setItem('selected_brand', activeBrand);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const brandConfig = {
    antigraviity: {
      name: 'Antigraviity',
      logo: '/brand/antigraviity_v2.jpeg',
      color: 'bg-white text-black hover:bg-zinc-200',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]',
      accent: 'border-cyan-500/50',
      tagline: 'Defying the limits of innovation.',
      mesh: {
        fallback: '#09090b',
        color1: 'hsla(0,0%,10%,1)',
        color2: 'hsla(0,0%,5%,1)',
        color3: 'hsla(190,40%,10%,1)' // Subtle cyan hint
      }
    },
    forge: {
      name: 'Forge India Connect',
      logo: '/brand/forge.png',
      color: 'bg-orange-600 text-white hover:bg-orange-700',
      glow: 'shadow-orange-500/20',
      accent: 'border-orange-500/50',
      tagline: 'Forging connections, powering growth.',
      mesh: {
        fallback: '#0f172a',
        color1: 'hsla(253,16%,7%,1)',
        color2: 'hsla(225,39%,30%,1)',
        color3: 'hsla(339,49%,30%,1)'
      }
    }
  };

  const currentBrand = brandConfig[activeBrand];

  return (
    <div 
      className="min-h-screen flex items-center justify-center transition-all duration-700 p-4 mesh-bg mesh-animate"
      style={{
        '--mesh-fallback': currentBrand.mesh.fallback,
        '--mesh-color-1': currentBrand.mesh.color1,
        '--mesh-color-2': currentBrand.mesh.color2,
        '--mesh-color-3': currentBrand.mesh.color3,
      } as any}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none"></div>
      
      <div className="relative w-full max-w-[1000px] flex flex-col md:flex-row glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        
        {/* Left Side: Brand Visuals */}
        <div className={`hidden md:flex flex-1 flex-col justify-between p-12 text-white relative overflow-hidden transition-colors duration-500 ${activeBrand === 'antigraviity' ? 'bg-zinc-950/60' : 'bg-slate-950/40'}`}>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-8">
              <div className={`p-2 rounded-lg ${activeBrand === 'antigraviity' ? 'bg-cyan-500' : 'bg-orange-500'}`}>
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Project Vaults</span>
            </div>
            
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              Securely Manage <br /> 
              Your <span className={activeBrand === 'antigraviity' ? 'text-cyan-400' : 'text-orange-400'}>Digital Assets</span>
            </h1>
            <p className="text-lg text-white/70 max-w-sm">
              The centralized platform for team collaboration, credential security, and project documentation.
            </p>
          </div>
          
          <div className="relative z-10 flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${activeBrand === 'antigraviity' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-orange-500/20 text-orange-400'}`}>
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">End-to-End Encrypted</p>
              <p className="text-xs text-white/50">Your data is secured with AES-256</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 p-8 md:p-12 bg-white dark:bg-zinc-950">
          <div className="max-w-sm mx-auto w-full">
            
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 mb-4 transition-all duration-500 transform hover:scale-105">
                <Image 
                  src={brandConfig[activeBrand].logo} 
                  alt={brandConfig[activeBrand].name}
                  width={64}
                  height={64}
                  className="rounded-lg object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{brandConfig[activeBrand].tagline}</p>
            </div>

            {/* Brand Toggle */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
              <button
                type="button"
                onClick={() => setActiveBrand('antigraviity')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeBrand === 'antigraviity' 
                  ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Antigraviity
              </button>
              <button
                type="button"
                onClick={() => setActiveBrand('forge')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeBrand === 'forge' 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600 dark:text-orange-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Forge India
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  <Input
                    {...register('email')}
                    type="text"
                    placeholder="Email or username"
                    error={errors.email?.message}
                    className="pl-10 h-12 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-opacity-20 transition-all"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="Password"
                    error={errors.password?.message}
                    className="pl-10 h-12 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-opacity-20 transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full h-12 rounded-xl font-bold transition-all active:scale-[0.98] ${currentBrand.color} ${currentBrand.glow}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Get Started <ChevronRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="text-center pt-4">
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  Protected Access • Unauthorized Entry Forbidden
                </p>
              </div>
            </form>

            <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Powered by Antigravity AI</span>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
