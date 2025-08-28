import React, { useState, useEffect } from 'react';
import { 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop, 
  useIsMediumScreen, 
  useIsLargeScreen 
} from '../../hooks/useMediaQuery';

// Enhanced responsive breakpoint debugger - only shows in development
const ResponsiveDebugger = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isMediumScreen = useIsMediumScreen();
  const isLargeScreen = useIsLargeScreen();

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!enabled) return null;

  const getActiveBreakpoint = () => {
    if (isMobile) return 'XS (<640px)';
    if (isMediumScreen && !isMobile) return 'SM (640-767px)';
    if (isTablet && !isMediumScreen) return 'MD (768-1023px)';
    if (isDesktop && !isLargeScreen) return 'LG (1024-1279px)';
    if (isLargeScreen) return 'XL (≥1280px)';
    return 'Unknown';
  };

  const getBreakpointColor = () => {
    if (isMobile) return 'bg-red-500';
    if (isMediumScreen && !isMobile) return 'bg-orange-500';
    if (isTablet && !isMediumScreen) return 'bg-yellow-500';
    if (isDesktop && !isLargeScreen) return 'bg-green-500';
    if (isLargeScreen) return 'bg-blue-500';
    return 'bg-gray-500';
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 font-mono text-xs">
      {/* Compact View */}
      <div 
        className={`${getBreakpointColor()} text-white p-2 rounded cursor-pointer transition-all duration-200 hover:scale-105`}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Click to expand responsive debugger"
      >
        <div className="flex items-center space-x-2">
          <span>📱</span>
          <span>{getActiveBreakpoint()}</span>
          <span className="text-xs opacity-75">{dimensions.width}×{dimensions.height}</span>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px]">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Responsive Debug</h3>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Breakpoints */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Active Breakpoints:</div>
              <div className="space-y-1 text-xs">
                <div className={`flex justify-between p-1 rounded ${isMobile ? 'bg-red-100 text-red-800' : 'text-gray-500'}`}>
                  <span>Mobile (&lt;640px)</span>
                  <span>{isMobile ? '✓' : '✗'}</span>
                </div>
                <div className={`flex justify-between p-1 rounded ${isMediumScreen && !isMobile ? 'bg-orange-100 text-orange-800' : 'text-gray-500'}`}>
                  <span>Small (640-767px)</span>
                  <span>{isMediumScreen && !isMobile ? '✓' : '✗'}</span>
                </div>
                <div className={`flex justify-between p-1 rounded ${isTablet && !isMediumScreen ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500'}`}>
                  <span>Medium (768-1023px)</span>
                  <span>{isTablet && !isMediumScreen ? '✓' : '✗'}</span>
                </div>
                <div className={`flex justify-between p-1 rounded ${isDesktop && !isLargeScreen ? 'bg-green-100 text-green-800' : 'text-gray-500'}`}>
                  <span>Large (1024-1279px)</span>
                  <span>{isDesktop && !isLargeScreen ? '✓' : '✗'}</span>
                </div>
                <div className={`flex justify-between p-1 rounded ${isLargeScreen ? 'bg-blue-100 text-blue-800' : 'text-gray-500'}`}>
                  <span>XL (≥1280px)</span>
                  <span>{isLargeScreen ? '✓' : '✗'}</span>
                </div>
              </div>
            </div>

            {/* Device Info */}
            <div className="border-t pt-2 space-y-1 text-xs text-gray-600">
              <div><strong>Viewport:</strong> {dimensions.width} × {dimensions.height}px</div>
              <div><strong>Screen:</strong> {window.screen.width} × {window.screen.height}px</div>
              <div><strong>Device Pixel Ratio:</strong> {window.devicePixelRatio}x</div>
              <div><strong>Orientation:</strong> {dimensions.width > dimensions.height ? 'Landscape' : 'Portrait'}</div>
              <div><strong>User Agent:</strong> {navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
            </div>

            {/* Auth Form Test Cases */}
            <div className="border-t pt-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Auth Form Tests:</div>
              <div className="space-y-1 text-xs">
                <div className={`p-2 rounded ${isMobile ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="font-medium">Mobile Layout:</div>
                  <div className="text-gray-600">
                    • Single column form<br/>
                    • Compact spacing (p-4)<br/>
                    • Hidden progress text<br/>
                    • Touch-friendly targets (44px min)
                  </div>
                </div>
                <div className={`p-2 rounded ${isTablet && !isMobile ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="font-medium">Tablet Layout:</div>
                  <div className="text-gray-600">
                    • Medium spacing (p-6)<br/>
                    • Visible progress steps<br/>
                    • Two-column form fields<br/>
                    • Optimized touch targets
                  </div>
                </div>
                <div className={`p-2 rounded ${isDesktop ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="font-medium">Desktop Layout:</div>
                  <div className="text-gray-600">
                    • Full spacing (p-8)<br/>
                    • Feature showcase panel<br/>
                    • Hover interactions<br/>
                    • Maximum form width
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveDebugger;