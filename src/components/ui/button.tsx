import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses: Record<string, string> = {
  default: "bg-[#0D7377] hover:bg-[#0a5c60] text-white",
  outline: "border border-[#2a2f45] hover:bg-[#22263a] text-[#e8eaf0]",
  ghost: "hover:bg-[#22263a] text-[#e8eaf0]",
  destructive: "bg-[#e05a4e] hover:bg-[#c04a3e] text-white",
};

const sizeClasses: Record<string, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
  icon: "p-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
