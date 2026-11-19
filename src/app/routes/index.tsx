import { createBrowserRouter } from "react-router";
import { ShowcasePage } from "@/pages/showcase";
import { RoomHomepagePage } from "@/pages/room-homepage";
import { WeatherAppPage } from "@/pages/weather-app";

export const router = createBrowserRouter([
  { path: "/", element: <ShowcasePage /> },
  { path: "/room-homepage", element: <RoomHomepagePage /> },
  { path: "/weather-app", element: <WeatherAppPage /> },
]);
