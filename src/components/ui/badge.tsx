import { type HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "destructive" | "secondary";
}

const variantClasses: Record<string, string> = {
  default: "bg-[#0D7377] text-white",
  outline: "border border-[#2a2f45] text-[#e8eaf0]",
  destructive: "bg-[#e05a4e] text-white",
  secondary: "bg-[#22263a] text-[#8892a4]",
};

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
