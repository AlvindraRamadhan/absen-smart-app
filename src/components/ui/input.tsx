"use client";

import React, { useState, forwardRef } from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MotionInputProps
  extends Omit<
    HTMLMotionProps<"input">,
    "onDrag" | "onDragEnd" | "onDragStart"
  > {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, MotionInputProps>(
  (
    {
      label,
      placeholder,
      type = "text",
      value,
      onChange,
      error,
      required = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className={cn("relative", className)}>
        {label && (
          <motion.label
            className={cn(
              "block text-sm font-medium mb-2 transition-colors duration-200",
              error ? "text-red-400" : "text-gray-300",
              required && 'after:content-["*"] after:ml-1 after:text-red-400'
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          <motion.input
            ref={ref}
            type={isPassword && showPassword ? "text" : type}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={cn(
              "input-glass w-full",
              error &&
                "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              disabled && "opacity-50 cursor-not-allowed",
              isPassword && "pr-12"
            )}
            placeholder={placeholder}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: label ? 0.1 : 0 }}
            whileFocus={{
              scale: 1.01,
              transition: { duration: 0.2 },
            }}
            {...props}
          />

          {/* Floating Label Effect */}
          <AnimatePresence>
            {placeholder && (isFocused || value) && (
              <motion.div
                className="absolute left-4 -top-2 px-2 bg-dark-300 text-xs text-cyan-400"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {placeholder}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Toggle */}
          {isPassword && (
            <motion.button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
              onClick={() => setShowPassword(!showPassword)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </motion.button>
          )}

          {/* Focus Ring Animation */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-cyan-500 -z-10"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.3, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mt-2 flex items-center gap-2 text-sm text-red-400"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = "Input";

interface MotionTextareaProps
  extends Omit<
    HTMLMotionProps<"textarea">,
    "onDrag" | "onDragEnd" | "onDragStart"
  > {
  label?: string;
  error?: string;
  required?: boolean;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, MotionTextareaProps>(
  (
    {
      label,
      placeholder,
      value,
      onChange,
      error,
      required = false,
      disabled = false,
      className,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className={cn("relative", className)}>
        {label && (
          <motion.label
            className={cn(
              "block text-sm font-medium mb-2 transition-colors duration-200",
              error ? "text-red-400" : "text-gray-300",
              required && 'after:content-["*"] after:ml-1 after:text-red-400'
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {label}
          </motion.label>
        )}

        <div className="relative">
          <motion.textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            rows={rows}
            className={cn(
              "input-glass w-full resize-none",
              error &&
                "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            placeholder={placeholder}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: label ? 0.1 : 0 }}
            whileFocus={{
              scale: 1.01,
              transition: { duration: 0.2 },
            }}
            {...props}
          />

          {/* Focus Ring Animation */}
          <AnimatePresence>
            {isFocused && !error && (
              <motion.div
                className="absolute inset-0 rounded-lg border-2 border-cyan-500 -z-10"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.3, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mt-2 flex items-center gap-2 text-sm text-red-400"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
