
import PincodeChecker from "@/components/pincode-checker";

export function DeliverySection() {
  return (
    <section
      aria-label="Delivery availability"
      className="relative z-10 mx-auto w-full max-w-[1160px] px-5 pb-16 sm:px-8"
    >
      <div className="relative overflow-hidden rounded-[22px] border border-white/85 bg-white/65 shadow-[0_12px_36px_rgba(31,72,102,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-[#89CFF0]/15 backdrop-blur-[18px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white/95"
        />

        <PincodeChecker />
      </div>
    </section>
  );
}