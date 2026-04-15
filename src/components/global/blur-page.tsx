import type { ReactNode } from "react";

type BlurPageProps = {
  children: ReactNode;
};

export function BlurPage({ children }: BlurPageProps) {
  return (
    <div
      id="blur-page"
      className="absolute inset-0 z-[1] h-full w-full bg-background/75 backdrop-blur-[1.5px]"
    >
      {children}
    </div>
  );
}
