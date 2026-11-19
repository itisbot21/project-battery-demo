
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

import { auth } from "@/lib/auth";


const MAX_IMAGE_SIZE = 3_000_000;

const allowedTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

function validImageSignature(
    bytes: Uint8Array,
    mimeType: string
): boolean {
    // JPEG
    if (mimeType === "image/jpeg") {
        return (
            bytes[0] === 0xff &&
            bytes[1] === 0xd8 &&
            bytes[2] === 0xff
        );
    }

    // PNG
    if (mimeType === "image/png") {
        const signature = [
            137, 80, 78, 71, 13, 10, 26, 10,
        ];

        return signature.every(
            (value, index) => bytes[index] === value
        );
    }

    // WEBP
    if (mimeType === "image/webp") {
        const header = String.fromCharCode(
            ...bytes.slice(0, 4)
        );

        const format = String.fromCharCode(
            ...bytes.slice(8, 12)
        );

        return header === "RIFF" && format === "WEBP";
    }

    return false;
}

export async function POST(request: Request) {
    // CHECK ADMIN AUTHENTICATION
    let session;

    try {
        session = await auth.api.getSession({
            headers: request.headers,
        });
    } catch (error) {
        console.error(
            "Image upload authentication failed:",
            error
        );

        return Response.json(
            { error: "Authentication unavailable." },
            { status: 503 }
        );
    }

    if (!session) {
        return Response.json(
            { error: "Please sign in as an admin." },
            { status: 401 }
        );
    }

    const roles =
        session.user.role?.split(",").map(
            (role) => role.trim()
        ) ?? [];

    if (!roles.includes("admin")) {
        return Response.json(
            { error: "Admin access required." },
            { status: 403 }
        );
    }

    // PREVENT CROSS-ORIGIN UPLOADS
    const origin = request.headers.get("origin");

    if (
        origin &&
        origin !== new URL(request.url).origin
    ) {
        return Response.json(
            { error: "Invalid upload origin." },
            { status: 403 }
        );
    }

    // EARLY SIZE CHECK
    const contentLength = Number(
        request.headers.get("content-length") || 0
    );

    if (contentLength > 3_500_000) {
        return Response.json(
            { error: "Upload is too large." },
            { status: 413 }
        );
    }

    // READ UPLOADED IMAGE
    let file: FormDataEntryValue | null;

    try {
        const formData = await request.formData();
        file = formData.get("image");
    } catch {
        return Response.json(
            { error: "Invalid image upload." },
            { status: 400 }
        );
    }

    if (!(file instanceof File)) {
        return Response.json(
            { error: "Please select a photo." },
            { status: 400 }
        );
    }

    if (
        file.size === 0 ||
        file.size > MAX_IMAGE_SIZE
    ) {
        return Response.json(
            {
                error:
                    "Image must be smaller than 3 MB.",
            },
            { status: 400 }
        );
    }

    // VALIDATE IMAGE FORMAT
    const extension = allowedTypes[file.type];

    if (!extension) {
        return Response.json(
            {
                error:
                    "Only JPEG, PNG and WebP images are allowed.",
            },
            { status: 400 }
        );
    }

    // VERIFY FILE CONTENT, NOT JUST MIME TYPE
    const signature = new Uint8Array(
        await file.slice(0, 16).arrayBuffer()
    );

    if (
        !validImageSignature(
            signature,
            file.type
        )
    ) {
        return Response.json(
            {
                error:
                    "The file does not match its image type.",
            },
            { status: 400 }
        );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return Response.json({ error: "Image uploads are disabled. Save an existing image URL in the product form." }, { status: 503 });
    }

    try {
        const filename =
            `products/${randomUUID()}.${extension}`;

        const blob = await put(
            filename,
            file,
            {
                access: "public",
                contentType: file.type,
                addRandomSuffix: true,
            }
        );

        return Response.json(
            { url: blob.url },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "Product image upload failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Image upload unavailable. Check cloud storage configuration.",
            },
            { status: 503 }
        );
    }
}