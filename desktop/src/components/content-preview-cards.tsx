import { ContentPreviewCard } from "./content-preview-card";

interface Document {
  id: string;
  content: string;
  title: string;
}

interface ContentPreviewCardsProps {
  documents: Document[];
  onViewDocument: (content: string) => void;
  onRemoveDocument: (id: string) => void;
}

export function ContentPreviewCards({ documents, onViewDocument, onRemoveDocument }: ContentPreviewCardsProps) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-3">
        {documents.map((doc) => (
          <ContentPreviewCard
            key={doc.id}
            id={doc.id}
            title={doc.title}
            content={doc.content}
            onView={() => onViewDocument(doc.content)}
            onRemove={() => onRemoveDocument(doc.id)}
          />
        ))}
      </div>
    </div>
  );
}