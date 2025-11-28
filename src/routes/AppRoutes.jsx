import { Component } from "react";
import { Outlet } from "react-router-dom";
import AddMenu from "../pages/AddMenu";
import Dashboard from "../pages/Dashboard";
import Preview from "../pages/Preview";

const AppRoutes = [
  {
    name: "main",
    path: "/",
    Component: () => (
      <main>
        <Outlet />
      </main>
    ),
    key: "main",
    routes: [
      {
        // addMenu,builder,dashboard,home,preview
        key: "home",
        name: "home",
        path: "/",
        index: true, //agar isinya sm kyk main
        requireAuth: false, //artinya langsung masuk page klo true nnti berarti kelempar ke menu login
        Component: () => <Dashboard />,
      },
      {
        key: "addMenu",
        name: "addMenu",
        path: "/addMenu",
        Component: () => <AddMenu />,
      },
      {
        key: "preview",
        name: "preview",
        path: "/Preview/:id",
        Component: () => <Preview />,
      },
    ],
  },
  {
    key: "404",
    name: "404",
    path: "*",
    Component: () => <p>404</p>,
  },
];

export default AppRoutes;
