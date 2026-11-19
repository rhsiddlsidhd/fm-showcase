import "./theme.css";

const firstDescription =
  "We provide unmatched quality, comfort, and style for property owners across the country. Our experts combine form and function in bringing your vision to life. Create a room in your own style with our collection and make your property a reflection of you and what you love.";

const aboutDescription =
  "Our multifunctional collection blends design and function to suit your individual taste. Make each room unique, or pick a cohesive theme that best express your interests and what inspires you. Find the furniture pieces you need, from traditional to contemporary styles or anything in between. Product specialists are available to help you create your dream space.";

export const RoomHomepage = () => (
  <main className="theme-room-homepage min-h-dvh bg-white font-sans text-black">
    <section aria-label="Featured furniture" className="grid md:grid-cols-2">
      <div className="relative flex min-h-80 flex-col justify-between p-8 text-white md:min-h-[32rem] md:p-12">
        <img
          alt="Room interior"
          className="absolute inset-0 h-full w-full object-cover"
          src="/room-homepage/desktop-image-hero-1.jpg"
        />
        <nav aria-label="Main menu" className="relative flex gap-8 text-sm">
          <span>home</span>
          <span>shop</span>
          <span>about</span>
          <span>contact</span>
        </nav>
      </div>
      <div className="flex flex-col justify-center gap-5 p-8 md:p-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Discover innovative ways to decorate
        </h1>
        <p className="text-sm leading-6 text-neutral-500">{firstDescription}</p>
        <p className="text-xs font-semibold tracking-[0.7em] uppercase">
          Shop now
        </p>
      </div>
    </section>
    <section className="grid md:grid-cols-[1fr_1.5fr_1fr]">
      <div aria-hidden="true" className="min-h-48 bg-neutral-800" />
      <div className="flex flex-col justify-center gap-4 p-8">
        <h2 className="text-sm font-bold tracking-[0.35em] uppercase">
          About our furniture
        </h2>
        <p className="text-sm leading-6 text-neutral-500">{aboutDescription}</p>
      </div>
      <div aria-hidden="true" className="min-h-48 bg-neutral-300" />
    </section>
  </main>
);
