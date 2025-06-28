import { Download, File, FileText } from "lucide-react";
import { FunctionComponent } from "react";
import { UIMessage } from "./chat-interface";

export type AttachmentType = {
  file_name: string;
  content?: string; // base64 for non-text files, normal text for text files 
  file_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'text' | 'pdf';
};

export type IAttachmentCardProps = {
  attachment: NonNullable<UIMessage['attachments']>[number]
  className?: string;
};

export const AttachmentCard: FunctionComponent<IAttachmentCardProps> = ({
  attachment,
  className
}) => {
  const { file_name, content, file_type } = attachment;

  const handleDownload = () => {
    if (!content) {
      console.warn('No content available for download');
      return;
    }

    try {
      if (file_type === 'text') {
        // Create blob from text content
        const blob = new Blob([content], { type: 'text/plain' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Convert base64 to blob
        const byteCharacters = atob(content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: file_type });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const getFileIcon = () => {
    if (file_type.startsWith('image/')) {
      return null;
    } else if (file_type === 'pdf') {
      return <FileText className="w-4 h-4" />;
    } else {
      return <File className="w-4 h-4" />;
    }
  };

  const renderPreview = () => {
    if (file_type.startsWith('image/') && content) {
      return (
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border bg-white">
          <img
            src={`data:${file_type};base64,${content}`}
            alt={file_name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    return null;
  };

  const getIconBackground = () => {
    if (file_type === 'pdf') {
      return 'bg-red-50 text-red-600 border-red-200';
    } else if (file_type === 'text') {
      return 'bg-blue-50 text-blue-600 border-blue-200';
    }
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  return (
    <div
      className={`group relative w-[210px] border border-gray-200 rounded-md inline-flex items-center gap-3 bg-white hover:border-gray-300 hover:bg-gray-50 px-4 py-3 text-sm transition-colors duration-150 cursor-pointer ${className}`}
      onClick={handleDownload}
      title={`Download ${file_name}`}
    >
      {renderPreview()}
      {!file_type.startsWith('image/') && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${getIconBackground()}`}>
          {getFileIcon()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="block truncate font-medium text-gray-900" title={file_name}>
          {file_name}
        </span>
        <span className="block truncate text-xs text-gray-500 mt-0.5 capitalize">
          {file_type === 'pdf' ? 'PDF Document' :
            file_type === 'text' ? 'Text File' :
              file_type.startsWith('image/') ? 'Image' :
                'File'}
        </span>
      </div>
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Download className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
};
