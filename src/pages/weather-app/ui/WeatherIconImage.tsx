import { weatherIcon } from "../model/weather-icon";

export const WeatherIconImage = ({
  code,
  className,
}: {
  code: number;
  className?: string;
}) => {
  const { src, name } = weatherIcon(code);
  return <img src={src} alt={name} className={className} />;
};
