import { createBrowserRouter } from "react-router";
import { ShowcasePage } from "@/pages/showcase";
import { WeatherAppPage } from "@/pages/weather-app";

export const router = createBrowserRouter([
  { path: "/", element: <ShowcasePage /> },
  { path: "/weather-app", element: <WeatherAppPage /> },
]);
