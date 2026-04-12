import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-lg border border-[#2a2f45] bg-[#0f1117] text-[#e8eaf0] placeholder-[#8892a4] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent transition-all ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
