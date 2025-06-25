import { FunctionComponent } from "react";
import { UIMessage } from "./chat-interface";

export type IThoughtMessageProps = {
  message: UIMessage['message'];
};

export const ThoughtMessage: FunctionComponent<IThoughtMessageProps> = ({ message }) => {
  return (
    <div className="flex flex-col gap-3 min-w-0 mb-4">
      <div className="text-[16px] whitespace-pre-wrap leading-relaxed text-left break-words text-neutral-500 dark:text-neutral-400 border-l-2 pl-2">
        {message.thought}
      </div>
    </div>
  )
}