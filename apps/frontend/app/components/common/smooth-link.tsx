import { Link, type LinkProps } from "react-router";

type SmoothLinkProps = LinkProps & {
  to: string;
};

export function SmoothLink({ to, onClick, ...props }: SmoothLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If it's a hash link, handle smooth scrolling
    if (to.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(to);
      if (element) {
        // Get element position and account for sticky header (4rem = 64px)
        const headerOffset = 64;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        
        // Update URL without triggering navigation
        window.history.pushState(null, "", to);
      }
    }
    // Call original onClick if provided
    onClick?.(e);
  };

  return <Link to={to} onClick={handleClick} {...props} />;
}
