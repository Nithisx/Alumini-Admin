// Client-side validation for document uploads on jobs and events.
// Mirrors the backend rules in api/models.py (validate_document_file).

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "csv", "odt", "ods", "odp", "rtf",
  "zip", "rar", "7z",
];

export const BLOCKED_SCRIPT_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "sh", "bash", "zsh", "ps1", "psm1", "vbs", "vbe",
  "js", "mjs", "cjs", "jsx", "ts", "tsx", "py", "pyc", "pyo", "pyw",
  "pl", "rb", "php", "php3", "php4", "php5", "phtml", "asp", "aspx",
  "jsp", "jspx", "cgi", "scr", "com", "msi", "msp", "jar", "class",
  "dll", "so", "dylib", "reg", "lnk", "app", "deb", "rpm", "apk",
  "ipa", "htaccess", "htm", "html", "xhtml", "svg",
]);

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20 MB

export const DOCUMENT_ACCEPT_ATTR = [
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".txt", ".csv", ".odt", ".ods", ".odp", ".rtf",
  ".zip", ".rar", ".7z",
].join(",");

export function getExtension(name) {
  if (!name || typeof name !== "string") return "";
  const idx = name.lastIndexOf(".");
  if (idx < 0 || idx === name.length - 1) return "";
  return name.slice(idx + 1).toLowerCase();
}

// Returns { ok: true } or { ok: false, error: string }.
export function validateDocumentFile(file) {
  if (!file) return { ok: false, error: "No file provided." };
  const ext = getExtension(file.name);
  if (!ext) {
    return { ok: false, error: "File must have an extension." };
  }
  if (BLOCKED_SCRIPT_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      error: `File type ".${ext}" is not allowed. Script and executable files cannot be uploaded.`,
    };
  }
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      error: `Unsupported document type ".${ext}". Allowed: ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")}.`,
    };
  }
  if (typeof file.size === "number" && file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: "Document too large. Maximum allowed size is 20 MB." };
  }
  return { ok: true };
}

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
