import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { panel } from "./styles";

export type ConfirmedOrder = { id: number; totalPaise: number };

export function OrderConfirmation({ confirmedOrder }: { confirmedOrder: ConfirmedOrder }) {
  return (
    <section
      className={`${panel} mx-auto max-w-[590px] px-6 py-10 text-center sm:p-12`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#E5F8ED] text-[#2C9A61]">
        <CheckCircle2
          size={34}
          aria-hidden="true"
        />
      </div>

      <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-tight">
        Order placed
      </h1>

      <p className="mt-2 text-sm leading-6 text-[#637D90]">
        Your order is received. Our team will contact
        you to confirm delivery timing.
      </p>

      <div className="mt-7 grid gap-4 rounded-[16px] border border-white/85 bg-[#EAF5FB]/65 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-[#667F91]">
            Order number
          </p>

          <p className="mt-1 text-xl font-extrabold">
            #{confirmedOrder.id}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#667F91]">
            Pay on delivery
          </p>

          <p className="mt-1 text-xl font-extrabold">
            {formatCurrency(confirmedOrder.totalPaise)}
          </p>
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-[#667F91]">
        Cash on Delivery · Old battery exchange eligibility
        is checked at delivery. An ineligible exchange
        may increase the amount due.
      </p>

      <Link
        href="/"
        className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#89CFF0] px-6 text-sm font-bold text-[#17364E] hover:bg-[#75C5EB]"
      >
        Back to home
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
