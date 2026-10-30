import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiMessage } from '../../lib/api';
import { fileSize } from '../../lib/utils';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/zip': ['.zip'],
};

export function FileDropzone({ files, onChange, purpose = 'reference', orderId, maxFiles = 8, maxMb = 10, label = 'Attach reference files' }) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const upload = useCallback(async (accepted) => {
    const data = new FormData();
    accepted.forEach((f) => data.append('files', f));
    data.append('purpose', purpose);
    if (orderId) data.append('orderId', orderId);
    setBusy(true);
    setProgress(0);
    try {
      const { data: res } = await api.post('/files/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      onChange([...files, ...res.files]);
      toast.success(`${res.files.length} file${res.files.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast.error(apiMessage(err, 'Upload failed.'));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }, [files, onChange, purpose, orderId]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: ACCEPT,
    maxFiles,
    maxSize: maxMb * 1024 * 1024,
    disabled: busy,
    onDrop: upload,
  });

  const remove = async (file) => {
    onChange(files.filter((f) => f._id !== file._id));
    await api.delete(`/files/${file._id}`).catch(() => toast.error('Could not delete the stored file.'));
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors ${
          isDragActive ? 'border-emerald bg-mint' : 'border-line bg-canvas hover:border-emerald/50 hover:bg-mint/40'
        } ${busy ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input {...getInputProps()} aria-label={label} />
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-forest ring-1 ring-line"><UploadCloud className="size-5" aria-hidden /></span>
        <p className="mt-3 text-[13px] font-semibold text-ink">{isDragActive ? 'Drop files to upload' : label}</p>
        <p className="mt-1 text-[11.5px] text-muted">Drag & drop or click · PDF, DOC/DOCX, XLS/XLSX, PPTX, TXT, CSV, PNG, JPG, ZIP · up to {maxMb} MB each</p>
        {busy && (
          <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-emerald transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {fileRejections.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-danger">
          <AlertCircle className="size-3.5" aria-hidden />
          {fileRejections[0].errors[0]?.code === 'file-too-large' ? `One file exceeds ${maxMb} MB.` : 'Some files were rejected (type or size).'}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li key={f._id} className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5">
              <FileText className="size-4 shrink-0 text-forest" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold text-ink">{f.originalName}</p>
                <p className="text-[10.5px] text-muted">{fileSize(f.size)} · upload complete</p>
              </div>
              <CheckCircle2 className="size-4 shrink-0 text-emerald" aria-hidden />
              <button onClick={() => remove(f)} aria-label={`Remove ${f.originalName}`} className="rounded-md p-1 text-muted hover:bg-red-50 hover:text-danger">
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
