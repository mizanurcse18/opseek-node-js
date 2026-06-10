import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';

interface SecureImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function SecureImage({ src, alt, className, fallback }: SecureImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setObjectUrl(null);
      setError(false);
      setIsLoading(false);
      return;
    }

    // A. Local blobs (from file inputs) or Data URIs do not need server fetching
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setObjectUrl(src);
      setError(false);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(false);

    // B. Fetch secure backend files with Bearer Authorization header automatically injected by apiClient
    apiClient.get(src, { responseType: 'blob' })
      .then((response: any) => {
        if (!isMounted) return;

        // Resolve response data correctly based on interceptor outcomes
        const blob = response instanceof Blob ? response : (response.data instanceof Blob ? response.data : null);
        
        if (blob) {
          const url = URL.createObjectURL(blob);
          setObjectUrl(url);
          setError(false);
        } else {
          console.error('[SecureImage] Response did not contain a valid Blob object.');
          setError(true);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[SecureImage] Failed to load protected resource:', src, err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
      });

    // C. Clean up memory allocations on component unmount or src change
    return () => {
      isMounted = false;
      if (objectUrl && !src.startsWith('blob:') && !src.startsWith('data:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !objectUrl) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-3 text-[10px] font-bold text-center">
        <span>No Preview Available</span>
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} />;
}
