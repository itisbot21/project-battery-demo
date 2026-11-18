
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ProductImageField } from "./product-image-field";

export type VehicleOption = {
    id: number;
    type: string;
    brand: string;
    model: string;
    variant: string;
};

export type ProductEditable = {
    id: number;
    slug: string;
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

type Props = {
    action: (formData: FormData) => Promise<void>;
    product?: ProductEditable;
    vehicles: VehicleOption[];
    selectedVehicleIds?: number[];
};

const fieldClass =
    "mt-2 w-full min-w-0 rounded-xl border border-[#CDDDE7] bg-white px-3.5 py-3 text-sm text-[#183B52] outline-none placeholder:text-[#93A6B2] focus:border-[#398DB9] focus:ring-2 focus:ring-[#89CFF0]/25";

const sectionClass =
    "rounded-2xl border border-[#DDEAF1] bg-white p-5 shadow-sm sm:p-6";

function money(paise: number) {
    return (paise / 100).toFixed(2);
}

function optional(value: string | number | null) {
    return value ?? "";
}

function SaveButton({
    disabled,
    isEdit,
}: {
    disabled: boolean;
    isEdit: boolean;
}) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={disabled || pending}
            className="w-full rounded-xl bg-[#50C878] px-5 py-4 text-sm font-extrabold text-[#123E29] transition-colors hover:bg-[#40B96B] disabled:cursor-wait disabled:opacity-40"
        >
            {pending
                ? "Saving battery..."
                : isEdit
                    ? "Save Product Changes"
                    : "Add Battery to Inventory"}
        </button>
    );
}

