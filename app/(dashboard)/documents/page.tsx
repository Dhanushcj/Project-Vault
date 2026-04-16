'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
  Upload,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Plus,
  Search
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Document {
  _id: string;
  projectId?: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: any;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    if (!searchTerm) {
      setFilteredDocuments(documents);
      return;
    }

    const filtered = documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocuments(filtered);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('File uploaded successfully');
      setSelectedFile(null);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter(d => d._id !== id));
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const downloadDocument = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-600" />;
    if (mimeType === 'application/pdf') return <FileText className="h-8 w-8 text-red-600" />;
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'bg-blue-100 text-blue-800';
    if (mimeType === 'application/pdf') return 'bg-red-100 text-red-800';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'bg-blue-100 text-blue-800';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">Upload and manage project files and documentation</p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upload New Document</h2>

        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.svg,.zip,.rar"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center px-4 py-2 border border-border rounded-md cursor-pointer hover:bg-muted"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </label>
            {selectedFile && (
              <span className="text-sm text-gray-600">{selectedFile.name}</span>
            )}
          </div>

          <Button type="submit" disabled={!selectedFile || uploading}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </form>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <div key={document._id} className="bg-card rounded-lg shadow-md p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {getFileIcon(document.mimeType)}
                <div className="ml-3">
                  <h3 className="font-semibold text-foreground truncate" title={document.originalName}>
                    {document.originalName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{formatFileSize(document.size)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFileTypeColor(document.mimeType)}`}>
                {document.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
              </span>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadDocument(document.url, document.originalName)}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteDocument(document._id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Uploaded {new Date(document.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
          </p>
          {documents.length === 0 && (
            <Button className="mt-4" onClick={() => document.getElementById('file-upload')?.click()}>
              <Plus className="h-4 w-4 mr-2" />
              Upload your first document
            </Button>
          )}
        </div>
      )}

      <Toaster />
    </div>
  );
}