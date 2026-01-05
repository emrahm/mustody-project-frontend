export interface Badge {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className = '', children }: Badge) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
