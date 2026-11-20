import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  ABOUT_DARK_IMAGE,
  ABOUT_LIGHT_IMAGE,
  CLOSE_ICON,
  HERO_IMAGES,
  MENU_ICON,
  NEXT_ICON,
  PREVIOUS_ICON,
  ROOM_LOGO,
  SHOP_ARROW,
} from "./assets";

const menuItems = ["home", "shop", "about", "contact"] as const;
const desktopMediaQuery = "(min-width: 768px)";

const slides = [
  {
    title: "Discover innovative ways to decorate",
    description:
      "We provide unmatched quality, comfort, and style for property owners across the country. Our experts combine form and function in bringing your vision to life. Create a room in your own style with our collection and make your property a reflection of you and what you love.",
  },
  {
    title: "We are available all across the globe",
    description:
      "With stores all over the world, it's easy for you to find furniture for your home or place of business. Locally, we’re in most major cities throughout the country. Find the branch nearest you using our store locator. Any questions? Don't hesitate to contact us today.",
  },
  {
    title: "Manufactured with the best materials",
    description:
      "Our modern furniture store provide a high level of quality. Our company has invested in advanced technology to ensure that every product is made as perfect and as consistent as possible. With three decades of experience in this industry, we understand what customers want for their home and office.",
  },
];

const aboutDescription =
  "Our multifunctional collection blends design and function to suit your individual taste. Make each room unique, or pick a cohesive theme that best express your interests and what inspires you. Find the furniture pieces you need, from traditional to contemporary styles or anything in between. Product specialists are available to help you create your dream space.";

