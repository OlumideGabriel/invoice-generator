import React, { useState, useRef, useLayoutEffect } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    placement?: 'top' | 'bottom' | 'left' | 'right'; // Add this for compatibility
    disabled?: boolean; // Add disabled prop
    delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    placement, // Support both position and placement props
    disabled = false,
    delay = 200
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Use placement if provided, otherwise use position
    const tooltipPosition = placement || position;

    const updatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current || !isVisible) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const offset = 8;

        let top = 0;
        let left = 0;

        switch (tooltipPosition) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - offset;
                left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = triggerRect.bottom + offset;
                left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.left - tooltipRect.width - offset;
                break;
            case 'right':
                top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
                left = triggerRect.right + offset;
                break;
            default:
                top = triggerRect.top - tooltipRect.height - offset;
                left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
                break;
        }

        // Ensure tooltip doesn't go off-screen
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Adjust horizontal position if tooltip goes off-screen
        if (left + tooltipRect.width > viewport.width) {
            left = viewport.width - tooltipRect.width - 8;
        }
        if (left < 8) {
            left = 8;
        }

        // Adjust vertical position if tooltip goes off-screen
        if (top + tooltipRect.height > viewport.height) {
            top = viewport.height - tooltipRect.height - 8;
        }
        if (top < 8) {
            top = 8;
        }

        setCoords({ top, left });
    };

    useLayoutEffect(() => {
        if (isVisible) {
            updatePosition();
        }
    }, [isVisible, tooltipPosition]);

    const showTooltip = () => {
        // Don't show tooltip if disabled
        if (disabled) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    // Safe content check
    const safeContent = content?.trim() || '';

    if (!safeContent || disabled) {
        return <>{children}</>;
    }

    const getArrowClasses = () => {
        const baseClasses = "absolute w-2 h-2 bg-gray-900 transform rotate-45";
        switch (tooltipPosition) {
            case 'top':
                return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1`;
            case 'bottom':
                return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1`;
            case 'left':
                return `${baseClasses} left-full top-1/2 -translate-y-1/2 -ml-1`;
            case 'right':
                return `${baseClasses} right-full top-1/2 -translate-y-1/2 -mr-1`;
            default:
                return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1`;
        }
    };

    return (
        <>
            <div
                ref={triggerRef}
                className="relative inline-block"
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
            >
                {children}
            </div>

            {isVisible && safeContent && (
                <div
                    ref={tooltipRef}
                    className="fixed z-[9999] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none"
                    style={{
                        top: coords.top,
                        left: coords.left,
                    }}
                >
                    {safeContent}
                    <div className={getArrowClasses()} />
                </div>
            )}
        </>
    );
};

export default Tooltip;