// import { useNavigate } from 'react-router-dom';
import styles from './Guidance.module.css';
import Header from './Header';
// import MarkdownViewer from './MarkdownViewer';

const Guidance = () => {
  // const navigate = useNavigate();

  return (
    <>
    <Header></Header>
    {/* <MarkdownViewer markdownUrl="../../Wargame Scenario Considerations.md" /> */}
    <div className={styles.container}>      
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