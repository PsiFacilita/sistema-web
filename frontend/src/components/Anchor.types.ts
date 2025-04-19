import React from "react";

export type AnchorProps = {
  href: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: "_self" | "_blank" | "_parent" | "_top";
  rel?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  title?: string;
};