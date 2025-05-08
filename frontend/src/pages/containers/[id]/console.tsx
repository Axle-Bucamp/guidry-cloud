import React, {
  useEffect,
  useRef,
} from 'react';

import RFB
  from '/home/kitty/Documents/guidry-cloud/noVNC/lib/rfb.js'; // Correct path for RFB class

interface NoVNCProps {
  url: string;
  ticket?: string;
}

const NoVNC: React.FC<NoVNCProps> = ({ url, ticket }) => {
  const screenRef = useRef<HTMLDivElement | null>(null);
  const rfbRef = useRef<InstanceType<typeof RFB> | null>(null);

  useEffect(() => {
    const screenElement = screenRef.current;
    if (!screenElement) {
      console.error('NoVNC screen element not found');
      return;
    }

    if (rfbRef.current) {
      rfbRef.current.disconnect();
      rfbRef.current = null;
    }

    try {
      console.log(`Connecting to noVNC at: ${url}`);

      const rfb = new RFB(screenElement, url, {
        credentials: ticket ? { password: ticket } : undefined,
        wsProtocols: ['binary', 'base64'],
      });

      rfb.addEventListener('connect', () => {
        console.log('noVNC connected successfully');
      });

      rfb.addEventListener('disconnect', (event : CustomEvent<any>) => {
        console.log('noVNC disconnected:', event?.detail);
      });

      rfb.addEventListener('credentialsrequired', () => {
        console.warn('noVNC credentials required, attempting to send ticket');
        if (ticket) {
          rfb.sendCredentials({ password: ticket });
        }
      });

      rfbRef.current = rfb;

    } catch (error) {
      console.error('Failed to create RFB client:', error);
    }

    return () => {
      if (rfbRef.current) {
        console.log('Disconnecting noVNC...');
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    };
  }, [url, ticket]);

  return (
    <div
      ref={screenRef}
      id="noVNC_screen"
      style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
    />
  );
};

export default NoVNC;
 