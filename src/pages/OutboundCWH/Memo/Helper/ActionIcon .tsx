interface ActionIconProps {
  icon: React.ElementType;
  enabled: boolean;
  color: string;
  disabledColor?: string;
  title: string;
  onClick: () => void;
}

export const ActionIcon = ({
  icon: Icon,
  enabled,
  color,
  disabledColor = "text-gray-400",
  title,
  onClick,
}: ActionIconProps) => (
  <Icon
    className={`size-5 transition ${
      enabled
        ? `${color} cursor-pointer hover:scale-110`
        : `${disabledColor} cursor-not-allowed`
    }`}
    title={title}
    onClick={enabled ? onClick : undefined}
    style={{ pointerEvents: enabled ? "auto" : "none" }}
  />
);
