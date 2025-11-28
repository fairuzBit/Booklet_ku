import { Route, Routes } from "react-router-dom";
import routes from "./AppRoutes";

const renderRoute = (route) => {
  const { requireAuth, isLazy, props } = route;

  const renderRoutes = (routes) => {
    return routes ? routes.map(renderRoute) : null;
  };

  const Component = route.Component;

  const routeElement = requireAuth ? (
    <p>
      You need to be logged in to access this page. <br />
    </p>
  ) : (
    <Component {...props} />
  );

  const routeComponent = isLazy ? (
    <Suspense fallback={<p>Loading ...</p>}>{routeElement}</Suspense>
  ) : (
    routeElement
  );

  return (
    <Route
      path={route.index ? undefined : route.path}
      index={route.index}
      key={route.name}
      element={routeComponent}
    >
      {route.routes && renderRoutes(route.routes)}
    </Route>
  );
};

const Page = () => {
  return <Routes>{routes.map(renderRoute)}</Routes>;
};

export default Page;
