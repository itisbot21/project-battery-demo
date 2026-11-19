
import { validImageReference } from "./image-reference";

/** Validation shared by the admin create/update Server Actions. */
export type ProductDraft = {
    brand: string;
    model: string;
    category: string;
    capacityAh: number | null;
    warrantyMonths: number | null;
    description: string | null;
    imageUrls: string[];
    features: string[];
    specifications: Record<string, string>;
    warrantyFreeMonths: number | null;
    warrantyProRataMonths: number | null;
    seoTitle: string | null;
    seoDescription: string | null;
    mrpPaise: number;
    withoutExchangePaise: number;
    withExchangePaise: number;
    stock: number;
    active: boolean;
};

function field(data: FormData, name: string) {
    const raw = data.get(name);
    return typeof raw === "string" ? raw.trim() : "";
}

function money(value: string): number | null {
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(value)) return null;

    const [rupees, decimals = ""] = value.split(".");

    const paise =
        Number(rupees) * 100 +
        Number(decimals.padEnd(2, "0"));

    return Number.isSafeInteger(paise) &&
        paise <= 2_000_000_000
        ? paise
        : null;
}

function integer(
    value: string,
    allowEmpty: boolean
): number | null | undefined {
    if (allowEmpty && value === "") return null;
    if (!/^\d+$/.test(value)) return undefined;

    const result = Number(value);

    return Number.isSafeInteger(result) &&
        result <= 1_000_000
        ? result
        : undefined;
}

function parseLines(
    value: string,
    maxLines: number,
    maxLength: number
): string[] | null {
    if (value.length > 5000) return null;

    const lines = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    return lines.length <= maxLines &&
        lines.every((line) => line.length <= maxLength)
        ? lines
        : null;
}

function parseImageUrls(data: FormData, existing: string[]): string[] | null {
    try {
        const raw: unknown = JSON.parse(
            field(data, "imageUrls") || "[]"
        );

        if (!Array.isArray(raw) || raw.length > Math.max(5, existing.length)) {
            return null;
        }

        if (
            !raw.every(
                (url) =>
                    typeof url === "string" &&
                    (existing.includes(url) || validImageReference(url))
            )
        ) {
            return null;
        }

        return [...new Set(raw as string[])];
    } catch {
        return null;
    }
}

export function parseProductDraft(
    data: FormData,
    existingLegacyCategory?: string,
    existingImages: string[] = []
): {
    draft: ProductDraft;
    vehicleIds: number[];
} | null {
    const brand = field(data, "brand");
    const model = field(data, "model");
    const category = field(data, "category");

    const capacityAh = integer(
        field(data, "capacity"),
        true
    );

    const warrantyMonths = integer(
        field(data, "warranty"),
        true
    );

    const warrantyFreeMonths = integer(
        field(data, "warrantyFree"),
        true
    );

    const warrantyProRataMonths = integer(
        field(data, "warrantyProRata"),
        true
    );

    const stock = integer(
        field(data, "stock"),
        false
    );

    const mrpPaise = money(field(data, "mrp"));

    const withoutExchangePaise = money(
        field(data, "withoutExchange")
    );

    const withExchangePaise = money(
        field(data, "withExchange")
    );

    const description = field(data, "description");
    const seoTitle = field(data, "seoTitle");
    const seoDescription = field(data, "seoDescription");

    const features = parseLines(
        field(data, "features"),
        15,
        200
    );

    const specLines = parseLines(
        field(data, "specifications"),
        24,
        240
    );

    const imageUrls = parseImageUrls(data, existingImages);
    const vehicleValues = data.getAll("vehicleIds");

    // VALIDATE PRODUCT DATA
    if (
        brand.length < 2 ||
        brand.length > 80 ||
        model.length < 2 ||
        model.length > 120 ||
        !(
            category === "Car" ||
            category === "Bike" ||
            (category && category === existingLegacyCategory)
        ) ||
        capacityAh === undefined ||
        (capacityAh !== null && capacityAh < 1) ||
        warrantyMonths === undefined ||
        (warrantyMonths !== null && warrantyMonths < 1) ||
        warrantyFreeMonths === undefined ||
        warrantyProRataMonths === undefined ||
        (
            warrantyFreeMonths !== null &&
            warrantyFreeMonths < 1
        ) ||
        (
            warrantyProRataMonths !== null &&
            warrantyProRataMonths < 1
        ) ||
        (
            warrantyFreeMonths !== null ||
            warrantyProRataMonths !== null
        ) && (
            warrantyMonths === null ||
            (warrantyFreeMonths ?? 0) +
            (warrantyProRataMonths ?? 0) >
            warrantyMonths
        ) ||
        stock == null ||
        mrpPaise === null ||
        withoutExchangePaise === null ||
        withExchangePaise === null ||
        mrpPaise <= 0 ||
        withExchangePaise <= 0 ||
        withoutExchangePaise <= 0 ||
        withExchangePaise > withoutExchangePaise ||
        withoutExchangePaise > mrpPaise ||
        description.length > 6000 ||
        seoTitle.length > 70 ||
        seoDescription.length > 160 ||
        !features ||
        !specLines ||
        !imageUrls ||
        vehicleValues.length > 250
    ) {
        return null;
    }

    // PARSE SPECIFICATIONS
    const specifications: Record<string, string> = {};

    for (const line of specLines) {
        const separator = line.indexOf(":");

        if (separator < 1) return null;

        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();

        if (
            !key ||
            key.length > 60 ||
            !value ||
            value.length > 180 ||
            key === "__proto__" ||
            key === "constructor" ||
            key === "prototype" ||
            Object.hasOwn(specifications, key)
        ) {
            return null;
        }

        specifications[key] = value;
    }

    // PARSE COMPATIBLE VEHICLE IDS
    const vehicleIds: number[] = [];

    for (const raw of vehicleValues) {
        if (
            typeof raw !== "string" ||
            !/^\d{1,9}$/.test(raw)
        ) {
            return null;
        }

        const id = Number(raw);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return null;
        }

        vehicleIds.push(id);
    }

    return {
        draft: {
            brand,
            model,
            category,
            capacityAh,
            warrantyMonths,
            warrantyFreeMonths,
            warrantyProRataMonths,
            description: description || null,
            imageUrls,
            features,
            specifications,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            mrpPaise,
            withoutExchangePaise,
            withExchangePaise,
            stock,
            active: data.get("active") === "on",
        },

        vehicleIds: [...new Set(vehicleIds)],
    };
}
