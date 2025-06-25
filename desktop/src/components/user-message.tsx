import { useAuth } from "@/contexts/auth-context";
import { FunctionComponent } from "react";
import { UIMessage } from "./chat-interface";
import { DocumentCard } from "./document-card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export type IUserMessageProps = {
  message: UIMessage['message']
};

const cleanDisplayContent = (content: string) => {
  return content.replace(/<selected_context[^>]*>[\s\S]*?<\/selected_context>\s*/g, '').trim();
};

export const UserMessage: FunctionComponent<IUserMessageProps> = ({ message }) => {

  const { user } = useAuth();
  const longTextDocuments = message.metadata?.long_text_documents || [];

  return (
    <div className="flex items-start gap-3 min-w-0 user-message">
      <Avatar className="w-6 h-6 flex-shrink-0">
        <AvatarImage src={user?.picture} alt={user?.name} />
        <AvatarFallback className="text-xs">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        {/** Pasted documents */}
        {longTextDocuments.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {longTextDocuments.map((doc, index) => (
              <div key={`doc-${index}`} className="flex-shrink-0 w-64">
                <DocumentCard
                  content={doc.content}
                  title={doc.title}
                />
              </div>
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap leading-relaxed text-left break-words">
          {cleanDisplayContent(message.content)}
        </div>
      </div>
    </div>
  )
}