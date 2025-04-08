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
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, animationDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, animationDuration, shouldRender]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, animationDuration);
  };

  return { shouldRender, isClosing, handleClose };
};