import React from "react";
import { AnchorProps } from "./Anchor.types";

const Anchor: React.FC<AnchorProps> = ({
  href,
  onClick,
  target = "_self",
  rel,
  disabled = false,
  className = "",
  style = {},
  children,
  title,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    if (onClick) {
      onClick(event);
    }
  };

  const computedRel =
    target === "_blank" ? [rel, "noopener noreferrer"].filter(Boolean).join(" ") : rel;

  const baseStyles = disabled 
    ? "cursor-not-allowed opacity-50 pointer-events-none" 
    : "hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

  return (
    <a
      href={disabled ? "#" : href}
      onClick={handleClick}
      target={target}
      rel={computedRel}
      className={`${baseStyles} ${className}`}
      style={style}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      title={title}
    >
      {children}
    </a>
  );
};

export default Anchor;