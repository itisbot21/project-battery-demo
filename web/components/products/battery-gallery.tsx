"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ZoomIn } from "lucide-react";
import { useState } from "react";
import { ModalSurface } from "@/components/design/modal";
import { BatteryImage } from "./battery-image";

export function BatteryGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const selected = images[active];
  const photo = title + (images.length > 1 ? " photo " + (active + 1) : "");

  const thumbs = images.length > 1 && <div className="gallery-thumbs" role="group" aria-label="Choose a photo">
    {images.map((image, index) => <button type="button" key={image + index} onClick={() => setActive(index)}
      aria-pressed={index === active} aria-label={"Show photo " + (index + 1)}>
      <BatteryImage src={image} alt="" />
    </button>)}
  </div>;

  return <section className="product-gallery" aria-label="Product photos">
    {selected ? <Dialog.Root>
      <Dialog.Trigger className="gallery-enlarge" aria-label={"Enlarge " + photo}>
        <BatteryImage src={selected} alt={photo} large />
        <span className="gallery-zoom-icon"><ZoomIn size={20} aria-hidden="true" /></span>
      </Dialog.Trigger>
      <ModalSurface title={title} kind="gallery"><BatteryImage src={selected} alt={photo} large />{thumbs}</ModalSurface>
    </Dialog.Root> : <BatteryImage alt="" large />}
    {thumbs}
  </section>;
}
