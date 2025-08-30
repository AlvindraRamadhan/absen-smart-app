"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CardProps } from "@/types/attendance";

const cardVariants = {
  default: "bg-white/5 border-white/10",
  glass: "glass",
  gradient:
    "bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-cyan-500/20",
};

export function Card({
  children,
  className,
  title,
  description,
  variant = "glass",
  ...props
}: CardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl p-6 backdrop-blur-sm transition-all duration-300",
        "border hover:border-white/20 hover:transform hover:scale-[1.02]",
        "shadow-lg hover:shadow-xl",
        cardVariants[variant],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <motion.h3
              className="text-xl font-semibold text-white mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h3>
          )}
          {description && (
            <motion.p
              className="text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {description}
            </motion.p>
          )}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: title || description ? 0.3 : 0.1 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-semibold text-white mb-2", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-gray-400 text-sm", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 pt-4 border-t border-white/10", className)}
      {...props}
    >
      {children}
    </div>
  );
}
