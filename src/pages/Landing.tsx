import { useState, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import styles from "./Landing.module.css";

interface UploadedFile {
  name: string;
  file: File;
}

const Landing = () => {
  const [uploadedLogFile, setUploadedLogFile] = useState<UploadedFile | null>(null);
  const [uploadedGuidanceFile, setUploadedGuidanceFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleGuidanceDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleLogDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];

    if (file && file.type === "application/json") {
      setUploadedLogFile({
        name: file.name,
        file: file,
      });
      setLogError(null);
    } else {
      setLogError("Please select a JSON file");
    }
  };

  const handleGuidanceDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];

    if (file && file.type === "application/pdf") {
      setUploadedGuidanceFile({
        name: file.name,
        file: file,
      });
      setGuidanceError(null);
    } else {
      setGuidanceError("Please select a PDF file");
    }
  };

  const handleUpload = async () => {
    if (!uploadedLogFile) return;

    setIsUploading(true);
    setLogError(null);

    try {
      // First API call - convert JSON to natural language
      const fileContent = await uploadedLogFile.file.text();
      const jsonData = JSON.parse(fileContent);

      const response = await fetch("http://127.0.0.1:8000/json_to_nl_log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          log_data: jsonData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to convert log");
      }

      const nlLogData = await response.json();

      // Second API call - generate AI suggestions
      const newResponse = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          user_text: nlLogData.natural_language_log,
          system_prompt: "default",
        }),
      });

      if (!newResponse.ok) {
        throw new Error("Failed to generate suggestions");
      }

      const finalData = await newResponse.json();
      
      // Navigate to results page with data
      navigate('/results', { 
        state: { 
          eventLog: nlLogData.natural_language_log,
          aiFeedback: finalData.generated_text 
        } 
      });
      
    } catch (error) {
      console.error("Error in handleUpload:", error);
      setLogError(error instanceof Error ? error.message : "Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogDelete = () => {
    setUploadedLogFile(null);
    setLogError(null);
  };

  const handleGuidanceDelete = () => {
    setUploadedGuidanceFile(null);
    setGuidanceError(null);
  };

  const handleViewGuidance = async () => {
    if (!uploadedGuidanceFile) return;
    
    // Create a URL for the PDF file
    const fileURL = URL.createObjectURL(uploadedGuidanceFile.file);
    
    // Open the PDF in a new tab
    window.open(fileURL, '_blank');
  };

  return (
    <>
      <Header></Header>
      <div className={styles.container}>
        <div className={styles.uploadSection}>
          <div className={styles.card}>
            <h2>Instructor Guidance</h2>
            <div
              className={`${styles.dropZone}`}
              onDragOver={handleGuidanceDragOver}
              onDrop={handleGuidanceDrop}
            >
              {uploadedGuidanceFile ? (
                <div className={styles.uploadSuccess}>
                  <span className={styles.fileName}>{uploadedGuidanceFile.name}</span>
                  <div className={styles.buttonGroup}>
                    <button
                      className={styles.button}
                      onClick={handleViewGuidance}
                    >
                      View Guidance
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={handleGuidanceDelete}
                    >
                      Delete File
                    </button>
                  </div>
                  {guidanceError && <div className={styles.errorMessage}>{guidanceError}</div>}
                </div>
              ) : (
                <p>Drag & drop your instructor guidance PDF</p>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2>Upload Gameplay Log</h2>
            <div
              className={`${styles.dropZone}`}
              onDragOver={handleLogDragOver}
              onDrop={handleLogDrop}
            >
              {uploadedLogFile ? (
                <div className={styles.uploadSuccess}>
                  <span className={styles.fileName}>{uploadedLogFile.name}</span>
                  <button
                    className={styles.deleteButton}
                    onClick={handleLogDelete}
                  >
                    Delete File
                  </button>
                  {logError && <div className={styles.errorMessage}>{logError}</div>}
                </div>
              ) : (
                <p>Drag & drop your gameplay log</p>
              )}
            </div>
          </div>
        </div>

        {uploadedLogFile && (
          <div className={styles.sendSection}>
            <button
              className={styles.sendButton}
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Generate AI Suggestions"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Landing;
