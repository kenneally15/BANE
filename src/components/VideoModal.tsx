import React from 'react';
import styles from './VideoModal.module.css';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  timestamp: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, timestamp }) => {
  if (!isOpen) return null;

  // Convert timestamp to seconds for video seeking
  const parseTimestamp = (timestamp: string): number => {
    const match = timestamp.match(/(\d{2})h(\d{2})m(\d{2})s/);
    if (!match) return 0;
    const [_, hours, minutes, seconds] = match;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  };

  const handleVideoLoad = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    const seekTime = parseTimestamp(timestamp);
    video.currentTime = seekTime;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <video
          className={styles.video}
          controls
          onLoadedData={handleVideoLoad}
          src="/RealEye-heatmap-recording.mp4"
        />
      </div>
    </div>
  );
};

export default VideoModal; 