import { useState } from "react";
import "./theme.css";

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
  const slide = slides[slideIndex];
  const changeSlide = (direction: number) => {
    const nextIndex = (slideIndex + direction + slides.length) % slides.length;
    setSlideIndex(nextIndex);
    setAnnouncement(
      `${nextIndex + 1} / ${slides.length} ${slides[nextIndex].title}`,
    );
  };

  return (
    <main className="theme-room-homepage min-h-dvh bg-white font-sans text-black">
      <section aria-label="Featured furniture" className="grid md:grid-cols-2">
        <div className="relative flex min-h-80 flex-col justify-between p-8 text-white md:min-h-[32rem] md:p-12">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={`/room-homepage/mobile-image-hero-${slideIndex + 1}.jpg`}
            />
            <img
              alt="Room interior"
              className="absolute inset-0 h-full w-full object-cover"
              src={`/room-homepage/desktop-image-hero-${slideIndex + 1}.jpg`}
            />
          </picture>
          <nav aria-label="Main menu" className="relative flex gap-8 text-sm">
            <span>home</span>
            <span>shop</span>
            <span>about</span>
            <span>contact</span>
          </nav>
          <div className="absolute right-0 bottom-0 flex">
            <button
              aria-label="이전 슬라이드"
              className="bg-black p-4 text-white"
              onClick={() => changeSlide(-1)}
              type="button"
            >
              ←
            </button>
            <button
              aria-label="다음 슬라이드"
              className="bg-black p-4 text-white"
              onClick={() => changeSlide(1)}
              type="button"
            >
              →
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-5 p-8 md:p-16">
          <h1 className="text-4xl font-semibold tracking-tight">
            {slide.title}
          </h1>
          <p className="text-sm leading-6 text-neutral-500">
            {slide.description}
          </p>
          <p className="text-xs font-semibold tracking-[0.7em] uppercase">
            Shop now
          </p>
          <div aria-live="polite" className="sr-only" role="status">
            {announcement}
          </div>
        </div>
      </section>
      <section className="grid md:grid-cols-[1fr_1.5fr_1fr]">
        <div aria-hidden="true" className="min-h-48 bg-neutral-800" />
        <div className="flex flex-col justify-center gap-4 p-8">
          <h2 className="text-sm font-bold tracking-[0.35em] uppercase">
            About our furniture
          </h2>
          <p className="text-sm leading-6 text-neutral-500">
            {aboutDescription}
          </p>
        </div>
        <div aria-hidden="true" className="min-h-48 bg-neutral-300" />
      </section>
    </main>
  );
};
