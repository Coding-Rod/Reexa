// Reexa "R" mark (web/public/logo.svg). Uses currentColor so it reads on dark and light themes.
export default function Logo({ className = "size-8", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="381 317 506 552" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path fill="currentColor" d="M617 318C494 318 381 416 381 517C381 556 396 583 425 616L576 785C588 800 608 804 625 792C642 782 645 765 632 749L493 601C490 598 490 595 492 594H598C622 594 640 579 640 558C640 537 621 518 598 518H465C461 518 460 516 462 508C476 448 546 398 617 398C701 396 767 450 767 518C767 589 701 641 599 641L794 868H887L724 689C805 648 848 592 848 518C848 403 746 318 617 318Z" />
    </svg>
  );
}
