import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import RFB from '@novnc/novnc/core/rfb';

interface NoVNCProps {
  url: string;
  ticket?: string;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const NoVNC: React.FC<NoVNCProps> = ({ url, ticket }) => {
  const screenRef = useRef<HTMLDivElement | null>(null);
  const rfbRef = useRef<InstanceType<typeof RFB> | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const screenElement = screenRef.current;
    if (!screenElement) {
      console.error('NoVNC screen element not found');
      setStatus('error');
      setErrorMessage('Screen element not found.');
      return;
    }

    // Disconnect previous instance if URL or ticket changes
    if (rfbRef.current) {
      rfbRef.current.disconnect();
      rfbRef.current = null;
    }

    setStatus('connecting');
    setErrorMessage(null);

    try {
      console.log(`Connecting to noVNC at: ${url}`);

      const rfb = new RFB(screenElement, url, {
        credentials: ticket ? { password: ticket } : undefined,
        wsProtocols: ['binary', 'base64'],
      });

      const connectHandler = () => {
        console.log('noVNC connected successfully');
        setStatus('connected');
        setErrorMessage(null);
      };

      const disconnectHandler = (event: CustomEvent<any>) => {
        console.log('noVNC disconnected:', event?.detail);
        setStatus('disconnected');
        // Provide more specific error messages based on event.detail if possible
        setErrorMessage(event?.detail?.reason || 'Connection closed.');
        // Clean up to prevent potential memory leaks
        rfb.removeEventListener('connect', connectHandler);
        rfb.removeEventListener('disconnect', disconnectHandler);
        rfb.removeEventListener('credentialsrequired', credentialsHandler);
        rfbRef.current = null;
      };

      const credentialsHandler = () => {
        console.warn('noVNC credentials required, attempting to send ticket');
        if (ticket) {
          rfb.sendCredentials({ password: ticket });
        } else {
          console.error('Credentials required but no ticket provided.');
          setStatus('error');
          setErrorMessage('Authentication required, but no ticket was available.');
          rfb.disconnect();
        }
      };

      rfb.addEventListener('connect', connectHandler);
      rfb.addEventListener('disconnect', disconnectHandler);
      rfb.addEventListener('credentialsrequired', credentialsHandler);

      rfbRef.current = rfb;

    } catch (error: any) {
      console.error('Failed to create or connect RFB client:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to initialize VNC connection.');
    }

    // Cleanup function
    return () => {
      if (rfbRef.current) {
        console.log('Disconnecting noVNC on component unmount...');
        // Remove listeners before disconnecting
        rfbRef.current.removeEventListener('connect', connectHandler);
        rfbRef.current.removeEventListener('disconnect', disconnectHandler);
        rfbRef.current.removeEventListener('credentialsrequired', credentialsHandler);
        rfbRef.current.disconnect();
        rfbRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ticket]); // Rerun effect if url or ticket changes

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* VNC Screen */} 
      <div
        ref={screenRef}
        id="noVNC_screen"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1, // Ensure VNC screen is below overlays
        }}
      />

      {/* Status/Error Overlay */} 
      {(status === 'connecting' || status === 'disconnected' || status === 'error') && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          zIndex: 2, // Ensure overlay is above VNC screen
          textAlign: 'center',
          padding: '20px',
        }}>
          {status === 'connecting' && (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-300 mb-4"></div>
              <p>Connecting to VNC...</p>
            </>
          )}
          {(status === 'disconnected' || status === 'error') && (
            <>
              <p className="text-xl font-semibold mb-2">
                {status === 'disconnected' ? 'Disconnected' : 'Connection Error'}
              </p>
              <p className="text-sm">{errorMessage || 'An unknown error occurred.'}</p>
              {/* Optionally add a reconnect button here */}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NoVNC;

