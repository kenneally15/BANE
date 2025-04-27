import App from "./App";
import Results from "./pages/Results";
import Guidance from "./pages/Guidance";
import ErrorPage from "./pages/ErrorPage";

const routes = [
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/results",
    element: <Results />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/guidance",
    element: <Guidance />,
    errorElement: <ErrorPage />,
  }
];

export default routes;