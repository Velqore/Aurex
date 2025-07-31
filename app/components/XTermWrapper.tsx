"use client";

import { useState, useEffect, forwardRef, useRef, useImperativeHandle } from "react";
import { Terminal, Loader } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamic import with SSR handling
const XTermComponent = dynamic(() => import('./XTermComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black/80 p-4 flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-8 h-8 text-green-400 mx-auto mb-2 animate-spin" />
        <p className="text-green-400 text-sm">Loading Terminal...</p>
      </div>
    </div>
  )
});

interface XTermWrapperProps {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  isConnected: boolean;
}

export interface XTermWrapperRef {
  write: (data: string) => void;
  clear: () => void;
  fit: () => void;
  focus: () => void;
}

const XTermWrapper = forwardRef<XTermWrapperRef, XTermWrapperProps>(
  ({ onData, onResize, isConnected }, ref) => {
    const [isMounted, setIsMounted] = useState(false);
    const xtermRef = useRef<any>(null);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useImperativeHandle(ref, () => ({
      write: (data: string) => {
        if (xtermRef.current) {
          xtermRef.current.write(data);
        }
      },
      clear: () => {
        if (xtermRef.current) {
          xtermRef.current.clear();
        }
      },
      fit: () => {
        if (xtermRef.current) {
          xtermRef.current.fit();
        }
      },
      focus: () => {
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      }
    }));

    if (!isMounted) {
      return (
        <div className="w-full h-full bg-black/80 p-4 flex items-center justify-center">
          <div className="text-center">
            <Terminal className="w-8 h-8 text-green-400 mx-auto mb-2 animate-pulse" />
            <p className="text-green-400 text-sm">Initializing Terminal...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full relative">
        <XTermComponent
          ref={xtermRef}
          onData={onData}
          onResize={onResize}
        />
        
        {!isConnected && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-green-400 text-sm">Connecting to terminal...</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

XTermWrapper.displayName = 'XTermWrapper';

export default XTermWrapper;
