import { useState, useEffect } from 'react';
import { UseModalAnimationProps } from './useModalAnimation.types';

export const useModalAnimation = ({
  isOpen,
  onClose,
  animationDuration = 300,
}: UseModalAnimationProps) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, animationDuration);
  };

  return { shouldRender, isClosing, handleClose };
};
