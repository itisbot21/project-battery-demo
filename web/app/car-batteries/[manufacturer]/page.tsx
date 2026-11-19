import { VerifiedManufacturer } from "@/components/manufacturers/verified-manufacturer";

export default function CarManufacturer({ params }: PageProps<"/car-batteries/[manufacturer]">) {
  return <VerifiedManufacturer params={params} type="Car" />;
}
