'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

export default function WebSocketDemo() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Initialize terminal
    if (terminalRef.current && !terminalInstance.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      });
      terminalInstance.current = term;
      term.open(terminalRef.current);
      term.write('Welcome to the WebSocket Terminal\r\n$ ');
    }

    // Initialize socket connection
    const socketInitializer = async () => {
      await fetch('/api/socket');

      const socketInstance = io({
        path: '/api/socket',
      });

      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket');
        socketInstance.emit('message', JSON.stringify({ lab: 'lab1', playbookID: '123' }));
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
        setIsConnected(false);
      });

      socketInstance.on('message', (data: string) => {
        console.log('Message received:', data.toString());
        if (terminalInstance.current) {
          terminalInstance.current.write(data.toString() + '\r\n ');
        }
        setMessages((prev) => [...prev, data]);
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    };

    socketInitializer();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
    };
  }, []);

  const sendMessage = (data: string) => {
    // console.log('Sending message:', data);
    // if (socket) {
    //   console.log('Sending message:', data.trim());
    //   socket.emit('message', JSON.stringify({ lab: 'lab1', playbookID: '123' }));
    // }
    fetch('/api/playbook', {
      method: 'PATCH',
      body: JSON.stringify({ id: '123', name: 'network', content: data }),
    });
  };

  const handleData = (data: string) => {
    if (terminalInstance.current) {
      const code = data.charCodeAt(0);
      if (code === 13 && input.length > 0) {
        terminalInstance.current.write("\r\n");
        sendMessage(input);
        setInput('');
        terminalInstance.current.write('$ ');
      } else if (code < 32 || code === 127) {
        console.log('Control Key', code);
        return;
      } else {
        terminalInstance.current.write(data);
        setInput(input + data);
      }
    }
  };

  return (
    <>
      <div className="App">
        <header className="App-header">
          <div
            ref={terminalRef}
            className="terminal-container"
            style={{
              width: '800px',
              height: '400px',
              backgroundColor: '#000',
              padding: '10px',
              borderRadius: '5px'
            }}
          />
        </header>
      </div>
      <div className="p-4 border rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">WebSocket Demo</h2>
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="mb-4 h-60 overflow-y-auto border rounded p-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-2 p-2 bg-white rounded shadow-sm">
              {msg}
            </div>
          ))
        )}
      </div>

      <div className="flex">
        <textarea
          // type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(message)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => sendMessage(message)}
          disabled={!isConnected || !message.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:bg-gray-300"
        >
          Send
        </button>
      </div>
    </div>
    </>
  )
} 