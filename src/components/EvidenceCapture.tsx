import { ChangeEvent, useEffect, useState } from 'react';
import { Camera, CheckCircle2, X } from 'lucide-react';

interface EvidenceCaptureProps {
  title: string;
  helper: string;
  capture?: 'user' | 'environment';
  required?: boolean;
  onCaptureStateChange?: (captured: boolean) => void;
  onFileChange?: (file: File | null) => void;
}

export default function EvidenceCapture({ title, helper, capture = 'environment', required = false, onCaptureStateChange, onFileChange }: EvidenceCaptureProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name);
    onCaptureStateChange?.(true);
    onFileChange?.(file);
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName('');
    onCaptureStateChange?.(false);
    onFileChange?.(null);
  };

  return (
    <div className="space-y-3">
      <label className="relative block aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-[2rem] border-2 border-dashed border-outline-variant bg-surface-container-lowest active:scale-[0.99] transition-transform">
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Evidence preview" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-black/55 p-3 text-white">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4" />
                Evidence captured
              </div>
              {fileName && <p className="mt-1 truncate text-[10px] text-white/75">{fileName}</p>}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Camera className="mb-3 h-12 w-12 text-outline" />
            <p className="text-sm font-bold text-on-surface-variant">{title}</p>
            <p className="mt-1 text-[10px] text-outline">{helper}</p>
            {required && <p className="mt-3 rounded-full bg-primary-fixed/70 px-3 py-1 text-[9px] font-bold uppercase text-primary">Required before submit</p>}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          capture={capture}
          className="sr-only"
          onChange={handleFileChange}
        />
      </label>

      {previewUrl && (
        <button
          type="button"
          onClick={clearFile}
          className="mx-auto flex h-10 items-center justify-center gap-2 rounded-full bg-surface-container-low px-4 text-xs font-bold text-primary active:scale-95 transition-transform"
        >
          <X className="h-4 w-4" />
          Retake photo
        </button>
      )}
    </div>
  );
}
