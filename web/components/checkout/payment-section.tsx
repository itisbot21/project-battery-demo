import { CreditCard, Wallet } from "lucide-react";
import { panel } from "./styles";

export function PaymentSection() {
  return (
    <section className={`${panel} p-5 sm:p-6`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F3FB] text-[#367FA8]">
          <Wallet
            size={19}
            aria-hidden="true"
          />
        </span>

        <h2 className="text-lg font-extrabold">
          Payment
        </h2>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-[#A5DFC1] bg-[#EAF8F0]/70 p-4">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[5px] border-[#50C878] bg-white"
          aria-hidden="true"
        />

        <div className="min-w-0">
          <p className="text-sm font-bold text-[#174F34]">
            Cash on Delivery
          </p>

          <p className="mt-1 text-xs leading-5 text-[#4F7964]">
            Pay when your battery is delivered.
            No online payment is collected.
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-2 text-xs text-[#788C9A]">
        <CreditCard
          size={15}
          aria-hidden="true"
        />
        UPI, cards and advance payments are
        not available yet.
      </p>
    </section>
  );
}
