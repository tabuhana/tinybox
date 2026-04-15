import clsx from "clsx";
import { Check } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PricingCard = {
  title: string;
  description: string;
  price: string;
  duration: string;
  highlight: string;
  features: string[];
  featured?: boolean;
};

const pricingCards: PricingCard[] = [
  {
    title: "Starter",
    description: "Perfect for trying out Tinybox",
    price: "$0",
    duration: "month",
    highlight: "Key features",
    features: ["1 agency", "2 team members", "3 funnels"],
  },
  {
    title: "Unlimited",
    description: "The ultimate agency kit",
    price: "$199",
    duration: "month",
    highlight: "Everything in Basic, plus",
    features: [
      "Unlimited funnels",
      "Priority support",
      "White-label branding",
      "Advanced automations",
    ],
    featured: true,
  },
  {
    title: "Basic",
    description: "For serious agency owners",
    price: "$49",
    duration: "month",
    highlight: "Everything in Starter, plus",
    features: ["Unlimited team members", "Unlimited pipelines", "Media library"],
  },
];

export default function SiteHome() {
  return (
    <>
      <section className="relative mt-[-70px] flex h-full w-full flex-col items-center justify-center md:pt-44">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <p className="text-center text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Run your agency, in one place
        </p>
        <div className="relative bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
          <h1 className="text-center text-8xl font-bold md:text-[240px]">Tinybox</h1>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-lg text-muted-foreground">
          Funnels, pipelines, and clients unified in a single self-hostable platform.
          Ship campaigns without gluing five SaaS tools together.
        </p>
      </section>

      <section
        id="pricing"
        className="mt-[-60px] flex flex-col items-center justify-center gap-4 md:mt-20"
      >
        <h2 className="text-center text-4xl">Choose what fits you right</h2>
        <p className="max-w-2xl text-center text-muted-foreground">
          Straightforward pricing tailored to your agency. Start free and upgrade
          when you&apos;re ready to scale.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {pricingCards.map((card) => (
            <Card
              key={card.title}
              className={clsx("flex w-[300px] flex-col justify-between", {
                "border-2 border-primary": card.featured,
              })}
            >
              <CardHeader>
                <CardTitle
                  className={clsx({
                    "text-muted-foreground": !card.featured,
                  })}
                >
                  {card.title}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-4xl font-bold">{card.price}</span>
                <span className="text-muted-foreground"> / {card.duration || "month"}</span>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <div>
                  {card.features.map((feature) => (
                    <div key={feature} className="flex gap-2">
                      <Check className="size-5 text-primary" />
                      <p>{feature}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/agency/sign-up"
                  className={clsx(
                    "w-full rounded-md p-2 text-center font-medium text-primary-foreground",
                    card.featured ? "bg-primary" : "bg-muted-foreground/80",
                  )}
                >
                  Get started
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
