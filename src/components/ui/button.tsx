"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary: "btn-primary",
  secondary: "bg-gray-600 hover:bg-gray-500 text-white",
  ghost: "bg-transparent hover:bg-white/10 text-white border border-white/20",
  glass: "btn-glass",
};

const sizeVariants = {
  sm: "py-2 px-4 text-sm rounded-lg",
  md: "py-3 px-6 text-base rounded-xl",
  lg: "py-4 px-8 text-lg rounded-2xl",
};

interface ButtonProps
  extends Omit<
    HTMLMotionProps<"button">,
    "onDrag" | "onDragEnd" | "onDragStart"
  > {
  variant?: "primary" | "secondary" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled = false,
      onClick,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        className={cn(
          "relative inline-flex items-center justify-center font-semibold transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500/20",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          buttonVariants[variant],
          sizeVariants[size],
          className
        )}
        disabled={disabled || isLoading}
        onClick={onClick}
        whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        {...props}
      >
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2 className="w-5 h-5 animate-spin" />
          </motion.div>
        )}

        <span
          className={cn(
            "flex items-center gap-2 transition-opacity duration-200",
            isLoading && "opacity-0"
          )}
        >
          {children}
        </span>

        {variant === "primary" && !disabled && !isLoading && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 opacity-0 transition-opacity duration-300"
            whileHover={{ opacity: 1 }}
          />
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
