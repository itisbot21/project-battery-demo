"use client";

import { ShieldCheck } from "lucide-react";
import { field, label, panel } from "./styles";

type Props = {
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
};

export function ContactFields({ name, setName, phone, setPhone }: Props) {
  return (
    <section className={`${panel} p-5 sm:p-6`}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5F3FB] text-[#367FA8]">
          <ShieldCheck
            size={19}
            aria-hidden="true"
          />
        </span>

        <h2 className="text-lg font-extrabold">
          Contact information
        </h2>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Full name
          <input
            required
            autoComplete="name"
            maxLength={100}
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Your full name"
            className={field}
          />
        </label>

        <label className={label}>
          Mobile number
          <input
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10)
              )
            }
            placeholder="10-digit mobile number"
            className={field}
          />
        </label>
      </div>
    </section>
  );
}
