"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import '@xterm/xterm/css/xterm.css';

interface XTermComponentProps {
  onData: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
}

export interface XTermComponentRef {
  write: (data: string) => void;
  clear: () => void;
  fit: () => void;
  focus: () => void;
}

const XTermComponent = forwardRef<XTermComponentRef, XTermComponentProps>(
  ({ onData, onResize }, ref) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useEffect(() => {
      if (!terminalRef.current) return;

      const terminal = new XTerm({
        fontSize: 14,
        fontFamily: '"Fira Code", "Courier New", monospace',
        theme: {
          background: '#0a0a0f',
          foreground: '#00ff88',
          cursor: '#00ff88',
          selectionBackground: 'rgba(0, 255, 136, 0.3)',
          black: '#000000',
          red: '#ff3366',
          green: '#00ff88',
          yellow: '#ffaa00',
          blue: '#0099ff',
          magenta: '#ff00ff',
          cyan: '#00ffff',
          white: '#ffffff',
          brightBlack: '#333333',
          brightRed: '#ff6699',
          brightGreen: '#33ff99',
          brightYellow: '#ffcc33',
          brightBlue: '#33aaff',
          brightMagenta: '#ff33ff',
          brightCyan: '#33ffff',
          brightWhite: '#ffffff'
        },
        cursorBlink: true,
        rows: 24,
        cols: 80,
        allowTransparency: true,
        scrollback: 1000,
        disableStdin: false,
        convertEol: true
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      const searchAddon = new SearchAddon();

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      terminal.loadAddon(searchAddon);

      terminal.open(terminalRef.current);
      
      // Wait a bit for the terminal to be properly rendered, then fit
      setTimeout(() => {
        fitAddon.fit();
        onResize(terminal.cols, terminal.rows);
        terminal.focus();
      }, 100);

      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // Handle terminal input
      terminal.onData(onData);

      // Handle window resize with better debouncing
      let resizeTimeout: NodeJS.Timeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (fitAddonRef.current && xtermRef.current) {
            try {
              const oldCols = xtermRef.current.cols;
              const oldRows = xtermRef.current.rows;
              
              fitAddonRef.current.fit();
              
              // Only call onResize if dimensions actually changed
              if (xtermRef.current.cols !== oldCols || xtermRef.current.rows !== oldRows) {
                onResize(xtermRef.current.cols, xtermRef.current.rows);
              }
            } catch (error) {
              console.warn('Resize error:', error);
            }
          }
        }, 300); // Increased debounce time
      };

      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(resizeTimeout);
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };
    }, [onData, onResize]);

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
        if (fitAddonRef.current && xtermRef.current) {
          try {
            fitAddonRef.current.fit();
            return { cols: xtermRef.current.cols, rows: xtermRef.current.rows };
          } catch (error) {
            console.warn('Fit error:', error);
          }
        }
        return null;
      },
      focus: () => {
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      }
    }));

    return (
      <div 
        ref={terminalRef}
        className="w-full h-full"
        style={{ 
          minHeight: '400px',
          maxHeight: '100%',
          overflow: 'hidden',
          backgroundColor: '#0a0a0f'
        }}
      />
    );
  }
);

XTermComponent.displayName = 'XTermComponent';

export default XTermComponent;
