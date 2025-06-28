import { isText } from 'istextorbinary';
import { attachment } from '../database/tables/attachment.js';
import { MediaType, PartType } from './remote-llm-model.js';

// File type categories
export interface FileTypeInfo {
  category: 'image' | 'pdf' | 'text';
  partType: PartType;
  mediaType?: MediaType;
}

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_SIZE = 1 * 1024 * 1024; // 1MB for text files

const SUPPORTED_IMAGE_TYPES = [
  /^image\/jpeg$/,
  /^image\/png$/,
  /^image\/gif$/,
  /^image\/webp$/
];

const SUPPORTED_TEXT_TYPES = [
  /^text\/.*/,
];


export function getFileInfo(fileName: string, mimeType: string, size: number, buffer: Buffer): { info?: { fileType: typeof attachment.$inferInsert['file_type'], size: number }, error?: string } {

  let fileType: typeof attachment.$inferInsert['file_type'] | null = null;
  // Handle image files
  if (mimeType && SUPPORTED_IMAGE_TYPES.some(pattern => pattern.test(mimeType))) {
    fileType = mimeType as typeof attachment.$inferInsert['file_type'];
  }

  // Handle PDF files
  if (mimeType === 'application/pdf') {
    fileType = 'pdf';
  }

  // Handle text files (using regex patterns)
  if (mimeType && SUPPORTED_TEXT_TYPES.some(pattern => pattern.test(mimeType))) {
    fileType = 'text';
  }

  // fallback to check if we can read as text
  if (!fileType && isText(fileName, buffer)) {
    fileType = 'text';
  }

  if (fileType) {
    const maxSize = fileType === 'text' ? MAX_TEXT_SIZE : MAX_FILE_SIZE;

    if (size > maxSize) {
      return {
        error: `File size exceeds the limit of ${maxSize / (1024 * 1024)} MB`,
      }
    }

    return {
      info: {
        fileType,
        size: size
      }
    }
  }

  return {
    error: 'Unsupported file type or size exceeds the limit',
  }
}
