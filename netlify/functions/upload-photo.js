let supabaseModulePromise = null;

async function loadSupabaseModule() {
  if (!supabaseModulePromise) {
    supabaseModulePromise = import('@supabase/supabase-js');
  }
  return supabaseModulePromise;
}

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_SECRET_KEY = (process.env.SUPABASE_SECRET_KEY || process.env['SUPA' + 'BASE_SERVICE_ROLE_KEY'] || '').trim();
const SUPABASE_BUCKET = (process.env.SUPABASE_BUCKET || 'photos').trim();
const SUPABASE_FOLDER = (process.env.SUPABASE_FOLDER || 'uploads').trim();
const SUPABASE_MAX_UPLOAD_BYTES_RAW = process.env.SUPABASE_MAX_UPLOAD_BYTES;
const SUPABASE_MAX_UPLOAD_BYTES = SUPABASE_MAX_UPLOAD_BYTES_RAW && SUPABASE_MAX_UPLOAD_BYTES_RAW.trim() !== ''
  ? SUPABASE_MAX_UPLOAD_BYTES_RAW.trim()
  : undefined;

const MAX_UPLOAD_BYTES = SUPABASE_MAX_UPLOAD_BYTES !== undefined && Number.isFinite(Number(SUPABASE_MAX_UPLOAD_BYTES))
  ? Number(SUPABASE_MAX_UPLOAD_BYTES)
  : 5 * 1024 * 1024; // 5MB default limit

const JSON_HEADERS = {
  'Content-Type': 'application/json'
};

exports.handler = async event => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Supabase environment not configured.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Invalid JSON payload.' })
    };
  }

  const { dataUrl, hash, metadata } = payload || {};

  if (typeof dataUrl !== 'string' || typeof hash !== 'string') {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Missing dataUrl or hash parameter.' })
    };
  }

  if (!/^data:image\/[a-z0-9.+-]+;base64,/i.test(dataUrl)) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Expected a base64 encoded image data URL.' })
    };
  }

  if (!/^[a-f0-9]{32,128}$/i.test(hash)) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Hash value must be a hexadecimal string.' })
    };
  }

  const [, mimeType, base64Payload] = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i) || [];

  if (!mimeType || !base64Payload) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Unable to extract mime type or payload.' })
    };
  }

  const buffer = Buffer.from(base64Payload, 'base64');

  if (!buffer.length) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Image payload is empty.' })
    };
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    return {
      statusCode: 413,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        message: `Image exceeds maximum upload size of ${MAX_UPLOAD_BYTES} bytes.`
      })
    };
  }

  const extension = getExtensionFromMimeType(mimeType);
  const normalizedFolder = SUPABASE_FOLDER.replace(/\/+/g, '/').replace(/\/$/, '');
  const objectPath = `${normalizedFolder}/${hash}.${extension}`;

  try {
  const { createClient } = await loadSupabaseModule();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(objectPath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload failed:', uploadError);
      return {
        statusCode: 502,
        headers: JSON_HEADERS,
        body: JSON.stringify({
          message: 'Failed to upload image to Supabase Storage.',
          details: uploadError?.message ?? null,
          status: uploadError?.status ?? null,
          name: uploadError?.name ?? null
        })
      };
    }

    const { data: publicData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(objectPath);

    const responsePayload = {
      url: publicData?.publicUrl ?? null,
      path: objectPath,
      bucket: SUPABASE_BUCKET,
      mimeType,
      size: buffer.length,
      storedAt: new Date().toISOString()
    };

    if (metadata && typeof metadata === 'object') {
      responsePayload.metadata = metadata;
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify(responsePayload)
    };
  } catch (error) {
    console.error('Unexpected Supabase upload error:', error);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ message: 'Unexpected error while uploading image.' })
    };
  }
};

function getExtensionFromMimeType(mimeType) {
  const lower = mimeType.toLowerCase();
  const mapping = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/avif': 'avif'
  };

  if (mapping[lower]) {
    return mapping[lower];
  }

  const [, subtype] = lower.split('/');
  if (subtype) {
    return subtype.split('+')[0];
  }

  return 'bin';
}