export function ProductForm({
    action,
    product,
    vehicles,
    selectedVehicleIds = [],
}: Props) {
    const [category, setCategory] = useState(
        product?.category || "Car"
    );

    const [filter, setFilter] = useState("");

    const [selected, setSelected] = useState(
        () => new Set(selectedVehicleIds)
    );

    const [uploading, setUploading] = useState(false);

    const vehicleList = vehicles.filter(
        (vehicle) =>
            vehicle.type === category &&
            `${vehicle.brand} ${vehicle.model} ${vehicle.variant}`
                .toLowerCase()
                .includes(filter.toLowerCase())
    );

    const selectedForCategory = vehicles.filter(
        (vehicle) =>
            vehicle.type === category &&
            selected.has(vehicle.id)
    ).length;

    return (
        <form
            action={action}
            className="mt-7 space-y-5"
        >
            {/* BATTERY INFORMATION */}
            <section className={sectionClass}>
                <h2 className="text-lg font-bold text-[#193B54]">
                    Battery information
                </h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-[#33596F]">
                        Manufacturer / Brand *

                        <input
                            name="brand"
                            required
                            minLength={2}
                            maxLength={80}
                            defaultValue={product?.brand}
                            placeholder="Exide"
                            className={fieldClass}
                        />
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        Product model / name *

                        <input
                            name="model"
                            required
                            minLength={2}
                            maxLength={120}
                            defaultValue={product?.model}
                            placeholder="DARE DIN66"
                            className={fieldClass}
                        />
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        Category *

                        <select
                            name="category"
                            value={category}
                            onChange={(event) =>
                                setCategory(event.target.value)
                            }
                            required
                            className={fieldClass}
                        >
                            <option value="Car">
                                Car Battery
                            </option>

                            <option value="Bike">
                                Bike Battery
                            </option>

                            {product &&
                                !["Car", "Bike"].includes(
                                    product.category
                                ) && (
                                    <option value={product.category}>
                                        {product.category} (legacy product)
                                    </option>
                                )}
                        </select>
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        Stock quantity *

                        <input
                            name="stock"
                            type="number"
                            min={0}
                            max={1000000}
                            step={1}
                            required
                            defaultValue={product?.stock ?? 0}
                            className={fieldClass}
                        />
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        Capacity (Ah)

                        <input
                            name="capacity"
                            type="number"
                            min={1}
                            step={1}
                            defaultValue={optional(
                                product?.capacityAh ?? null
                            )}
                            placeholder="66"
                            className={fieldClass}
                        />
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        Total warranty (months)

                        <input
                            name="warranty"
                            type="number"
                            min={1}
                            step={1}
                            defaultValue={optional(
                                product?.warrantyMonths ?? null
                            )}
                            placeholder="48"
                            className={fieldClass}
                        />
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        Free replacement warranty (months)

                        <input
                            name="warrantyFree"
                            type="number"
                            min={1}
                            step={1}
                            defaultValue={optional(
                                product?.warrantyFreeMonths ?? null
                            )}
                            placeholder="24"
                            className={fieldClass}
                        />
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        Pro-rata warranty (months)

                        <input
                            name="warrantyProRata"
                            type="number"
                            min={1}
                            step={1}
                            defaultValue={optional(
                                product?.warrantyProRataMonths ?? null
                            )}
                            placeholder="24"
                            className={fieldClass}
                        />
                    </label>
                </div>

                <p className="mt-3 text-xs text-[#6C8494]">
                    Warranty information must come from
                    the manufacturer. The breakdown must
                    not exceed the total warranty period.
                </p>

                {product && (
                    <p className="mt-3 text-xs text-[#6C8494]">
                        Product URL slug:{" "}
                        <code className="font-semibold">
                            {product.slug}
                        </code>
                        {" "}· Stays unchanged when editing.
                    </p>
                )}
            </section>

            {/* PRODUCT PHOTOS */}
            <ProductImageField
                initialUrls={product?.imageUrls ?? []}
                onUploadingChange={setUploading}
            />

            {/* DESCRIPTION AND SPECIFICATIONS */}
            <section className={sectionClass}>
                <h2 className="text-lg font-bold text-[#193B54]">
                    Description & technical details
                </h2>

                <div className="mt-4 space-y-4">
                    <label className="block text-sm font-semibold text-[#33596F]">
                        Product description

                        <textarea
                            name="description"
                            rows={5}
                            maxLength={6000}
                            defaultValue={
                                product?.description ?? ""
                            }
                            placeholder="Enter a description based on verified manufacturer information..."
                            className={fieldClass}
                        />
                    </label>

                    <label className="block text-sm font-semibold text-[#33596F]">
                        Key features — one per line

                        <textarea
                            name="features"
                            rows={5}
                            defaultValue={(
                                product?.features ?? []
                            ).join("\n")}
                            placeholder={
                                "Feature one\nFeature two\nFeature three"
                            }
                            className={fieldClass}
                        />

                        <span className="mt-1 block text-xs font-normal text-[#708797]">
                            Maximum 15 features, up to
                            200 characters each.
                        </span>
                    </label>

                    <label className="block text-sm font-semibold text-[#33596F]">
                        Technical specifications —
                        one Key: Value per line

                        <textarea
                            name="specifications"
                            rows={5}
                            defaultValue={Object.entries(
                                product?.specifications ?? {}
                            )
                                .map(
                                    ([key, value]) =>
                                        `${key}: ${value}`
                                )
                                .join("\n")}
                            placeholder={
                                "Voltage: 12V\nBattery type: Lead-acid"
                            }
                            className={fieldClass}
                        />

                        <span className="mt-1 block text-xs font-normal text-[#708797]">
                            Use specifications verified for
                            this exact battery model.
                        </span>
                    </label>
                </div>
            </section>

            {/* PRICING */}
            <section className={sectionClass}>
                <h2 className="text-lg font-bold text-[#193B54]">
                    GST-inclusive pricing
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <label className="text-sm font-semibold text-[#33596F]">
                        MRP (₹) *

                        <input
                            name="mrp"
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            defaultValue={
                                product
                                    ? money(product.mrpPaise)
                                    : ""
                            }
                            className={fieldClass}
                        />
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        Without exchange (₹) *

                        <input
                            name="withoutExchange"
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            defaultValue={
                                product
                                    ? money(
                                        product.withoutExchangePaise
                                    )
                                    : ""
                            }
                            className={fieldClass}
                        />
                    </label>

                    <label className="text-sm font-semibold text-[#33596F]">
                        With old battery (₹) *

                        <input
                            name="withExchange"
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            defaultValue={
                                product
                                    ? money(
                                        product.withExchangePaise
                                    )
                                    : ""
                            }
                            className={fieldClass}
                        />
                    </label>
                </div>

                <p className="mt-3 rounded-xl bg-[#EAF8F0] px-4 py-3 text-xs text-[#327B50]">
                    Old battery exchange is verified by
                    staff during delivery. If the exchange
                    is rejected, the without-exchange
                    price applies.
                </p>
            </section>

            {/* VEHICLE COMPATIBILITY */}
            <section className={sectionClass}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-[#193B54]">
                        Verified vehicle compatibility
                    </h2>

                    <a
                        href="/admin/vehicles"
                        className="text-xs font-bold text-[#398DB9] hover:underline"
                    >
                        Manage vehicle list
                    </a>
                </div>

                <p className="mt-2 text-sm text-[#708797]">
                    Select only vehicles verified to fit
                    this exact battery model.
                </p>

                {category === "Car" ||
                    category === "Bike" ? (
                    <>
                        <input
                            type="search"
                            value={filter}
                            onChange={(event) =>
                                setFilter(event.target.value)
                            }
                            placeholder="Search manufacturer, model or variant"
                            className={`${fieldClass} mt-4`}
                        />

                        <p className="mt-3 text-xs font-semibold text-[#42647B]">
                            {selectedForCategory} verified{" "}
                            {category.toLowerCase()} vehicle(s)
                            selected
                        </p>

                        {/* HIDDEN VALUES SENT TO SERVER */}
                        {vehicles
                            .filter(
                                (vehicle) =>
                                    vehicle.type === category &&
                                    selected.has(vehicle.id)
                            )
                            .map((vehicle) => (
                                <input
                                    key={vehicle.id}
                                    type="hidden"
                                    name="vehicleIds"
                                    value={vehicle.id}
                                />
                            ))}

                        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-[#DBE9F0] bg-[#F9FCFD] p-2">
                            {vehicleList.map((vehicle) => (
                                <label
                                    key={vehicle.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#2B5068] hover:bg-white"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(
                                            vehicle.id
                                        )}
                                        onChange={(event) => {
                                            setSelected((previous) => {
                                                const next = new Set(
                                                    previous
                                                );

                                                if (
                                                    event.target.checked
                                                ) {
                                                    next.add(vehicle.id);
                                                } else {
                                                    next.delete(
                                                        vehicle.id
                                                    );
                                                }

                                                return next;
                                            });
                                        }}
                                        className="h-4 w-4 shrink-0 accent-[#50C878]"
                                    />

                                    {vehicle.brand} ·{" "}
                                    {vehicle.model} ·{" "}
                                    {vehicle.variant}
                                </label>
                            ))}

                            {vehicleList.length === 0 && (
                                <p className="p-3 text-sm text-[#708797]">
                                    No matching vehicles found.
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="mt-3 text-sm text-[#708797]">
                        Vehicle compatibility cannot be
                        assigned to legacy categories.
                    </p>
                )}
            </section>

            {/* SEO & AVAILABILITY */}
            <section className={sectionClass}>
                <h2 className="text-lg font-bold text-[#193B54]">
                    SEO & availability
                </h2>

                <div className="mt-4 space-y-4">
                    <label className="block text-sm font-semibold text-[#33596F]">
                        SEO title

                        <input
                            name="seoTitle"
                            maxLength={70}
                            defaultValue={
                                product?.seoTitle ?? ""
                            }
                            placeholder="Product title for search engines"
                            className={fieldClass}
                        />
                    </label>

                    <label className="block text-sm font-semibold text-[#33596F]">
                        SEO description

                        <textarea
                            name="seoDescription"
                            rows={3}
                            maxLength={160}
                            defaultValue={
                                product?.seoDescription ?? ""
                            }
                            placeholder="Short description for search results"
                            className={fieldClass}
                        />
                    </label>

                    <label className="flex items-center gap-3 text-sm font-semibold text-[#33596F]">
                        <input
                            type="checkbox"
                            name="active"
                            defaultChecked={
                                product?.active ?? true
                            }
                            className="h-5 w-5 accent-[#50C878]"
                        />

                        Show this product in the store
                    </label>
                </div>
            </section>

            {/* SAVE BUTTON */}
            {uploading && (
                <p
                    role="status"
                    className="text-sm text-[#327FA4]"
                >
                    Finish uploading images before saving.
                </p>
            )}

            <SaveButton
                disabled={uploading}
                isEdit={Boolean(product)}
            />
        </form>
    );
}