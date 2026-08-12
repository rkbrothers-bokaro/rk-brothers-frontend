const SIZE_CLASSES = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-9 w-9 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }) {
  return (
    <span
      role="status"
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
