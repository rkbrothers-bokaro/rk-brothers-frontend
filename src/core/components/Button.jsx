import { forwardRef } from "react";
import Spinner from "./Spinner";

const VARIANT_CLASSES = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600 disabled:bg-blue-300",
  secondary:
    "bg-white text-zinc-800 border border-zinc-300 hover:bg-zinc-50 focus-visible:outline-zinc-400 disabled:text-zinc-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 disabled:bg-red-300",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-400 disabled:text-zinc-400",
};

const SIZE_CLASSES = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-5 py-2.5 gap-2",
};

const SPINNER_SIZE = { sm: "sm", md: "sm", lg: "md" };
const SPINNER_COLOR = { primary: "text-white", danger: "text-white", secondary: "text-zinc-500", ghost: "text-zinc-500" };

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    className = "",
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading && <Spinner size={SPINNER_SIZE[size]} className={SPINNER_COLOR[variant]} />}
      {children}
    </button>
  );
});

export default Button;
