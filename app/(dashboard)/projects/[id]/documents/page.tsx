'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import {
  Upload,
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Plus,
  Search,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface DocumentType {
  _id: string;
  projectId?: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy?: string;
  createdAt: string;
}

export default function ProjectDocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchDocuments();
    }
  }, [projectId]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredDocuments(documents);
      return;
    }

    const filtered = documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredDocuments(filtered);
  }, [documents, searchTerm]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents', { params: { projectId } });
      setDocuments(response.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };


  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !projectId) return;

    setUploading(true);
    try {
      // 1. Upload directly to Cloudinary from client
      const cloudData = await uploadToCloudinary(selectedFile);
      
      // 2. Send the URL and metadata to our backend
      await api.post('/documents', {
        projectId,
        fileUrl: cloudData.url,
        fileName: cloudData.fileName,
        fileType: cloudData.fileType
      });

      toast.success('File uploaded successfully');
      setSelectedFile(null);
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };


  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter((d) => d._id !== id));
      toast.success('Document deleted successfully');
    } catch {
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
          <h1 className="text-2xl font-bold text-gray-900">Project Documents</h1>
          <p className="text-gray-600">Upload and manage files tied to this project.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h2>

        <form onSubmit={handleFileUpload} className="space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              id="project-document-upload"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.svg,.zip,.rar"
            />
            <label
              htmlFor="project-document-upload"
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </label>
            {selectedFile && <span className="text-sm text-gray-600">{selectedFile.name}</span>}
          </div>

          <Button type="submit" disabled={!selectedFile || uploading}>
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((document) => (
          <div key={document._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {getFileIcon(document.mimeType)}
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900 truncate" title={document.originalName}>
                    {document.originalName}
                  </h3>
                  <p className="text-sm text-gray-600">{formatFileSize(document.size)}</p>
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

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Uploaded {new Date(document.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {documents.length === 0 ? 'No documents uploaded for this project yet' : 'No documents match your search'}
          </p>
          {documents.length === 0 && (
            <Button className="mt-4" onClick={() => document.getElementById('project-document-upload')?.click()}>
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
