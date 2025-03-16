'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useWebSocket } from '../context/WebSocketContext';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  { ssr: false } // This prevents the component from being rendered on the server
);


interface TerminalProps {
  playbookId?: string;
  height?: string;
}

interface TerminalSize {
  cols: number;
  rows: number;
}

export default function Terminal({ playbookId, height = '400px' }: TerminalProps) {
  const { socket, isConnected, sendMessage } = useWebSocket();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [terminalSize, setTerminalSize] = useState<TerminalSize>({ cols: 80, rows: 24 });
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const isInitializedRef = useRef(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to resize the terminal with debounce
  const resizeTerminal = useCallback(() => {
    if (terminalInstance.current && fitAddonRef.current) {
      try {
        // Fit the terminal to the container
        fitAddonRef.current.fit();
        
        // Get the new dimensions
        const newCols = terminalInstance.current.cols;
        const newRows = terminalInstance.current.rows;
        
        // Only update if dimensions have changed
        if (newCols !== terminalSize.cols || newRows !== terminalSize.rows) {
          const newSize = { cols: newCols, rows: newRows };
          setTerminalSize(newSize);
          
          // Send the new size to the backend with debounce
          if (isConnected) {
            // Clear any existing timeout
            if (resizeTimeoutRef.current) {
              clearTimeout(resizeTimeoutRef.current);
            }
            
            // Set a new timeout to debounce resize events
            resizeTimeoutRef.current = setTimeout(() => {
              sendMessage({
                type: 'resize',
                playbookID: playbookId,
                size: newSize
              });
            }, 300); // 300ms debounce
          }
        }
      } catch (error) {
        console.error('Error resizing terminal:', error);
      }
    }
  }, [isConnected, terminalSize]);

  // Initialize terminal
  useEffect(() => {
    if (terminalRef.current && !terminalInstance.current) {
      // Create fit addon
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      
      const term = new XTerminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1a1a1a',
          foreground: '#f0f0f0',
          cursor: '#f0f0f0',
          selectionBackground: '#333333',
        },
        allowTransparency: true,
      });
      
      // Load the fit addon
      term.loadAddon(fitAddon);
      
      // Set up keyboard input handling
      // term.onData((data) => {
      //   if (isConnected && socket) {
      //     sendMessage({
      //       type: 'command',
      //       playbookID: playbookId,
      //       command: data,
      //       isRawInput: true
      //     });
      //   }
      // });
      
      terminalInstance.current = term;
      term.open(terminalRef.current);
      setIsTerminalReady(true);
      
      // Initial fit
      setTimeout(() => {
        resizeTerminal();
      }, 100);
    }

    return () => {
      // Clean up resize timeout on unmount
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [resizeTerminal, isConnected, socket, sendMessage, playbookId]);

  // Setup resize observers
  useEffect(() => {
    // Setup resize observer
    if (terminalRef.current && !resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        resizeTerminal();
      });
      
      resizeObserverRef.current.observe(terminalRef.current);
    }

    // Handle window resize
    const handleWindowResize = () => {
      resizeTerminal();
    };
    
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [resizeTerminal]);

  // Send initial message only once when terminal is ready and connected
  useEffect(() => {
    if (socket && isConnected && isTerminalReady && !isInitializedRef.current) {
      // Get current terminal size
      const currentSize = terminalInstance.current && fitAddonRef.current ? 
        { 
          cols: terminalInstance.current.cols, 
          rows: terminalInstance.current.rows 
        } : 
        { cols: 80, rows: 24 };
        
      // Send initialization message with current size
      sendMessage({ 
        type: 'init',
        // lab: 'lab1', 
        // playbookID: playbookId,
        size: currentSize
      });
      
      // Mark as initialized
      isInitializedRef.current = true;
      console.log('Terminal initialized with size:', currentSize);
    }
  }, [socket, isConnected, isTerminalReady]);

  // Message handler effect
  useEffect(() => {
    if (socket) {
      const messageHandler = (data: string) => {
        try {
          const parsedData = typeof data === 'string' ? data : JSON.stringify(data);
          console.log('Terminal received:', parsedData);
          
          if (terminalInstance.current) {
            terminalInstance.current.write(parsedData);
          }
          
          setMessages((prev) => [...prev, parsedData]);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      };

      socket.on('message', messageHandler);

      return () => {
        socket.off('message', messageHandler);
      };
    }
  }, [socket]);

  // Reset initialization when socket connection changes
  useEffect(() => {
    if (!isConnected) {
      isInitializedRef.current = false;
    }
  }, [isConnected]);

  const handleSendMessage = (data: string) => {
    if (data.trim()) {
      if (terminalInstance.current) {
        // Echo the command to the terminal
        terminalInstance.current.write(`${data}\r\n`);
      }
      
      sendMessage({ 
        type: 'command',
        lab: 'lab1', 
        playbookID: playbookId, 
        command: data.trim()
      });
      
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="terminal-wrapper w-full">
        <div
          ref={terminalRef}
          className="terminal-container border border-gray-700 rounded-md overflow-hidden"
          style={{
            width: '100%',
            height: height,
            backgroundColor: '#1a1a1a',
          }}
        />
      </div>
      
      <div className="flex items-center gap-2 text-gray-300">
        <div 
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        ></div>
        <span>{isConnected ? `Connected` : 'Disconnected'}</span>
      </div>
    </div>
  );
}
