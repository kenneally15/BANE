import { useState, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import styles from './Landing.module.css';

interface UploadedFile {
  name: string;
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
        file: file
      });
      setError(null);
      console.log(file);
    } else {
      setError('Please select a JSON file');
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      
      const response = await fetch('http://127.0.0.1:8000/generate', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      // Navigate to results page after successful upload
      navigate('/results', { state: { data } });
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
            <h2>Upload Gameplay Log</h2>
            <div 
              className={`${styles.dropZone}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {uploadedFile ? (
                <div className={styles.uploadSuccess}>
                  <span className={styles.fileName}>
                    {uploadedFile.name}
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