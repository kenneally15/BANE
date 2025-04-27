import { useNavigate } from 'react-router-dom';
import styles from './Guidance.module.css';
import Header from './Header';

const Guidance = () => {
  const navigate = useNavigate();

  return (
    <>
    <Header></Header>
    <div className={styles.container}>
      <header className={styles.header}>
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
    </>
  );
};

export default Guidance; 