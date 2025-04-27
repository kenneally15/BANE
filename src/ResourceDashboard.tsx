import { useState, DragEvent } from 'react';
import styles from './ResourceDashboard.module.css';

interface UploadedFile {
  name: string;
  size: number;
}

const ResourceDashboard = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    
    if (file && file.type === 'application/json') {
      // Store file metadata
      setUploadedFile({
        name: file.name,
        size: file.size
      });

      // TODO: Send file to server
      // const formData = new FormData();
      // formData.append('file', file);
      // await fetch('/api/upload', {
      //   method: 'POST',
      //   body: formData
      // });
    }
  };

  const handleDelete = () => {
    setUploadedFile(null);
    // TODO: Notify server to delete the file
    // await fetch('/api/delete', {
    //   method: 'DELETE',
    //   body: JSON.stringify({ fileName: uploadedFile.name })
    // });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.leftColumn}>
        <div className={styles.section}>
          <h2>Instructor Guidance</h2>
          <div className={styles.sectionContent}>
            This section will contain pre-populated guidance
          </div>
        </div>
        
        <div className={styles.section}>
          <h2>Gameplay (JSON)</h2>
          <div 
            className={`${styles.sectionContent} ${styles.dropZone}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <div className={styles.uploadSuccess}>
                <span className={styles.fileName}>
                  {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
                </span>
                <button 
                  className={styles.deleteButton}
                  onClick={handleDelete}
                >
                  Delete File
                </button>
              </div>
            ) : (
              "Drag and drop your JSON event log file here"
            )}
          </div>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <div className={`${styles.section} ${styles.modelFeedback}`}>
          <h2>Model Feedback</h2>
          <div className={styles.sectionContent}>
            This section will contain the model output, where the model identifies points in gameplay JSON that were incorrect
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDashboard;
