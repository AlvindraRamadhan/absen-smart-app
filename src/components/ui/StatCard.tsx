"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  return (
    <motion.div whileHover={{ y: -5 }} className="h-full">
      <Card className="p-6 h-full">
        <div className="flex items-start justify-between">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-500">{title}</span>
            <span className="text-3xl font-bold text-gray-800">{value}</span>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        </div>
      </Card>
    </motion.div>
  );
};
