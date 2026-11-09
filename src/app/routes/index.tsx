import { createBrowserRouter } from "react-router";
import { ShowcasePage } from "@/pages/showcase";

export const router = createBrowserRouter([
  { path: "/", element: <ShowcasePage /> },
]);
