import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Results.module.css';
import ReactMarkdown from 'react-markdown';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  console.log("Trying to load Results page!");
  
  // Get the data passed from Landing page
  const eventLog = location.state?.eventLog;
  const aiFeedback = location.state?.aiFeedback;

  useEffect(() => {
    // If no data was passed, redirect back to home
    if (!eventLog || !aiFeedback) {
      navigate('/');
    }
  }, [eventLog, aiFeedback, navigate]);

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
          {eventLog}
          {/* <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#f8f8f8', borderRadius: '8px', padding: '1em', fontSize: '1em' }}>
            <ReactMarkdown>{eventLog || ''}</ReactMarkdown>
          </div> */}
        </div>

        <div className={styles.section}>
          <h2>AI Feedback</h2>
          {aiFeedback}
          {/* <div style={{ maxHeight: '400px', overflowY: 'auto', background: '#f8f8f8', borderRadius: '8px', padding: '1em', fontSize: '1em' }}>
            <ReactMarkdown>{aiFeedback || ''}</ReactMarkdown>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Results; 