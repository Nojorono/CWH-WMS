import React from "react";
import type { StatusMap, BadgeColor } from "../constants/statusMaps";
import Badge from "../components/ui/badge/Badge"; // pastikan path sesuai project kamu

interface StatusBadgeProps {
  status: string;
  colorMap: StatusMap;
  variant?: "light" | "solid";
  size?: "sm" | "md";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  colorMap,
  variant = "solid",
  size = "md",
}) => {
  const normalizedStatus = status?.toUpperCase();

  // Pastikan fallback aman (tipe sesuai BadgeColor)
  const color: BadgeColor = colorMap[normalizedStatus] ?? "grey";

  return (
    <Badge variant={variant} color={color} size={size}>
      {normalizedStatus || "UNKNOWN"}
    </Badge>
  );
};

export default StatusBadge;
