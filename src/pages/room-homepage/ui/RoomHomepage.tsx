import { useRef } from "react";
import { HeroSlider } from "./HeroSlider";
import { MenuItems } from "./MenuItems";
import { MobileMenu } from "./MobileMenu";
import { ABOUT_DARK_IMAGE, ABOUT_LIGHT_IMAGE, ROOM_LOGO } from "./assets";

const aboutDescription =
  "Our multifunctional collection blends design and function to suit your individual taste. Make each room unique, or pick a cohesive theme that best express your interests and what inspires you. Find the furniture pieces you need, from traditional to contemporary styles or anything in between. Product specialists are available to help you create your dream space.";

export const RoomHomepage = () => {
  const previousButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="theme-room-homepage bg-background text-foreground min-h-dvh font-sans text-base">
      <MobileMenu desktopReturnFocusRef={previousButtonRef}>
        <HeroSlider previousButtonRef={previousButtonRef}>
          <img
            alt="room"
            className="absolute top-12 left-1/2 w-[62px] -translate-x-1/2 md:top-16 md:left-16 md:translate-x-0"
            src={ROOM_LOGO}
          />
          <nav
            aria-label="Main menu"
            className="absolute top-[63px] left-44 hidden gap-8 text-base font-semibold text-(--hero-foreground) md:flex"
          >
            <MenuItems className="text-(--hero-foreground) hover:text-(--hero-foreground) hover:underline-offset-8" />
          </nav>
        </HeroSlider>
        <section className="grid md:min-h-[265px] md:grid-cols-[29fr_40fr_31fr]">
          <div className="relative min-h-[240px] md:min-h-0">
            <img
              alt="Dark room interior with a sofa"
              className="absolute inset-0 h-full w-full object-cover"
              src={ABOUT_DARK_IMAGE}
            />
          </div>
          <div className="flex min-h-[300px] flex-col justify-center gap-4 px-8 py-12 md:min-h-0 md:px-12 md:py-8">
            <h2 className="text-base font-bold tracking-[0.35em] uppercase">
              About our furniture
            </h2>
            <p className="text-muted-foreground text-base leading-[1.38] font-medium">
              {aboutDescription}
            </p>
          </div>
          <div className="relative min-h-[265px] md:min-h-0">
            <img
              alt="A light colored chair"
              className="absolute inset-0 h-full w-full object-cover"
              src={ABOUT_LIGHT_IMAGE}
            />
          </div>
        </section>
      </MobileMenu>
    </div>
  );
};
