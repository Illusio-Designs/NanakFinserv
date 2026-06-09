import { FileText, Image as ImageIcon, File } from "lucide-react";

/** Small file-type icon based on the file extension (PDF / image / other). */
export default function FileTypeIcon({ file, size = 14, className = "" }) {
  const ext = String(file || "").split(".").pop().toLowerCase();
  const Icon = ext === "pdf"
    ? FileText
    : ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)
      ? ImageIcon
      : File;
  const tone = ext === "pdf" ? "text-red-500" : ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext) ? "text-brand-600" : "text-muted";
  return <Icon size={size} className={`${tone} ${className}`} />;
}
