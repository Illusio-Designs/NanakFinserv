"use client";
import { useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Drag-or-click file input. onChange(File|null). `existingName` shows a stored file. */
export default function FileUpload({ label, accept, onChange, existingName, className }) {
  const ref = useRef(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);

  const pick = (f) => {
    setFile(f);
    onChange?.(f);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="ui-label">{label}</label>}
      {file ? (
        <div className="flex items-center justify-between rounded-md border border-line bg-subtle px-3 py-2.5">
          <span className="flex items-center gap-2 truncate text-[13px] text-ink"><FileIcon size={15} className="text-brand-600" /> {file.name}</span>
          <button type="button" onClick={() => pick(null)} className="press rounded p-1 text-muted hover:text-danger"><X size={15} /></button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.[0]) pick(e.dataTransfer.files[0]); }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-5 text-center transition-colors",
            drag ? "border-brand-600 bg-brand-50" : "border-line bg-subtle/50 hover:bg-subtle"
          )}
        >
          <UploadCloud size={20} className="text-brand-600" />
          <p className="mt-1 text-[13px] text-ink">Click or drag a file to upload</p>
          {existingName ? (
            <p className="mt-1 text-[11px] text-green-700">✓ On file: {existingName} (upload to replace)</p>
          ) : (
            <p className="mt-1 text-[11px] text-muted">{accept || "PDF, JPG, PNG"}</p>
          )}
        </div>
      )}
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
    </div>
  );
}
