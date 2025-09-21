import { useMemo } from 'react';
import { Sandpack } from "@codesandbox/sandpack-react";
import { FileItem } from '../types';

interface PreviewFrameProps {
  files: FileItem[];
  webContainer?: unknown; // Keep for backward compatibility, but won't be used
}

export function PreviewFrame({ files }: PreviewFrameProps) {
  // Convert your FileItem[] structure to Sandpack format
  const sandpackFiles = useMemo(() => {
    const convertFiles = (fileItems: FileItem[], basePath: string = ""): Record<string, { code: string }> => {
      const result: Record<string, { code: string }> = {};
      
      fileItems.forEach(file => {
        const fullPath = basePath ? `${basePath}/${file.name}` : file.name;
        
        if (file.type === 'file') {
          // Convert file path to Sandpack format (no leading slash for most files)
          let sandpackPath = fullPath;
          
          // Special handling for root files
          if (!basePath) {
            sandpackPath = `/${file.name}`;
          } else {
            sandpackPath = `/${fullPath}`;
          }
          
          result[sandpackPath] = {
            code: file.content || '// File content will be here'
          };
        } else if (file.type === 'folder' && file.children) {
          // Recursively process folder contents
          const folderFiles = convertFiles(file.children, fullPath);
          Object.assign(result, folderFiles);
        }
      });
      
      return result;
    };

    const converted = convertFiles(files);
    
    // Ensure we have required files for React projects
    if (!converted['/package.json']) {
      converted['/package.json'] = {
        code: JSON.stringify({
          "name": "react-app",
          "version": "1.0.0",
          "main": "src/index.js",
          "dependencies": {
            "react": "^18.0.0",
            "react-dom": "^18.0.0"
          },
          "scripts": {
            "start": "react-scripts start",
            "build": "react-scripts build"
          }
        }, null, 2)
      };
    }

    // Ensure we have an entry point
    if (!converted['/src/index.js'] && !converted['/src/index.tsx'] && !converted['/src/App.js'] && !converted['/src/App.tsx']) {
      converted['/src/App.js'] = {
        code: `import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Welcome to your React App!</h1>
      <p>Your generated content will appear here.</p>
    </div>
  );
}`
      };
      
      // Add index.js to mount the App
      converted['/src/index.js'] = {
        code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`
      };
    }

    console.log('Sandpack files:', converted);
    return converted;
  }, [files]);

  // Show loading state if no files
  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="mb-2">Setting up preview...</p>
          <p className="text-sm">Generating your project files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 rounded-lg overflow-hidden">
      <Sandpack
        template="react"
        files={sandpackFiles}
        theme="dark"
        options={{
          showNavigator: false,
          showTabs: false,
          showLineNumbers: false,
          showInlineErrors: true,
          wrapContent: true,
          showRefreshButton: true,
          // Remove the problematic editor options
          layout: "preview", // This will show only the preview
        }}
        customSetup={{
          dependencies: {
            "react": "^18.0.0",
            "react-dom": "^18.0.0"
          }
        }}
      />
    </div>
  );
}