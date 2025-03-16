'use client';

import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useState } from "react";

export default function Editor() {
    const [yamlContent, setYamlContent] = useState('');

    const handleEditorChange = (value: string | undefined) => {
        setYamlContent(value || '');
    };

    return (
        <MonacoEditor
            height="400px"
            width="100%"
            language="yaml"
            theme="vs-dark"
            value={yamlContent}
            onChange={handleEditorChange}
            options={{
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 14,
                wordWrap: 'on'
            }}
        />
    );
}