import React from 'react';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  overlayClassName?: string;
  contentClassName?: string;
  zIndex?: string;
  alignment?: 'center' | 'start';
  closeOnOverlayClick?: boolean;
}

export function ModalOverlay({
  isOpen,
  onClose,
  children,
  overlayClassName = '',
  contentClassName = '',
  zIndex = 'z-50',
  alignment = 'start',
  closeOnOverlayClick = true
}: ModalOverlayProps) {
  if (!isOpen) return null;

  const alignmentClass = alignment === 'center' 
    ? 'items-center justify-center' 
    : 'items-start justify-center';

  const defaultOverlayClass = `fixed inset-0 bg-black/20 backdrop-blur-sm flex ${alignmentClass} ${zIndex} ${overlayClassName}`;
  const finalOverlayClass =  defaultOverlayClass;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={finalOverlayClass}
      onClick={handleOverlayClick}
    >
      <div 
        className={contentClassName}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}