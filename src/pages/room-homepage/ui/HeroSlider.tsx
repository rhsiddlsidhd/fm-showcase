import { type ComponentProps, type ReactNode, type Ref, useState } from "react";
import { BareButton } from "./BareButton";
import {
  HERO_IMAGE_1,
  HERO_IMAGE_2,
  HERO_IMAGE_3,
  NEXT_ICON,
  PREVIOUS_ICON,
  SHOP_ARROW,
} from "./assets";

const slides = [
  {
    title: "Discover innovative ways to decorate",
    description:
      "We provide unmatched quality, comfort, and style for property owners across the country. Our experts combine form and function in bringing your vision to life. Create a room in your own style with our collection and make your property a reflection of you and what you love.",
    image: HERO_IMAGE_1,
  },
  {
    title: "We are available all across the globe",
    description:
      "With stores all over the world, it's easy for you to find furniture for your home or place of business. Locally, we’re in most major cities throughout the country. Find the branch nearest you using our store locator. Any questions? Don't hesitate to contact us today.",
    image: HERO_IMAGE_2,
  },
  {
    title: "Manufactured with the best materials",
    description:
      "Our modern furniture store provide a high level of quality. Our company has invested in advanced technology to ensure that every product is made as perfect and as consistent as possible. With three decades of experience in this industry, we understand what customers want for their home and office.",
    image: HERO_IMAGE_3,
  },
] as const;

const SlideButton = (
  props: Omit<ComponentProps<typeof BareButton>, "className" | "size" | "type">,
) => (
  <BareButton
    className="bg-primary text-primary-foreground hover:bg-secondary size-14 focus-visible:ring-3 focus-visible:ring-(--hero-focus-ring) md:size-20"
    size="icon"
    type="button"
    {...props}
  />
);

export const HeroSlider = ({
  previousButtonRef,
  children,
}: {
  previousButtonRef: Ref<HTMLButtonElement>;
  children: ReactNode;
}) => {
  const [movedTo, setMovedTo] = useState<number | null>(null);
  const slideIndex = movedTo ?? 0;
  // slideIndex는 나머지 연산으로 범위 안에 있어 ?? 뒤에는 닿지 않는다.
  const slide = slides[slideIndex] ?? slides[0];
  const announcement =
    movedTo === null
      ? ""
      : `${slideIndex + 1} / ${slides.length} ${slide.title}`;
  const changeSlide = (direction: number) =>
    setMovedTo((slideIndex + direction + slides.length) % slides.length);

  return (
    <section
      aria-label="Featured furniture"
      className="relative grid md:min-h-[535px] md:grid-cols-[7fr_5fr]"
    >
      <div className="text-primary-foreground relative min-h-[360px] md:min-h-0">
        <picture className="absolute inset-0">
          <source media="(max-width: 767px)" srcSet={slide.image.mobile} />
          <img
            alt="Room interior"
            className="h-full w-full object-cover"
            src={slide.image.desktop}
          />
        </picture>
        {children}
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
          <img alt="" aria-hidden="true" className="w-10" src={SHOP_ARROW} />
        </p>
        <div aria-live="polite" className="sr-only" role="status">
          {announcement}
        </div>
      </div>
      <div className="absolute top-[304px] right-0 flex md:top-auto md:right-auto md:bottom-0 md:left-[58.333%]">
        <SlideButton
          aria-label="이전 슬라이드"
          onClick={() => changeSlide(-1)}
          ref={previousButtonRef}
        >
          <img
            alt=""
            aria-hidden="true"
            className="h-6 w-[14px]"
            src={PREVIOUS_ICON}
          />
        </SlideButton>
        <SlideButton aria-label="다음 슬라이드" onClick={() => changeSlide(1)}>
          <img
            alt=""
            aria-hidden="true"
            className="h-6 w-[14px]"
            src={NEXT_ICON}
          />
        </SlideButton>
      </div>
    </section>
  );
};
