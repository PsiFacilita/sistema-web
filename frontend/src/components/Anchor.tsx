import React from "react";
import { AnchorProps } from "./Anchor.types";


type AnchorProps = {
  href: string; //define o destino do link
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void; //Função opcional que é chamada quando o link for clicado.
  target?: "_self" | "_blank" | "_parent" | "_top"; //self → Abre na mesma aba (padrão), blank → Abre em uma nova aba,parent → Abre na janela/página pai ,top → Abre na janela principal (caso esteja dentro de um iframe).
  rel?: string; // Define a relação entre o documento e o destino do link. Em links externos, pode ser usado para segurança, como "noopener noreferrer".
  disabled?: boolean; //Define se o link está desativado.
  className?: string; // Permite adicionar classes CSS para estilizar o link.
  style?: React.CSSProperties; //Permite adicionar estilos inline ao link.
  children: React.ReactNode; //Representa o conteúdo do link (pode ser um texto ou até ícones).
};

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
