"use client";

import React from "react";
import { motion } from "framer-motion";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface LayoutContainerProps {
  children: React.ReactNode;
  className?: string;
  currentPath?: string;
  showHeader?: boolean;
  fullWidth?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "px-4 py-4",
  md: "px-4 sm:px-6 lg:px-8 py-8",
  lg: "px-4 sm:px-6 lg:px-8 py-12",
  xl: "px-4 sm:px-6 lg:px-8 py-16",
};

export function LayoutContainer({
  children,
  className,
  currentPath = "/",
  showHeader = true,
  fullWidth = false,
  maxWidth = "7xl",
  padding = "md",
}: LayoutContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header currentPath={currentPath} />}

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "mx-auto",
          !fullWidth && maxWidthClasses[maxWidth],
          paddingClasses[padding],
          className
        )}
      >
        {children}
      </motion.main>
    </div>
  );
}

// Grid System Components
interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "sm" | "md" | "lg" | "xl";
}

const gapClasses = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-12",
};

export function Grid({ children, className, cols, gap = "md" }: GridProps) {
  const gridCols = cols
    ? {
        [`grid-cols-${cols.default}`]: true,
        [`sm:grid-cols-${cols.sm}`]: cols.sm,
        [`md:grid-cols-${cols.md}`]: cols.md,
        [`lg:grid-cols-${cols.lg}`]: cols.lg,
        [`xl:grid-cols-${cols.xl}`]: cols.xl,
      }
    : "grid-cols-1";

  return (
    <div className={cn("grid", gridCols, gapClasses[gap], className)}>
      {children}
    </div>
  );
}

// Flex utilities
interface FlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: "row" | "col" | "row-reverse" | "col-reverse";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  gap?: "sm" | "md" | "lg" | "xl";
}

export function Flex({
  children,
  className,
  direction = "row",
  align = "center",
  justify = "start",
  wrap = false,
  gap = "md",
}: FlexProps) {
  return (
    <div
      className={cn(
        "flex",
        `flex-${direction}`,
        `items-${align}`,
        `justify-${justify}`,
        wrap && "flex-wrap",
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
}

// Section Component
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: "white" | "gray" | "gradient" | "transparent";
  padding?: "sm" | "md" | "lg" | "xl";
  title?: string;
  description?: string;
}

const backgroundClasses = {
  white: "bg-white",
  gray: "bg-gray-50",
  gradient: "bg-gradient-to-br from-blue-50 to-indigo-100",
  transparent: "bg-transparent",
};

export function Section({
  children,
  className,
  background = "transparent",
  padding = "lg",
  title,
  description,
}: SectionProps) {
  return (
    <section
      className={cn(
        backgroundClasses[background],
        paddingClasses[padding],
        className
      )}
    >
      {(title || description) && (
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {title && (
            <h2 className="text-3xl font-light text-gray-800 mb-4">{title}</h2>
          )}
          {description && (
            <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
          )}
        </motion.div>
      )}
      {children}
    </section>
  );
}

// Responsive Container
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  breakpoint?: "sm" | "md" | "lg" | "xl";
}

export function ResponsiveContainer({
  children,
  className,
  breakpoint = "lg",
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4",
        {
          "sm:px-6": breakpoint === "sm",
          "sm:px-6 md:px-8": breakpoint === "md",
          "sm:px-6 lg:px-8": breakpoint === "lg",
          "sm:px-6 lg:px-8 xl:px-12": breakpoint === "xl",
        },
        className
      )}
    >
      {children}
    </div>
  );
}

// Sticky Container
interface StickyContainerProps {
  children: React.ReactNode;
  className?: string;
  top?: number;
  zIndex?: number;
}

export function StickyContainer({
  children,
  className,
  top = 0,
  zIndex = 40,
}: StickyContainerProps) {
  return (
    <div
      className={cn("sticky", className)}
      style={{
        top: `${top}px`,
        zIndex,
      }}
    >
      {children}
    </div>
  );
}

// Mobile First Responsive Utilities
export function useResponsive() {
  const [windowWidth, setWindowWidth] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    // Set initial width
    setWindowWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: windowWidth < 768,
    isTablet: windowWidth >= 768 && windowWidth < 1024,
    isDesktop: windowWidth >= 1024,
    windowWidth,
  };
}
