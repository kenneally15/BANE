import { useNavigate } from 'react-router-dom';
import styles from './Guidance.module.css';

const Guidance = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Ally</h1>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          Back to Home
        </button>
      </header>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Wargame Scenario Considerations</h2>
          <div className={styles.guidanceContent}>
            {/* Add your guidance content here */}
            <p>This section will contain the instructor guidance content.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guidance; 