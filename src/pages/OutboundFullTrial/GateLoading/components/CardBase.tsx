import React from "react";

interface CardBaseProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

const CardBase: React.FC<CardBaseProps> = ({
  title,
  subtitle,
  right,
  children,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start p-4 border-b">
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>

      <div className="p-4">{children}</div>
    </div>
  );
};

export default CardBase;