export const RoomHomepage = () => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousButtonRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpen = useRef(false);
  const slide = slides[slideIndex];
  const changeSlide = (direction: number) => {
    const nextIndex = (slideIndex + direction + slides.length) % slides.length;
    setSlideIndex(nextIndex);
    setAnnouncement(
      `${nextIndex + 1} / ${slides.length} ${slides[nextIndex].title}`,
    );
  };

  useEffect(() => {
    if (menuOpen) {
      closeButtonRef.current?.focus();
    } else if (wasMenuOpen.current) {
      if (window.matchMedia(desktopMediaQuery).matches) {
        previousButtonRef.current?.focus();
      } else {
        menuButtonRef.current?.focus();
      }
    }
    wasMenuOpen.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    const media = window.matchMedia(desktopMediaQuery);
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <div className="theme-room-homepage bg-background text-foreground min-h-dvh font-sans text-base">
      <main
        inert={menuOpen}
        className="bg-background text-foreground min-h-dvh font-sans text-base"
      >
        <section
          aria-label="Featured furniture"
          className="relative grid md:min-h-[535px] md:grid-cols-[7fr_5fr]"
        >
          <div className="text-primary-foreground relative min-h-[360px] md:min-h-0">
            <picture className="absolute inset-0">
              <source
                media="(max-width: 767px)"
                srcSet={HERO_IMAGES[slideIndex].mobile}
              />
              <img
                alt="Room interior"
                className="h-full w-full object-cover"
                src={HERO_IMAGES[slideIndex].desktop}
              />
            </picture>
            <img
              alt="room"
              className="absolute top-12 left-1/2 w-[62px] -translate-x-1/2 md:top-16 md:left-16 md:translate-x-0"
              src={ROOM_LOGO}
            />
            <nav
              aria-label="Main menu"
              className="absolute top-[63px] left-44 hidden gap-8 text-base font-semibold text-white md:flex"
            >
              {menuItems.map((item) => (
                <Button
                  key={item}
                  className="h-auto cursor-pointer rounded-none border-0 bg-transparent p-0 text-base font-semibold text-white transition-none hover:bg-transparent hover:text-white hover:underline hover:underline-offset-8 active:not-aria-[haspopup]:translate-y-0"
                  tabIndex={-1}
                  type="button"
                  variant="ghost"
                >
                  {item}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex min-h-[410px] flex-col justify-center gap-5 px-8 pt-14 pb-14 md:min-h-0 md:translate-y-2 md:px-[clamp(3rem,6.9vw,100px)] md:pt-0 md:pb-14">
            <h1 className="font-heading text-4xl font-bold tracking-[-0.035em] md:text-5xl">
              {slide.title}
            </h1>
            <p className="text-muted-foreground text-base leading-[1.38] font-medium">
              {slide.description}
            </p>
            <p className="hover:text-muted-foreground flex cursor-pointer items-center gap-6 text-base font-semibold tracking-[0.65em] uppercase">
              <span>Shop now</span>
              <img
                alt=""
                aria-hidden="true"
                className="w-10"
                src={SHOP_ARROW}
              />
            </p>
            <div aria-live="polite" className="sr-only" role="status">
              {announcement}
            </div>
          </div>
          <div className="absolute top-[304px] right-0 flex md:top-auto md:right-auto md:bottom-0 md:left-[58.333%]">
            <Button
              aria-label="이전 슬라이드"
              className="bg-primary text-primary-foreground hover:bg-secondary size-14 cursor-pointer rounded-none border-0 transition-none focus-visible:ring-3 focus-visible:ring-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-aria-[haspopup]:translate-y-0 md:size-20"
              onClick={() => changeSlide(-1)}
              ref={previousButtonRef}
              size="icon"
              type="button"
            >
              <img
                alt=""
                aria-hidden="true"
                className="h-6 w-[14px]"
                src={PREVIOUS_ICON}
              />
            </Button>
            <Button
              aria-label="다음 슬라이드"
              className="bg-primary text-primary-foreground hover:bg-secondary size-14 cursor-pointer rounded-none border-0 transition-none focus-visible:ring-3 focus-visible:ring-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:not-aria-[haspopup]:translate-y-0 md:size-20"
              onClick={() => changeSlide(1)}
              size="icon"
              type="button"
            >
              <img
                alt=""
                aria-hidden="true"
                className="h-6 w-[14px]"
                src={NEXT_ICON}
              />
            </Button>
          </div>
        </section>
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
        <Button
          aria-controls="room-homepage-menu"
          aria-expanded={menuOpen}
          aria-label="메뉴 열기"
          className="absolute top-12 left-6 z-10 size-5 cursor-pointer rounded-none border-0 bg-transparent p-0 text-white transition-none hover:bg-transparent hover:opacity-65 focus-visible:ring-3 focus-visible:ring-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:not-aria-[haspopup]:translate-y-0 md:hidden"
          onClick={() => setMenuOpen(true)}
          ref={menuButtonRef}
          size="icon"
          type="button"
          variant="ghost"
        >
          <img alt="" aria-hidden="true" src={MENU_ICON} />
        </Button>
      </main>
      {menuOpen && (
        <div
          aria-label="메뉴"
          aria-modal="true"
          className="fixed inset-0 z-20 md:hidden"
          id="room-homepage-menu"
          role="dialog"
          style={{ backgroundColor: "var(--menu-scrim)" }}
        >
          <div className="bg-background text-foreground flex h-[110px] items-center justify-between px-6">
            <Button
              aria-label="메뉴 닫기"
              className="text-foreground size-5 cursor-pointer rounded-none border-0 bg-transparent p-0 transition-none hover:bg-transparent hover:opacity-65 focus-visible:ring-3 focus-visible:ring-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black active:not-aria-[haspopup]:translate-y-0"
              onClick={() => setMenuOpen(false)}
              ref={closeButtonRef}
              size="icon"
              type="button"
              variant="ghost"
            >
              <img alt="" aria-hidden="true" src={CLOSE_ICON} />
            </Button>
            <nav
              aria-label="모바일 메뉴"
              className="flex gap-5 text-base font-semibold"
            >
              {menuItems.map((item) => (
                <Button
                  key={item}
                  className="h-auto cursor-pointer rounded-none border-0 bg-transparent p-0 text-base font-semibold transition-none hover:bg-transparent hover:underline hover:underline-offset-4 active:not-aria-[haspopup]:translate-y-0"
                  tabIndex={-1}
                  type="button"
                  variant="ghost"
                >
                  {item}
                </Button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
