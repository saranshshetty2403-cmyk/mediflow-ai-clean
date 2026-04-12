import { createContext, useContext, type SelectHTMLAttributes, forwardRef } from "react";

// Context to pass onValueChange and value down from Select → SelectTrigger
const SelectContext = createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

export function Select({
  children,
  onValueChange,
  value,
  defaultValue,
}: {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  value?: string;
  defaultValue?: string;
}) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
}

export const SelectTrigger = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { children?: React.ReactNode }
>(({ className = "", children, ...props }, ref) => {
  const { value, onValueChange } = useContext(SelectContext);
  return (
    <select
      ref={ref}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={`rounded-lg border border-[#2a2f45] bg-[#1a1d27] text-[#e8eaf0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377] cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return null;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}
