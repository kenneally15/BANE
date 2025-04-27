import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Results.module.css';

interface FeedbackData {
  eventLog: string;
  aiFeedback: string;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the data passed from Landing page
  const data = location.state?.data as FeedbackData;

  useEffect(() => {
    // If no data was passed, redirect back to home
    if (!data) {
      navigate('/');
    }
  }, [data, navigate]);

  const handleBack = () => {
    navigate('/');
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
            <pre>{data?.eventLog}</pre>
          </div>
        </div>

        <div className={styles.section}>
          <h2>AI Feedback</h2>
          <div className={styles.feedbackContent}>
            <div className={styles.feedback}>
              {data?.aiFeedback}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results; 