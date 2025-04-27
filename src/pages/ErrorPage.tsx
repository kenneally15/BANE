import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import styles from './ErrorPage.module.css';

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage = 'An unexpected error occurred';
  let errorTitle = 'Oops!';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      errorTitle = '404 - Page Not Found';
      errorMessage = 'The page you are looking for does not exist.';
    } else {
      errorTitle = `${error.status} - ${error.statusText}`;
      errorMessage = error.data?.message || 'Something went wrong';
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className={styles.container}>
      <h1>{errorTitle}</h1>
      <p>{errorMessage}</p>
      <button className={styles.button} onClick={() => navigate('/')}>
        Return to Home
      </button>
    </div>
  );
};

export default ErrorPage; 