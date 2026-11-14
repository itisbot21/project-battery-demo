
import {
  CarFront,
  PackageCheck,
  ReceiptText,
  Recycle,
  Wrench,
} from "lucide-react";

const benefits = [
  {
    label: "Free Doorstep Delivery",
    icon: PackageCheck,
  },
  {
    label: "Free Battery Installation",
    icon: Wrench,
  },
  {
    label: "Old Battery Exchange",
    icon: Recycle,
  },
  {
    label: "Car & Bike Batteries",
    icon: CarFront,
  },
  {
    label: "GST Inclusive Pricing",
    icon: ReceiptText,
  },
];

export function ServicesStrip() {
  return (
    <section
      aria-label="Our services and benefits"
      className="relative z-10 mx-auto max-w-[1160px] px-5 pb-10 sm:px-8"
    >
      <div className="overflow-hidden rounded-[18px] border border-white/85 bg-white/65 py-4 shadow-[0_10px_32px_rgba(32,72,102,0.07)] backdrop-blur-[18px]">

        {/* SCROLLING VIEWPORT */}
        <div className="pb-marquee-viewport w-full overflow-hidden">

          {/* MOVING TRACK */}
          <div className="pb-marquee-track flex w-max items-center">

            {/* DUPLICATED GROUPS FOR SEAMLESS LOOP */}
            {[0, 1].map((copy) => (
              <div
                key={copy}
                aria-hidden={copy === 1}
                className="pb-marquee-group flex shrink-0 items-center gap-8 pr-8"
              >
                {benefits.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex shrink-0 items-center gap-3 whitespace-nowrap"
                  >
                    {/* ICON */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#E8F7EE] text-[#29965E]">
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </div>

                    {/* TEXT */}
                    <span className="text-[13px] font-semibold text-[#36556C]">
                      {label}
                    </span>

                    {/* SEPARATOR */}
                    <span
                      aria-hidden="true"
                      className="ml-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#89CFF0]"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ANIMATION STYLES */}
      <style>{`
        .pb-marquee-viewport {
          mask-image: linear-gradient(
            to right,
            transparent,
            black 6%,
            black 94%,
            transparent
          );

          -webkit-mask-image: linear-gradient(
            to right,
            transparent,
            black 6%,
            black 94%,
            transparent
          );
        }

        .pb-marquee-group {
          min-width: 1140px;
        }

        .pb-marquee-track {
          display: flex;
          width: max-content;
          animation: pb-marquee-scroll 30s linear infinite;
          will-change: transform;
        }

        @keyframes pb-marquee-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }

          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .pb-marquee-viewport:hover .pb-marquee-track {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .pb-marquee-viewport {
            overflow-x: auto;
            mask-image: none;
            -webkit-mask-image: none;
          }

          .pb-marquee-track {
            animation: none;
            will-change: auto;
          }

          .pb-marquee-group:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}