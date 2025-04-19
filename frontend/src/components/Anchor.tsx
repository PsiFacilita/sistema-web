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

  return (
    <a
      href={disabled ? "#" : href}
      onClick={handleClick}
      target={target}
      rel={computedRel}
      className={`${className} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      style={style}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {children}
    </a>
  );
};

export default Anchor;
