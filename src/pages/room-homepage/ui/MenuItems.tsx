import { BareButton } from "./BareButton";

const menuItems = ["home", "shop", "about", "contact"] as const;

export const MenuItems = ({ className }: { className: string }) =>
  menuItems.map((item) => (
    <BareButton
      key={item}
      className={`h-auto bg-transparent p-0 text-base font-semibold hover:bg-transparent hover:underline ${className}`}
      tabIndex={-1}
      type="button"
      variant="ghost"
    >
      {item}
    </BareButton>
  ));
