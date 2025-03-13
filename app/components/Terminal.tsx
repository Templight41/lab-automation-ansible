import { useState } from 'react';
import { Xterm } from 'xterm-react';

export default function Terminal() {
    const [Terminal, setTerminal] = useState<any>(null);
    const [input, setInput] = useState('');

    const onTermInit = (term: any) => {
        setTerminal(term);
        term.reset();
        term.write('Welcome to the WebSocket Terminal\r\n$ ');
    };

    const onTermDispose = (term: any) => {
        setTerminal(null);
    };

    const handleData = (data: any) => {
        if (Terminal) {
          const code = data.charCodeAt(0);
          // If the user hits empty and there is something typed echo it.
          if (code === 13 && input.length > 0) {
            Terminal.write("\r\n$ ");
            setInput('');
          } else if (code < 32 || code === 127) {
            console.log('Control Key', code);
            // Disable control Keys such as arrow keys
            return;
          } else {
            // Add general key press characters to the terminal
            Terminal.write(data);
            setInput(input + data);
          }
        }
      };


    return <Xterm onInit={onTermInit} onDispose={onTermDispose} onData={handleData} />;
}
