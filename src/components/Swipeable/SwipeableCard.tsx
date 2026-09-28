import React, { useState, useRef } from 'react';
import { ArrowRightCircle, CheckCircle2, Trash2, Copy } from 'lucide-react';

interface SwipeableCardProps {
  children: React.ReactNode;
  rightActionText?: string;
  rightActionIcon?: React.ReactNode;
  rightActionBg?: string; // tailwind classes
  onSwipeRight?: () => void;
  leftActionText?: string;
  leftActionIcon?: React.ReactNode;
  leftActionBg?: string; // tailwind classes
  onSwipeLeft?: () => void;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  rightActionText = 'Facturer',
  rightActionIcon = <ArrowRightCircle className="w-4 h-4 text-white" />,
  rightActionBg = 'bg-slate-900',
  onSwipeRight,
  leftActionText = 'Supprimer',
  leftActionIcon = <Trash2 className="w-4 h-4 text-white" />,
  leftActionBg = 'bg-rose-600',
  onSwipeLeft,
  onClick,
  className = '',
  disabled = false,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isHorizontalDragRef = useRef<boolean | null>(null);

  const TRIGGER_THRESHOLD = 90;

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isHorizontalDragRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startXRef.current || !startYRef.current || disabled) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    if (isHorizontalDragRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        isHorizontalDragRef.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalDragRef.current) {
      // Prevent browser vertical scrolling while dragging horizontally
      if (e.cancelable) {
        e.preventDefault();
      }
      // Apply rubberband effect
      let clamped = deltaX;
      if (deltaX > 0 && !onSwipeRight) clamped = 0;
      if (deltaX < 0 && !onSwipeLeft) clamped = 0;
      const resistance = Math.abs(clamped) > TRIGGER_THRESHOLD ? 0.35 : 0.85;
      setOffsetX(clamped * resistance);
    }
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsDragging(false);

    if (offsetX > TRIGGER_THRESHOLD && onSwipeRight) {
      // Trigger Haptic feedback if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore
        }
      }
      onSwipeRight();
    } else if (offsetX < -TRIGGER_THRESHOLD && onSwipeLeft) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore
        }
      }
      onSwipeLeft();
    }

    // Reset offset
    setOffsetX(0);
    startXRef.current = null;
    startYRef.current = null;
    isHorizontalDragRef.current = null;
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isHorizontalDragRef.current = null;
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (startXRef.current === null) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaY = moveEvent.clientY - (startYRef.current || 0);

      if (isHorizontalDragRef.current === null) {
        if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
          isHorizontalDragRef.current = Math.abs(deltaX) > Math.abs(deltaY);
        }
      }

      if (isHorizontalDragRef.current) {
        let clamped = deltaX;
        if (deltaX > 0 && !onSwipeRight) clamped = 0;
        if (deltaX < 0 && !onSwipeLeft) clamped = 0;
        const resistance = Math.abs(clamped) > TRIGGER_THRESHOLD ? 0.35 : 0.85;
        setOffsetX(clamped * resistance);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);

      if (offsetX > TRIGGER_THRESHOLD && onSwipeRight) {
        onSwipeRight();
      } else if (offsetX < -TRIGGER_THRESHOLD && onSwipeLeft) {
        onSwipeLeft();
      }

      setOffsetX(0);
      startXRef.current = null;
      startYRef.current = null;
      isHorizontalDragRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only fire click if user didn't perform a horizontal drag
    if (Math.abs(offsetX) < 6 && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && onSwipeLeft) {
      e.preventDefault();
      onSwipeLeft();
    } else if (e.key === 'ArrowRight' && onSwipeRight) {
      e.preventDefault();
      onSwipeRight();
    }
  };

  const keyboardHint = [
    onClick ? 'Entrée pour ouvrir' : null,
    onSwipeRight ? `Flèche droite : ${rightActionText}` : null,
    onSwipeLeft ? `Suppr : ${leftActionText}` : null,
  ].filter(Boolean).join(', ');

  const isSwipingRight = offsetX > 15;
  const isSwipingLeft = offsetX < -15;
  const isPastRightThreshold = offsetX > TRIGGER_THRESHOLD;
  const isPastLeftThreshold = offsetX < -TRIGGER_THRESHOLD;

  return (
    <div className={`relative overflow-hidden rounded-lg select-none ${className}`}>
      {/* Background Action: Right Swipe (revealed on the left) */}
      {isSwipingRight && (
        <div
          className={`absolute inset-0 flex items-center px-4 rounded-lg text-white ${rightActionBg}`}
        >
          <div
            className={`flex items-center gap-2 transition-transform duration-100 ${
              isPastRightThreshold ? 'scale-105 font-bold' : 'opacity-90'
            }`}
          >
            {rightActionIcon}
            <span className="text-xs font-medium tracking-wide">
              {isPastRightThreshold ? 'Relâcher pour exécuter' : rightActionText}
            </span>
          </div>
        </div>
      )}

      {/* Background Action: Left Swipe (revealed on the right) */}
      {isSwipingLeft && (
        <div
          className={`absolute inset-0 flex items-center justify-end px-4 rounded-lg text-white ${leftActionBg}`}
        >
          <div
            className={`flex items-center gap-2 transition-transform duration-100 ${
              isPastLeftThreshold ? 'scale-105 font-bold' : 'opacity-90'
            }`}
          >
            <span className="text-xs font-medium tracking-wide">
              {isPastLeftThreshold ? 'Relâcher pour supprimer' : leftActionText}
            </span>
            {rightActionIcon}
          </div>
        </div>
      )}

      {/* Foreground Interactive Card */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        aria-keyshortcuts={keyboardHint || undefined}
        title={keyboardHint || undefined}
        className="w-full relative z-10 rounded-lg"
      >
        {children}
      </div>
    </div>
  );
};
