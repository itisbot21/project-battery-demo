
import {
  CarFront,
  PackageCheck,
  ReceiptText,
  Recycle,
  Wrench,
} from "lucide-react";

const benefits = [
  { label: "Free Doorstep Delivery", icon: PackageCheck },
  { label: "Free Battery Installation", icon: Wrench },
  { label: "Old Battery Exchange", icon: Recycle },
  { label: "Car & Bike Batteries", icon: CarFront },
  { label: "GST Inclusive Pricing", icon: ReceiptText },
];

export function ServicesStrip() {
  return (
    <section
      aria-label="Our services and benefits"
      className="w-full overflow-hidden bg-[#36556C] py-4"
    >
      {/* Horizontal marquee */}
      <div className="pb-marquee-viewport w-full overflow-hidden">
        <div className="pb-marquee-track flex w-max items-center">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="pb-marquee-group flex shrink-0 items-center gap-10 pr-10"
            >
              {benefits.map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex shrink-0 items-center gap-3 whitespace-nowrap"
                >
                  {/* Icon */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-[#50C878]">
                    <Icon
                      size={19}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </span>

                  {/* Text */}
                  <span className="text-[13px] font-semibold tracking-[-0.01em] text-white sm:text-[14px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pb-marquee-viewport {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent,
            black 5%,
            black 95%,
            transparent
          );
          mask-image: linear-gradient(
            to right,
            transparent,
            black 5%,
            black 95%,
            transparent
          );
        }

        .pb-marquee-track {
          display: flex;
          width: max-content;
          animation: pb-marquee-scroll 32s linear infinite;
          will-change: transform;
        }

        @keyframes pb-marquee-scroll {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .pb-marquee-viewport:hover .pb-marquee-track {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .pb-marquee-viewport {
            overflow-x: auto;
            -webkit-mask-image: none;
            mask-image: none;
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
