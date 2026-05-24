import React, { useEffect, useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileType2,
  X,
  ExternalLink,
  Download,
  Image as ImageIcon,
} from "lucide-react";

const MEDIA_BASE_URL = "https://api.karpagamalumni.in";

const getExtension = (name) => {
  if (!name || typeof name !== "string") return "";
  const clean = name.split("?")[0];
  const idx = clean.lastIndexOf(".");
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : "";
};

const resolveUrl = (raw) => {
  if (!raw) return "";
  return raw.startsWith("http") ? raw : `${MEDIA_BASE_URL}${raw}`;
};

const isPdf = (ext) => ext === "pdf";
const isImage = (ext) =>
  ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
const isOffice = (ext) =>
  ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"].includes(
    ext
  );
const isPlainText = (ext) => ["txt", "csv", "rtf"].includes(ext);

const getIconForExt = (ext) => {
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return FileSpreadsheet;
  if (["zip", "rar", "7z"].includes(ext)) return FileArchive;
  if (isImage(ext)) return ImageIcon;
  if (isPdf(ext)) return FileType2;
  return FileText;
};

export const DocumentPreviewModal = ({ doc, onClose }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!doc) return null;
  const url = resolveUrl(doc.document);
  const ext = getExtension(doc.original_name || doc.document);
  const displayName = doc.original_name || "document";

  const renderPreview = () => {
    if (isPdf(ext)) {
      return (
        <iframe
          src={url}
          title={displayName}
          className="w-full h-full bg-white"
        />
      );
    }
    if (isImage(ext)) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-black">
          <img
            src={url}
            alt={displayName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }
    if (isPlainText(ext)) {
      return (
        <iframe
          src={url}
          title={displayName}
          className="w-full h-full bg-white"
        />
      );
    }
    if (isOffice(ext)) {
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        url
      )}`;
      return (
        <iframe
          src={officeUrl}
          title={displayName}
          className="w-full h-full bg-white"
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-3 p-6 text-center text-white">
        <FileText className="w-16 h-16 opacity-70" />
        <p className="text-sm opacity-80">
          Preview not available for .{ext || "this file type"}.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download={displayName}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download
        </a>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl h-[88vh] rounded-xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-gray-800 truncate">
              {displayName}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={url}
              download={displayName}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 min-h-0">{renderPreview()}</div>
      </div>
    </div>
  );
};

export const DocumentList = ({ documents, title = "Attached documents" }) => {
  const [previewDoc, setPreviewDoc] = useState(null);
  if (!documents || documents.length === 0) return null;

  return (
    <>
      <div className="px-4 pb-3 space-y-1.5">
        {title ? (
          <p className="text-xs font-semibold text-gray-600">{title}</p>
        ) : null}
        {documents.map((doc) => {
          const ext = getExtension(doc.original_name || doc.document);
          const Icon = getIconForExt(ext);
          const url = resolveUrl(doc.document);
          return (
            <div
              key={doc.id}
              className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5"
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <button
                type="button"
                onClick={() => setPreviewDoc(doc)}
                className="flex-1 text-left truncate hover:underline"
                title="Preview"
              >
                {doc.original_name || "document"}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-emerald-600 hover:text-emerald-800"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
      </div>
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  );
};

export default DocumentList;
