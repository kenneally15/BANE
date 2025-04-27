import { useState, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import styles from './Landing.module.css';

interface UploadedFile {
  name: string;
  size: number;
  file: File;
}

const Landing = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    
    if (file && file.type === 'application/json') {
      setUploadedFile({
        name: file.name,
        size: file.size,
        file: file
      });
      setError(null);
    } else {
      setError('Please select a JSON file');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setUploadedFile({
        name: file.name,
        size: file.size,
        file: file
      });
      setError(null);
    } else {
      setError('Please select a JSON file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      // Navigate to results page after successful upload
      navigate('/results');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    setUploadedFile(null);
    setError(null);
  };

  return (
    <>
      <Header></Header>
      <div className={styles.container}>
        <div className={styles.uploadSection}>
          <div className={styles.card}>
            <h2>Instructor Guidance</h2>
            <p>View pre-populated guidance for instructors</p>
            <button 
              className={styles.button}
              onClick={() => navigate('/guidance')}
            >
              View Guidance
            </button>
          </div>

          <div className={styles.card}>
            <h2>Upload Gameplay log</h2>
            <div 
              className={`${styles.dropZone}`}
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
                  {error && (
                    <div className={styles.errorMessage}>
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p>Drag & drop your gameplay log</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {uploadedFile && (
          <div className={styles.sendSection}>
            <button 
              className={styles.sendButton}
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Send to Server'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Landing; 