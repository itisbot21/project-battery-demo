
export type VehicleKind = "car" | "bike";

export type VehicleManufacturer = {
    name: string;
    slug: string;
    models: readonly string[];
};

export const vehicleManufacturers: Record<
    VehicleKind,
    readonly VehicleManufacturer[]
> = {
    car: [
        {
            name: "Maruti Suzuki",
            slug: "maruti-suzuki",
            models: ["Swift", "Baleno", "Wagon R"],
        },
        {
            name: "Hyundai",
            slug: "hyundai",
            models: ["i20", "Creta", "Venue"],
        },
        {
            name: "Tata",
            slug: "tata",
            models: ["Nexon", "Punch", "Tiago"],
        },
        {
            name: "Honda",
            slug: "honda",
            models: ["City", "Amaze", "Elevate"],
        },
        {
            name: "Toyota",
            slug: "toyota",
            models: [
                "Glanza",
                "Innova Crysta",
                "Urban Cruiser Hyryder",
            ],
        },
        {
            name: "Kia",
            slug: "kia",
            models: ["Seltos", "Sonet", "Carens"],
        },
        {
            name: "Mahindra",
            slug: "mahindra",
            models: ["Scorpio-N", "Bolero", "XUV700"],
        },
        {
            name: "MG",
            slug: "mg",
            models: ["Hector", "Astor", "Gloster"],
        },
        {
            name: "Volkswagen",
            slug: "volkswagen",
            models: ["Polo", "Virtus", "Taigun"],
        },
        {
            name: "Skoda",
            slug: "skoda",
            models: ["Kushaq", "Slavia", "Kylaq"],
        },
        {
            name: "Nissan",
            slug: "nissan",
            models: ["Magnite"],
        },
        {
            name: "Renault",
            slug: "renault",
            models: ["Kwid", "Triber", "Kiger"],
        },
    ],

    bike: [
        {
            name: "Honda",
            slug: "honda",
            models: ["Activa", "Shine", "SP 125"],
        },
        {
            name: "Hero",
            slug: "hero",
            models: ["Splendor Plus", "Passion", "Xtreme 125R"],
        },
        {
            name: "Bajaj",
            slug: "bajaj",
            models: ["Pulsar 150", "Platina", "Avenger"],
        },
        {
            name: "TVS",
            slug: "tvs",
            models: ["Jupiter", "Apache RTR 160", "Ntorq"],
        },
        {
            name: "Royal Enfield",
            slug: "royal-enfield",
            models: ["Classic 350", "Hunter 350", "Meteor 350"],
        },
        {
            name: "Yamaha",
            slug: "yamaha",
            models: ["FZ", "R15", "Fascino"],
        },
        {
            name: "Suzuki",
            slug: "suzuki",
            models: ["Access 125", "Gixxer", "Burgman Street"],
        },
        {
            name: "KTM",
            slug: "ktm",
            models: ["Duke 200", "RC 200"],
        },
        {
            name: "Jawa",
            slug: "jawa",
            models: ["42", "Perak"],
        },
    ],
};

export function getVehicleManufacturer(
    kind: VehicleKind,
    slug: string
) {
    return vehicleManufacturers[kind].find(
        (manufacturer) => manufacturer.slug === slug
    );
}