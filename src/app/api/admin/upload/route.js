import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (it will automatically pick up CLOUDINARY_URL from env)
cloudinary.config({
  secure: true,
});

// #6 FIX: Validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export async function POST(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // #6 FIX: Validate file type \u2014 only allow safe image formats
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Only JPEG, PNG, WebP, GIF, and AVIF images are allowed.` },
        { status: 400 }
      );
    }

    // #6 FIX: Validate file size \u2014 reject anything over 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum allowed size is 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'menyphis_products',
          resource_type: 'image', // force image-only on Cloudinary's side too
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url }, { status: 200 });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

