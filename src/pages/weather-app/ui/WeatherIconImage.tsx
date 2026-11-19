import { weatherIcon } from "../model/weather-icon";
import { weatherIconSrc } from "./assets";

export const WeatherIconImage = ({
  code,
  className,
}: {
  code: number;
  className?: string;
}) => {
  const { kind, name } = weatherIcon(code);
  return <img src={weatherIconSrc(kind)} alt={name} className={className} />;
};
