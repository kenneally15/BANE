import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Results.module.css';

interface FeedbackData {
  eventLog: string;
  aiFeedback: string;
}

const Results = () => {
  const [data, setData] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch('/api/results');
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setData(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

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