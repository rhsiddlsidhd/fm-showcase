import {
  type ComponentProps,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { BareButton } from "./BareButton";
import { MenuItems } from "./MenuItems";
import { CLOSE_ICON, MENU_ICON } from "./assets";

const desktopMediaQuery = "(min-width: 768px)";

// inert 해제와 dialog 마운트를 먼저 커밋해야 포커스를 옮길 대상이 포커스를 받을 수 있다.
const updateThenFocus = (
  update: () => void,
  target: RefObject<HTMLElement | null>,
) => {
  flushSync(update);
  target.current?.focus();
};

const MenuIconButton = ({
  className = "",
  ...props
}: Omit<ComponentProps<typeof BareButton>, "size" | "type" | "variant">) => (
  <BareButton
    className={`size-5 bg-transparent p-0 hover:bg-transparent hover:opacity-65 focus-visible:ring-3 ${className}`}
    size="icon"
    type="button"
    variant="ghost"
    {...props}
  />
);

export const MobileMenu = ({
  desktopReturnFocusRef,
  children,
}: {
  desktopReturnFocusRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(desktopMediaQuery);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // 폭 변경 이벤트보다 먼저 눌릴 수 있어, 누른 시점의 폭으로 대상을 고른다.
        updateThenFocus(
          () => setOpen(false),
          media.matches ? desktopReturnFocusRef : openButtonRef,
        );
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        updateThenFocus(() => setOpen(false), desktopReturnFocusRef);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    media.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      media.removeEventListener("change", closeOnDesktop);
    };
  }, [open, desktopReturnFocusRef]);

  return (
    <>
      <main inert={open}>
        {children}
        <MenuIconButton
          aria-controls="room-homepage-menu"
          aria-expanded={open}
          aria-label="메뉴 열기"
          className="absolute top-12 left-6 z-10 text-(--hero-foreground) focus-visible:ring-(--hero-focus-ring) md:hidden"
          onClick={() => updateThenFocus(() => setOpen(true), closeButtonRef)}
          ref={openButtonRef}
        >
          <img alt="" aria-hidden="true" src={MENU_ICON} />
        </MenuIconButton>
      </main>
      {open && (
        <div
          aria-label="메뉴"
          aria-modal="true"
          className="fixed inset-0 z-20 bg-(--menu-scrim) md:hidden"
          id="room-homepage-menu"
          role="dialog"
        >
          <div className="flex h-[110px] items-center justify-between bg-background px-6 text-foreground">
            <MenuIconButton
              aria-label="메뉴 닫기"
              className="text-foreground focus-visible:ring-ring"
              onClick={() =>
                updateThenFocus(() => setOpen(false), openButtonRef)
              }
              ref={closeButtonRef}
            >
              <img alt="" aria-hidden="true" src={CLOSE_ICON} />
            </MenuIconButton>
            <nav
              aria-label="모바일 메뉴"
              className="flex gap-5 text-base font-semibold"
            >
              <MenuItems className="hover:underline-offset-4" />
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
