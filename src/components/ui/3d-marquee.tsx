"use client";

import type React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export function ThreeDMarquee({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) {
  const hareketiAzalt = useReducedMotion();
  const parcaBoyutu = Math.ceil(images.length / 4);
  const sutunlar = Array.from({ length: 4 }, (_, sutun) =>
    images.slice(sutun * parcaBoyutu, (sutun + 1) * parcaBoyutu),
  );

  return (
    <div
      className={cn(
        "mx-auto block h-[29rem] touch-pan-y overflow-hidden rounded-[1.1rem] sm:h-[34rem] sm:rounded-[1.5rem] lg:h-[38rem] lg:rounded-[1.75rem]",
        className,
      )}
    >
      <div className="flex size-full items-center justify-center">
        <div className="size-[1720px] shrink-0 scale-50 sm:scale-75 lg:scale-100">
          <div
            style={{ transform: "rotateX(55deg) rotateZ(-45deg)" }}
            className="relative right-[50%] top-96 grid size-full origin-top-left grid-cols-4 gap-8 transform-3d"
          >
            {sutunlar.map((gorseller, sutun) => (
              <motion.div
                animate={hareketiAzalt ? undefined : { y: sutun % 2 === 0 ? 100 : -100 }}
                transition={{
                  duration: sutun % 2 === 0 ? 10 : 15,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                key={`marquee-${sutun}`}
                className="relative flex flex-col items-start gap-8"
              >
                <GridLineVertical className="-left-4" offset="80px" />
                {gorseller.map((gorsel, sira) => (
                  <div className="relative" key={gorsel}>
                    <GridLineHorizontal className="-top-4" offset="20px" />
                    <motion.img
                      whileHover={hareketiAzalt ? undefined : { y: -10 }}
                      whileTap={hareketiAzalt ? undefined : { scale: 0.96, y: -4 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      src={gorsel}
                      alt={`KAM arayüz ilhamı ${sutun * parcaBoyutu + sira + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/9] select-none rounded-lg object-cover ring-1 ring-white/10 transition-shadow hover:shadow-2xl"
                      draggable={false}
                      width={970}
                      height={700}
                    />
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GridLineHorizontal({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(255, 255, 255, 0.16)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] z-30 h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        className,
      )}
    />
  );
}

function GridLineVertical({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(255, 255, 255, 0.16)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] z-30 h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        className,
      )}
    />
  );
}
