import { VerifiedManufacturer } from "@/components/manufacturers/verified-manufacturer";

export default function BikeManufacturer({ params }: PageProps<"/bike-batteries/[manufacturer]">) {
  return <VerifiedManufacturer params={params} type="Bike" />;
}
