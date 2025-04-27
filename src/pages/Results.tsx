import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Results.module.css";
import { LogEntry, parseEventLog } from "../utils/parseEventLog";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);

  // Get the data passed from Landing page
  const eventLog = location.state?.eventLog;
  const aiFeedback = location.state?.aiFeedback;
  
  // Parse the event log
  const logEntries = parseEventLog(eventLog);

  const handleTimestampClick = (entry: LogEntry) => {
    setSelectedEntry(entry);
    // TODO: Implement video seeking logic here
    console.log(`Seeking to timestamp: ${entry.videoTimestamp} seconds`);
  };

  useEffect(() => {
    // If no data was passed, redirect back to home
    if (!eventLog || !aiFeedback) {
      navigate("/");
    }
  }, [eventLog, aiFeedback, navigate]);

  const handleBack = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
          <button className={styles.button} onClick={handleBack}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Analysis Results</h1>
          <button className={styles.backButton} onClick={handleBack}>
            Back to Home
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.section}>
            <h2>Event Log</h2>
            <div className={styles.logContent}>
              {logEntries.map((entry, index) => (
                <div key={index} className={styles.logEntry}>
                  <button 
                    className={styles.timestamp}
                    onClick={() => handleTimestampClick(entry)}
                  >
                    {entry.timestamp}
                  </button>
                  <span className={styles.logText}>{entry.content}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2>AI Feedback</h2>
            <div className={styles.feedbackContent}>
              {aiFeedback}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Results;
