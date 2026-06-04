import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload as UploadIcon, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DocumentsAPI } from '@/api/endpoints';
import { asMessage } from '@/api/client';
import { useQueryClient } from '@tanstack/react-query';
import Spinner from '@/components/Spinner';
import { formatBytes } from '@/utils/format';

type Item = {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  message?: string;
  chunkCount?: number;
};

export default function Upload() {
  const [items, setItems] = useState<Item[]>([]);
  const qc = useQueryClient();

  const onDrop = async (accepted: File[]) => {
    const next = accepted.map<Item>((f) => ({ file: f, progress: 0, status: 'uploading' }));
    setItems((prev) => [...next, ...prev]);

    for (const item of next) {
      try {
        const res = await DocumentsAPI.upload(item.file, (pct) => {
          setItems((prev) => prev.map((x) =>
            x.file === item.file ? { ...x, progress: pct } : x));
        });
        setItems((prev) => prev.map((x) =>
          x.file === item.file
            ? { ...x, status: 'done', progress: 100, chunkCount: res.chunkCount }
            : x));
        toast.success(`Uploaded ${item.file.name} (${res.chunkCount} chunks)`);
      } catch (e) {
        const msg = asMessage(e);
        setItems((prev) => prev.map((x) =>
          x.file === item.file ? { ...x, status: 'error', message: msg } : x));
        toast.error(`Upload failed: ${msg}`);
      }
    }
    qc.invalidateQueries({ queryKey: ['documents'] });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 20 * 1024 * 1024,
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload documents</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          PDF, DOCX, TXT, or MD. Max 20 MB per file. Text is chunked and embedded automatically.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={
          'cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ' +
          (isDragActive
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
            : 'border-zinc-300 bg-white hover:border-brand-400 dark:border-zinc-700 dark:bg-zinc-900')
        }
      >
        <input {...getInputProps()} />
        <UploadIcon className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop files here' : 'Drag & drop, or click to choose'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">PDF - DOCX - TXT - MD</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="card">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-zinc-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{it.file.name}</div>
                  <div className="text-xs text-zinc-500">{formatBytes(it.file.size)}</div>
                </div>
                {it.status === 'uploading' && <Spinner className="text-brand-500" />}
                {it.status === 'done' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Indexed ({it.chunkCount} chunks)
                  </span>
                )}
                {it.status === 'error' && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4" /> {it.message}
                  </span>
                )}
              </div>
              {it.status === 'uploading' && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="h-full bg-brand-500 transition-all" style={{ width: `${it.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
