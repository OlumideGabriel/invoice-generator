import React, { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  message: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  delay?: number;
  hideDelay?: number;
  disabled?: boolean;
  className?: string;
  arrowClassName?: string;
  maxWidth?: string;
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  offset?: number;
  zIndex?: number;
  animation?: 'fade' | 'scale' | 'slide' | 'none';
  theme?: 'dark' | 'light' | 'custom';
  interactive?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  message,
  children,
  position = 'bottom',
  delay = 500,
  hideDelay = 200,
  disabled = false,
  className = '',
  arrowClassName = '',
  maxWidth = 'max-w-xs',
  trigger = 'hover',
  visible,
  onVisibilityChange,
  offset = 8,
  zIndex = 50,
  animation = 'scale',
  theme = 'dark',
  interactive = false
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isClicked, setIsClicked] = useState(false);

  // Use controlled or uncontrolled visibility
  const isVisible = visible !== undefined ? visible : internalVisible;

  const updateVisibility = useCallback((newVisible: boolean) => {
    if (visible === undefined) {
      setInternalVisible(newVisible);
    }
    onVisibilityChange?.(newVisible);
  }, [visible, onVisibilityChange]);

  const showTooltip = useCallback(() => {
    if (disabled || (trigger === 'manual' && visible === undefined)) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }

    showTimeoutRef.current = setTimeout(() => {
      updateVisibility(true);
    }, delay);
  }, [disabled, delay, trigger, visible, updateVisibility]);

  const hideTooltip = useCallback(() => {
    if (trigger === 'manual' && visible === undefined) return;

    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      updateVisibility(false);
      if (trigger === 'click') {
        setIsClicked(false);
      }
    }, hideDelay);
  }, [hideDelay, trigger, visible, updateVisibility]);

  const handleClick = useCallback(() => {
    if (trigger !== 'click') return;

    if (isClicked) {
      hideTooltip();
    } else {
      setIsClicked(true);
      showTooltip();
    }
  }, [trigger, isClicked, showTooltip, hideTooltip]);

  const handleMouseEnter = useCallback(() => {
    if (trigger === 'hover' || (interactive && isVisible)) {
      showTooltip();
    }
  }, [trigger, interactive, isVisible, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    if (trigger === 'hover' || (interactive && !isClicked)) {
      hideTooltip();
    }
  }, [trigger, interactive, isClicked, hideTooltip]);

  const handleFocus = useCallback(() => {
    if (trigger === 'focus' || trigger === 'hover') {
      showTooltip();
    }
  }, [trigger, showTooltip]);

  const handleBlur = useCallback(() => {
    if (trigger === 'focus' || (trigger === 'hover' && !isClicked)) {
      hideTooltip();
    }
  }, [trigger, isClicked, hideTooltip]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Position and arrow configurations
  const getPositionClasses = () => {
    const offsetClass = `${offset}px`;

    switch (position) {
      case 'top':
        return {
          tooltip: `bottom-full left-1/2 transform -translate-x-1/2`,
          arrow: '-bottom-1 left-1/2 transform -translate-x-1/2',
          margin: `mb-${offset === 8 ? '2' : '1'}`
        };
      case 'bottom':
      case 'center':
        return {
          tooltip: `top-full left-1/2 transform -translate-x-1/2`,
          arrow: '-top-1 left-1/2 transform -translate-x-1/2',
          margin: `mt-${offset === 8 ? '2' : '1'}`
        };
      case 'left':
        return {
          tooltip: `right-full top-1/2 transform -translate-y-1/2`,
          arrow: '-right-1 top-1/2 transform -translate-y-1/2',
          margin: `mr-${offset === 8 ? '2' : '1'}`
        };
      case 'right':
        return {
          tooltip: `left-full top-1/2 transform -translate-y-1/2`,
          arrow: '-left-1 top-1/2 transform -translate-y-1/2',
          margin: `ml-${offset === 8 ? '2' : '1'}`
        };
      default:
        return {
          tooltip: `top-full left-1/2 transform -translate-x-1/2`,
          arrow: '-top-1 left-1/2 transform -translate-x-1/2',
          margin: `mt-${offset === 8 ? '2' : '1'}`
        };
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          tooltip: 'bg-white text-gray-800 border border-gray-200 shadow-lg',
          arrow: 'bg-white border-gray-200'
        };
      case 'dark':
        return {
          tooltip: 'bg-gray-900 text-white shadow-xl',
          arrow: 'bg-gray-900'
        };
      case 'custom':
        return {
          tooltip: '',
          arrow: ''
        };
      default:
        return {
          tooltip: 'bg-gray-900 text-white shadow-xl',
          arrow: 'bg-gray-900'
        };
    }
  };

  const getAnimationClasses = () => {
    const base = 'transition-all duration-200 ease-out';

    switch (animation) {
      case 'fade':
        return {
          base,
          visible: 'opacity-100',
          hidden: 'opacity-0'
        };
      case 'scale':
        return {
          base,
          visible: 'opacity-100 scale-100',
          hidden: 'opacity-0 scale-95'
        };
      case 'slide':
        return {
          base,
          visible: 'opacity-100 translate-y-0',
          hidden: 'opacity-0 translate-y-1'
        };
      case 'none':
        return {
          base: '',
          visible: 'opacity-100',
          hidden: 'opacity-0'
        };
      default:
        return {
          base,
          visible: 'opacity-100 scale-100',
          hidden: 'opacity-0 scale-95'
        };
    }
  };

  if (!message.trim()) {
    return <>{children}</>;
  }

  const positionClasses = getPositionClasses();
  const themeClasses = getThemeClasses();
  const animationClasses = getAnimationClasses();

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div
        role={trigger === 'click' ? "button" : undefined}
        aria-describedby={isVisible ? "tooltip" : undefined}
        aria-expanded={trigger === 'click' ? isVisible : undefined}
        className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </div>

      {/* Tooltip bubble */}
      <div
        id="tooltip"
        role="tooltip"
        className={`
          absolute ${positionClasses.tooltip} ${positionClasses.margin}
          w-max ${maxWidth} px-3 py-2
          ${themeClasses.tooltip}
          text-sm rounded-lg
          ${animationClasses.base}
          ${interactive ? 'pointer-events-auto' : 'pointer-events-none'} select-none
          ${isVisible ? animationClasses.visible : animationClasses.hidden}
          ${className}
        `}
        style={{
          willChange: isVisible ? 'transform, opacity' : 'auto',
          zIndex: zIndex
        }}
        onMouseEnter={interactive ? handleMouseEnter : undefined}
        onMouseLeave={interactive ? handleMouseLeave : undefined}
      >
        {message}
        {/* Arrow */}
        <div
          className={`
            absolute ${positionClasses.arrow}
            w-2 h-2 ${themeClasses.arrow} rotate-45
            ${theme === 'light' ? 'border-t border-l' : ''}
            ${arrowClassName}
          `}
        />
      </div>
    </div>
  );
};


export default Tooltip;