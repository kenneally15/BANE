import { useState, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import styles from "./Landing.module.css";

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

    if (file && file.type === "application/json") {
      setUploadedFile({
        name: file.name,
        file: file,
      });
      setError(null);
    } else {
      setError("Please select a JSON file");
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // First API call - convert JSON to natural language
      const fileContent = await uploadedFile.file.text();
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
      console.log("Final data received:", finalData);
      
      // Try passing the data directly in the state object
      navigate('/results', { 
        state: { 
          eventLog: nlLogData.natural_language_log,
          aiFeedback: finalData.generated_text 
        } 
      });
      console.log("Navigation attempted");
      
    } catch (error) {
      console.error("Error in handleUpload:", error);
      setError(error instanceof Error ? error.message : "Failed to process file");
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
              onClick={() => navigate("/guidance")}
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
                  <span className={styles.fileName}>{uploadedFile.name}</span>
                  <button
                    className={styles.deleteButton}
                    onClick={handleDelete}
                  >
                    Delete File
                  </button>
                  {error && <div className={styles.errorMessage}>{error}</div>}
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
              {isUploading ? "Uploading..." : "Generate AI Suggestions"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Landing;
