import { useEffect, useState } from "react";

// Simple replacement for useWebContainer that returns null
// since Sandpack doesn't need a container instance
export function useWebContainer() {
    const [sandpackReady, setSandpackReady] = useState<boolean>(false);

    useEffect(() => {
        // Simulate initialization time
        const timer = setTimeout(() => {
            setSandpackReady(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Return null to maintain compatibility with existing code
    // The PreviewFrame will ignore this value when using Sandpack
    return sandpackReady ? {} : null;
}