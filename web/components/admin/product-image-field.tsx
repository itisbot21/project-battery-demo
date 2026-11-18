
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
    ArrowLeft,
    ArrowRight,
    ImagePlus,
    Trash2,
} from "lucide-react";

type Props = {
    initialUrls: string[];
    onUploadingChange?: (uploading: boolean) => void;
};

export function ProductImageField({
    initialUrls,
    onUploadingChange,
}: Props) {
    const [urls, setUrls] = useState<string[]>(initialUrls);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const fileInput = useRef<HTMLInputElement>(null);

    // UPLOAD PRODUCT IMAGE
    async function upload(file: File | undefined) {
        if (!file || uploading) return;

        if (urls.length >= 5) {
            setError("Maximum five photos per battery.");
            return;
        }

        const acceptedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (
            !acceptedTypes.includes(file.type) ||
            file.size > 3_000_000
        ) {
            setError(
                "Choose a JPEG, PNG, or WebP photo smaller than 3 MB."
            );
            return;
        }

        setUploading(true);
        onUploadingChange?.(true);
        setError("");

        try {
            const data = new FormData();
            data.append("image", file);

            const response = await fetch(
                "/api/admin/product-images",
                {
                    method: "POST",
                    body: data,
                }
            );

            const result: {
                url?: string;
                error?: string;
            } = await response.json();

            if (!response.ok || !result.url) {
                throw new Error(
                    result.error || "Image upload failed."
                );
            }

            setUrls((current) => [
                ...current,
                result.url!,
            ]);
        } catch (caught) {
            setError(
                caught instanceof Error
                    ? caught.message
                    : "Image upload failed."
            );
        } finally {
            setUploading(false);
            onUploadingChange?.(false);

            if (fileInput.current) {
                fileInput.current.value = "";
            }
        }
    }

    // CHANGE IMAGE ORDER
    function move(index: number, change: number) {
        setUrls((current) => {
            const destination = index + change;

            if (
                destination < 0 ||
                destination >= current.length
            ) {
                return current;
            }

            const next = [...current];

            [next[index], next[destination]] = [
                next[destination],
                next[index],
            ];

            return next;
        });
    }

    // REMOVE IMAGE FROM PRODUCT
    function remove(index: number) {
        setUrls((current) =>
            current.filter((_, i) => i !== index)
        );
    }

    return (
        <section className="rounded-2xl border border-[#DDEAF1] bg-white p-5 shadow-sm sm:p-6">

            {/* HEADER */}
            <h2 className="text-lg font-bold text-[#193B54]">
                Product photos
            </h2>

            <p className="mt-1 text-sm text-[#698092]">
                Upload up to 5 photos of the battery.
                The first photo will be displayed as
                the main product image.
            </p>

            {/* IMAGE DATA SENT TO ADMIN ACTION */}
            <input
                type="hidden"
                name="imageUrls"
                value={JSON.stringify(urls)}
                readOnly
            />

            {/* IMAGE GRID */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">

                {urls.map((url, index) => (
                    <div
                        key={url}
                        className="overflow-hidden rounded-xl border border-[#D5E6EF] bg-[#F3F9FC]"
                    >

                        {/* IMAGE PREVIEW */}
                        <div className="relative h-28 w-full">
                            <Image
                                src={url}
                                alt={`Product photo ${index + 1}`}
                                fill
                                sizes="160px"
                                unoptimized
                                className="object-contain p-2"
                            />

                            {/* MAIN IMAGE INDICATOR */}
                            {index === 0 && (
                                <span className="absolute left-2 top-2 rounded-md bg-[#50C878] px-2 py-1 text-[10px] font-bold text-[#123E29]">
                                    Main
                                </span>
                            )}
                        </div>

                        {/* IMAGE CONTROLS */}
                        <div className="flex items-center justify-center gap-1 border-t border-[#D5E6EF] bg-white p-1">

                            {/* MOVE LEFT */}
                            <button
                                type="button"
                                onClick={() => move(index, -1)}
                                disabled={index === 0 || uploading}
                                aria-label={`Move photo ${index + 1} left`}
                                className="rounded-md p-2 hover:bg-[#EDF7FC] disabled:opacity-25"
                            >
                                <ArrowLeft size={16} />
                            </button>

                            {/* MOVE RIGHT */}
                            <button
                                type="button"
                                onClick={() => move(index, 1)}
                                disabled={
                                    index === urls.length - 1 ||
                                    uploading
                                }
                                aria-label={`Move photo ${index + 1} right`}
                                className="rounded-md p-2 hover:bg-[#EDF7FC] disabled:opacity-25"
                            >
                                <ArrowRight size={16} />
                            </button>

                            {/* REMOVE PHOTO */}
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                disabled={uploading}
                                aria-label={`Remove photo ${index + 1}`}
                                className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-25"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* UPLOAD BUTTON */}
                {urls.length < 5 && (
                    <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#9AC7DF] bg-[#F5FAFD] px-3 text-center text-sm font-semibold text-[#327FA4] hover:bg-[#EBF6FC]">

                        <ImagePlus
                            size={25}
                            aria-hidden="true"
                        />

                        {uploading
                            ? "Uploading..."
                            : "Upload photo"}

                        <span className="text-[11px] font-normal text-[#6A8596]">
                            JPEG / PNG / WebP · Max 3 MB
                        </span>

                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            disabled={uploading}
                            className="sr-only"
                            onChange={(event) =>
                                void upload(
                                    event.target.files?.[0]
                                )
                            }
                        />
                    </label>
                )}
            </div>

            {/* UPLOAD ERROR */}
            {error && (
                <p
                    role="alert"
                    className="mt-3 text-sm text-red-700"
                >
                    {error}
                </p>
            )}

            {/* UPLOAD STATUS */}
            {uploading && (
                <p
                    role="status"
                    className="mt-3 text-sm text-[#327FA4]"
                >
                    Saving photo to cloud storage...
                </p>
            )}

            <p className="mt-3 text-xs text-[#718A9A]">
                Removing a photo here removes it from
                the product, not from cloud storage.
            </p>
        </section>
    );
}