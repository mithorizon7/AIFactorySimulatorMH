import React, { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface EducationalTooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  icon?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function EducationalTooltip({
  children,
  content,
  icon = <InfoIcon className="w-4 h-4 text-amber-400 ml-1" />,
  side = "right",
  align = "center",
}: EducationalTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center cursor-help">
            {children}
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align} 
          className="max-w-xs p-4 text-sm bg-gray-800 border-gray-700"
        >
          <div className="text-gray-200">
            {content}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ResourceTooltip({
  children,
  content,
  resourceType,
}: Omit<EducationalTooltipProps, "icon"> & { resourceType: "compute" | "data" | "algorithm" }) {
  // Colored icons based on resource type
  const iconColors = {
    compute: "text-blue-400",
    data: "text-green-400",
    algorithm: "text-purple-400"
  };

  return (
    <EducationalTooltip 
      content={content}
      icon={<InfoIcon className={`w-4 h-4 ${iconColors[resourceType]} ml-1`} />}
    >
      {children}
    </EducationalTooltip>
  );
}