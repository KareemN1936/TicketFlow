export const maxAttachmentSize = 10 * 1024 * 1024;
export const allowedAttachmentExtensions = [".png", ".jpg", ".jpeg", ".pdf", ".doc", ".docx", ".txt", ".log"];

export function validateAttachment(file: File | null): string {
  if (!file) return "Choose a file to upload.";
  if (file.size === 0) return `${file.name} is empty.`;
  if (file.size > maxAttachmentSize) return `${file.name} exceeds the 10 MB limit.`;

  const extensionIndex = file.name.lastIndexOf(".");
  const extension = extensionIndex >= 0 ? file.name.slice(extensionIndex).toLowerCase() : "";

  if (!allowedAttachmentExtensions.includes(extension)) {
    return `${file.name} is not supported. Choose PNG, JPG, JPEG, PDF, DOC, DOCX, TXT, or LOG files.`;
  }

  return "";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

