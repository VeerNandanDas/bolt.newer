import React, { useEffect, useState, useMemo } from 'react';
import { FileItem } from '../types';

interface IFramePreviewProps {
  files: FileItem[];
}

export function IFramePreview({ files }: IFramePreviewProps) {
  const [iframeSrc, setIframeSrc] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Find the main HTML file (usually index.html or similar)
  const htmlFile = useMemo(() => {
    console.log('All files:', files);
    
    const findHtmlFile = (fileList: FileItem[]): FileItem | null => {
      for (const file of fileList) {
        console.log('Checking file:', file.name, file.type, 'has content:', !!file.content);
        
        if (file.type === 'file' && (file.name === 'index.html' || file.name.endsWith('.html'))) {
          console.log('Found HTML file:', file.name, 'Content length:', file.content?.length);
          return file;
        }
        if (file.type === 'folder' && file.children) {
          const found = findHtmlFile(file.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const result = findHtmlFile(files);
    setDebugInfo(`Found ${files.length} files. HTML file: ${result ? result.name : 'None'}`);
    return result;
  }, [files]);

  // Create a blob URL from the HTML content and related files
  useEffect(() => {
    if (!htmlFile || !htmlFile.content) {
      setIframeSrc('');
      return;
    }

    // Function to recursively get all files as a flat map
    const getAllFiles = (fileList: FileItem[], basePath = ''): Record<string, string> => {
      const fileMap: Record<string, string> = {};
      
      fileList.forEach(file => {
        const fullPath = basePath ? `${basePath}/${file.name}` : file.name;
        
        if (file.type === 'file' && file.content) {
          fileMap[fullPath] = file.content;
        } else if (file.type === 'folder' && file.children) {
          const childFiles = getAllFiles(file.children, fullPath);
          Object.assign(fileMap, childFiles);
        }
      });
      
      return fileMap;
    };

    const allFiles = getAllFiles(files);
    let htmlContent = htmlFile.content;

    // Simple approach: inline CSS and JS directly into HTML
    // This is a basic implementation - you might want to enhance it
    Object.entries(allFiles).forEach(([path, content]) => {
      if (path.endsWith('.css')) {
        // Inline CSS
        htmlContent = htmlContent.replace(
          new RegExp(`<link[^>]*href=["']${path}["'][^>]*>`, 'gi'),
          `<style>${content}</style>`
        );
      } else if (path.endsWith('.js') && !path.includes('node_modules')) {
        // Inline JS (be careful with this in production)
        htmlContent = htmlContent.replace(
          new RegExp(`<script[^>]*src=["']${path}["'][^>]*></script>`, 'gi'),
          `<script>${content}</script>`
        );
      }
    });

    // Create blob URL
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setIframeSrc(url);

    // Cleanup
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlFile, files]);

  if (!htmlFile) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">No HTML file found</div>
          <div className="text-sm mb-2">
            Create an index.html file to see the preview
          </div>
          <div className="text-xs bg-gray-700 p-2 rounded">
            Debug: {debugInfo}
          </div>
        </div>
      </div>
    );
  }

  if (!htmlFile.content) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">HTML file is empty</div>
          <div className="text-sm">
            The file {htmlFile.name} has no content
          </div>
        </div>
      </div>
    );
  }

  if (!iframeSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-gray-400">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        title="Website Preview"
      />
    </div>
  );
}