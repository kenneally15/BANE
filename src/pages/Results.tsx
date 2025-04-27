import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Results.module.css";
import { LogEntry, parseEventLog } from "../utils/parseEventLog";
import { parseFeedback, FeedbackSummary } from "../utils/parseFeedback";
import VideoModal from "../components/VideoModal";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState("");

  // Get the data passed from Landing page
  const eventLog = location.state?.eventLog;
  const aiFeedback = location.state?.aiFeedback;
  
  // Parse the event log and feedback
  const logEntries = parseEventLog(eventLog);
  const parsedFeedback: FeedbackSummary = parseFeedback(aiFeedback);

  const handleTimestampClick = (entry: LogEntry) => {
    setSelectedEntry(entry);
    // TODO: Implement video seeking logic here
    console.log(`Seeking to timestamp: ${entry.videoTimestamp} seconds`);
  };

  const handleFeedbackTimestampClick = (timestamp: string) => {
    setSelectedTimestamp(timestamp);
    setIsModalOpen(true);
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
              {parsedFeedback.events.map((event, index) => (
                <div key={index} className={styles.feedbackEvent}>
                  <div className={styles.eventHeader}>
                    <span 
                      className={styles.timestamp}
                      onClick={() => handleFeedbackTimestampClick(event.timestamp)}
                      style={{ cursor: 'pointer' }}
                    >
                      {event.timestamp}
                    </span>
                    <span className={styles.eventType}>{event.event}</span>
                  </div>
                  {event.evaluation && (
                    <div className={styles.evaluation}>
                      <strong>Evaluation:</strong> {event.evaluation}
                    </div>
                  )}
                  {event.rationale && (
                    <div className={styles.rationale}>
                      <strong>Rationale:</strong> {event.rationale}
                    </div>
                  )}
                  {event.recommendation && (
                    <div className={styles.recommendation}>
                      <strong>Recommendation:</strong> {event.recommendation}
                    </div>
                  )}
                </div>
              ))}
              
              {parsedFeedback.debriefNotes && parsedFeedback.debriefNotes.length > 0 && (
                <div className={styles.debriefNotes}>
                  <h3>Debrief Notes</h3>
                  <ul>
                    {parsedFeedback.debriefNotes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {parsedFeedback.overallEvaluation && (
                <div className={styles.overallEvaluation}>
                  <h3>Overall Evaluation</h3>
                  <p>{parsedFeedback.overallEvaluation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        timestamp={selectedTimestamp}
      />
    </>
  );
};

export default Results;
