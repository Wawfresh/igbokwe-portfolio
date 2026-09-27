import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, FolderOpen } from 'lucide-react';

interface UploadedFileMeta {
  url: string;
  filename: string;
  originalName: string;
  size: string;
  mimetype: string;
}

interface ImageUploaderProps {
  onUploadSuccess: (files: UploadedFileMeta[]) => void;
  multiple?: boolean;
  label?: string;
  accept?: string;
  uploadEndpoint?: string;
}

export default function ImageUploader({
  onUploadSuccess,
  multiple = false,
  label = 'Drag images here or click to browse',
  accept = 'image/*,.jfif,.jpg,.jpeg,.png,.webp,.gif,.pdf',
  uploadEndpoint = '/api/admin/upload',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = async (fileList: FileList) => {
    setError(null);
    const filesToUpload: File[] = [];

    // Validate size (50MB) and type
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 50 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 50 MB maximum limit.`);
        return;
      }
      filesToUpload.push(file);
    }

    if (filesToUpload.length === 0) return;

    setUploading(true);
    setProgress(30);

    const formData = new FormData();
    // Append files cleanly without triple payload duplication
    filesToUpload.forEach((file) => {
      formData.append('files', file);
    });
    // Also append as single 'file' field for endpoints that expect single file
    if (filesToUpload.length === 1) {
      formData.append('file', filesToUpload[0]);
    }

    try {
      const token = localStorage.getItem('admin_token');
      setProgress(60);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      setProgress(90);
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      if (!res.ok || !data) {
        let errorMsg = data?.error || data?.message;
        if (!errorMsg) {
          if (res.status === 413) {
            errorMsg = 'File exceeds maximum upload size limit of 50 MB.';
          } else if (res.status === 401) {
            errorMsg = 'Your session has expired. Please log in again to upload.';
          } else if (res.status === 404) {
            errorMsg = 'Upload endpoint not found. Please try again.';
          } else {
            errorMsg = `Upload failed (Status ${res.status}). Please try again with a valid file.`;
          }
        }
        throw new Error(errorMsg);
      }

      setProgress(100);
      const returnedFiles: UploadedFileMeta[] = [];
      if (Array.isArray(data.files) && data.files.length > 0) {
        returnedFiles.push(...data.files);
      } else if (data.imageUrl || data.url) {
        const url = data.imageUrl || data.url;
        returnedFiles.push({
          url,
          filename: url.split('/').pop() || 'image',
          originalName: filesToUpload[0].name,
          size: `${(filesToUpload[0].size / (1024 * 1024)).toFixed(2)} MB`,
          mimetype: filesToUpload[0].type,
        });
      }

      if (returnedFiles.length > 0) {
        onUploadSuccess(returnedFiles);
      } else {
        throw new Error('No uploaded files returned from server.');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      let errorMsg = err.message || 'Something went wrong during upload.';
      if (typeof errorMsg === 'string' && (errorMsg.includes('<!doctype') || errorMsg.includes('<html') || errorMsg.includes('<body'))) {
        errorMsg = 'Server returned an unexpected response. Please try again.';
      } else if (errorMsg === 'Failed to fetch' || errorMsg.includes('fetch')) {
        errorMsg = 'Upload could not connect to server. Please ensure the file is under 50 MB and try again.';
      }
      setError(errorMsg);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          if (e.target === fileInputRef.current) return;
          fileInputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 select-none ${
          isDragging
            ? 'border-[#0B5D3B] bg-emerald-50/70 scale-[1.01]'
            : 'border-gray-200 hover:border-[#0B5D3B] bg-gray-50/50 hover:bg-emerald-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          onClick={(e) => e.stopPropagation()}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div className="w-12 h-12 rounded-full bg-emerald-100/70 text-[#0B5D3B] flex items-center justify-center shadow-xs">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#17211C]">{label}</p>
            <p className="text-xs text-[#66736B]">
              JPG, PNG, WEBP, GIF, or PDF up to 50 MB
            </p>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-1 px-3.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#0B5D3B] text-xs font-semibold text-[#0B5D3B] flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-emerald-50/50"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Select from Device</span>
          </button>
        </div>

        {uploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#0B5D3B] h-1.5 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#66736B] mt-1.5">Uploading file... {progress}%</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 mt-2 bg-red-50 p-2.5 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
