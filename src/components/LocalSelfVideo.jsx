import React, { useEffect, useRef } from 'react';

const LocalSelfVideo = ({ stream, className, style }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !stream) return;

        video.srcObject = stream;

        const handleLoadedMetadata = () => {
            video.play().catch(() => {
                // Autoplay errors are common and benign in this context if muted
            });
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.pause();
            video.srcObject = null;
        };
    }, [stream]);

    return (
        <video
            ref={videoRef}
            className={className}
            autoPlay
            muted
            playsInline
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'rotateY(180deg)',
                background: '#000',
                ...style
            }}
        />
    );
};

export default LocalSelfVideo;
