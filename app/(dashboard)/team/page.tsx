'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { 
  Users,
  Plus,
  Mail,
  Phone,
  Lock,
  UserPlus,
  Search,
  UserCheck,
  Trash2,
  Shield,
  Eye
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  mobileNumber?: string;
  createdAt: string;
}

export default function TeamManagementPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    role: 'developer'
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const response = await api.post('/auth/employees', newEmployee);
      
      if (response.data.previewUrl) {
        toast.success((t) => (
          <div className="flex flex-col">
            <span className="font-bold text-sm">Account Secured! 🛡️</span>
            <span className="text-xs text-muted-foreground mt-1">Generated email ready for review:</span>
            <a 
              href={response.data.previewUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center mt-2 px-3 py-1 bg-purple-600 text-white text-[10px] rounded-full hover:bg-purple-700 transition-colors w-fit font-bold"
              onClick={() => toast.dismiss(t.id)}
            >
              <Eye className="h-3 w-3 mr-1" /> Open Email Preview
            </a>
          </div>
        ), { duration: 10000 });
      } else {
        toast.success('Employee added successfully!');
      }

      setNewEmployee({ name: '', email: '', mobileNumber: '', password: '', role: 'developer' });
      setIsAddingEmployee(false);
      fetchEmployees();
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Connection lost. Please try again.';
      toast.error(message, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the team?`)) return;
    
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('Employee removed successfully');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove employee');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-purple-600 rounded-lg shadow-lg p-4 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-white/90 shrink-0" />
            <div>
              <h1 className="text-xl sm:text-3xl font-bold">Team Management</h1>
              <p className="text-xs sm:text-purple-100 mt-1">
                Onboard new employees and manage your company team directory.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setIsAddingEmployee(!isAddingEmployee)} 
            className="bg-white text-purple-600 hover:bg-purple-50 font-bold"
          >
            {isAddingEmployee ? 'Cancel' : (
              <><UserPlus className="h-4 w-4 mr-2" /> Add New Employee</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Employee Directory */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg shadow border border-border overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-purple-500" /> 
                Employee Directory ({employees.length})
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search team..."
                  className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="divide-y divide-border">
              {filteredEmployees.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic">
                  No team members matching your search.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div key={emp._id} className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Mail className="h-3 w-3 mr-1" /> {emp.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right flex flex-col items-end">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                          emp.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {emp.role}
                        </span>
                        <p className="text-[10px] text-muted-foreground flex items-center">
                          <Phone className="h-2.5 w-2.5 mr-1" /> {emp.mobileNumber || 'No mobile'}
                        </p>
                      </div>
                      {emp.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteEmployee(emp._id, emp.name)}
                          className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Remove Employee"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Add / Stats */}
        <div className="space-y-6">
          {isAddingEmployee ? (
            <div className="bg-card rounded-lg shadow border border-purple-200 p-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="font-bold text-lg text-purple-700 flex items-center">
                <Plus className="h-5 w-5 mr-1" /> Register Employee
              </h3>
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Name</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Full Name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Email</label>
                  <input
                    required
                    type="email"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="email@company.com"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Mobile</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="+91 XXXXX XXXX"
                    value={newEmployee.mobileNumber}
                    onChange={(e) => setNewEmployee({...newEmployee, mobileNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Password</label>
                  <input
                    required
                    type="password"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Enter password"
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Assigned Role</label>
                  <select
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                  >
                    <option value="developer">Developer (Full Access)</option>
                    <option value="viewer">Viewer (Read Only)</option>
                  </select>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 h-10 font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : 'Create Account'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow border border-border p-6 text-center space-y-4">
              <div className="h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="font-bold text-foreground">Grow Your Team</h3>
              <p className="text-sm text-muted-foreground">
                Administrators can onboard developers and viewers. Each new member receives a welcome email with their credentials.
              </p>
              <Button onClick={() => setIsAddingEmployee(true)} className="w-full variant-outline text-purple-600 border-purple-200">
                Register New Member
              </Button>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-xs font-bold text-amber-800 uppercase mb-2">Security Tip</h4>
            <p className="text-xs text-amber-700">
              Always encourage new team members to update their temporary password after their first login.
            </p>
          </div>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
}
