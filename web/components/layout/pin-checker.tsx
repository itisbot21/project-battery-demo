"use client";

import { useRef, useState, type FormEvent } from "react";
import { Notice } from "@/components/design/commerce-ui";

export function PinChecker() {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [serviceable, setServiceable] = useState(false);
  const [pending, setPending] = useState(false);
  const request = useRef(0);

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = ++request.current;
    setPending(true);
    setMessage("");
    setServiceable(false);
    try {
      const response = await fetch("/api/serviceability?pin=" + encodeURIComponent(pin), { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (id !== request.current) return;
      setServiceable(data.serviceable === true);
      setMessage(data.serviceable
        ? "Free delivery and installation are available in " + data.city + "."
        : "This PIN code is outside our current delivery area.");
    } catch {
      if (id === request.current) setMessage("We couldn’t check delivery. Please try again.");
    } finally {
      if (id === request.current) setPending(false);
    }
  }

  return (
    <form className="pin-form" onSubmit={check}>
      <label>Delivery PIN code
        <input className="store-input" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="[0-9]{6}"
          placeholder="Enter 6-digit PIN" required value={pin} onChange={(event) => {
            request.current++;
            setPin(event.target.value.replace(/\D/g, ""));
            setPending(false);
            setMessage("");
          }} />
      </label>
      <button className="shop-button" disabled={pending}>{pending ? "Checking…" : "Check PIN"}</button>
      {message && <div className="pin-result"><Notice tone={serviceable ? "success" : "critical"}>{message}</Notice></div>}
    </form>
  );
}
