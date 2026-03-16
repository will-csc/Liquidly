const BACKEND_URL = process.env.BACKEND_URL || 'https://liquidly-backend.onrender.com';

const redactHeaders = (headers) => {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) {
    if (!k) continue;
    const key = String(k).toLowerCase();
    if (key === 'authorization' || key === 'cookie' || key === 'set-cookie') continue;
    out[k] = v;
  }
  return out;
};

const tryExtractMessage = (body, contentType) => {
  if (!contentType || !contentType.includes('application/json')) return null;
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') return parsed.message;
    return null;
  } catch {
    return null;
  }
};

module.exports = async (req, res) => {
  const start = Date.now();
  const method = req.method || 'GET';
  const url = new URL(req.url, 'http://localhost');

  const targetUrl = new URL(BACKEND_URL);
  targetUrl.pathname = url.pathname;
  targetUrl.search = url.search;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];

  let bodyBuffer = null;
  if (method !== 'GET' && method !== 'HEAD') {
    bodyBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(Buffer.from(c)));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method,
      headers,
      body: bodyBuffer || undefined,
      redirect: 'manual',
    });

    const contentType = upstream.headers.get('content-type') || '';
    const upstreamBody = Buffer.from(await upstream.arrayBuffer());

    res.statusCode = upstream.status;
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'transfer-encoding') return;
      if (lower === 'content-encoding') return;
      res.setHeader(key, value);
    });

    const ms = Date.now() - start;
    if (upstream.status >= 400) {
      const bodyForLog = upstreamBody.length > 8192 ? upstreamBody.subarray(0, 8192).toString('utf8') : upstreamBody.toString('utf8');
      const message = tryExtractMessage(bodyForLog, contentType);
      console.error('[API Proxy]', {
        method,
        path: `${url.pathname}${url.search}`,
        status: upstream.status,
        ms,
        message: message || null,
        headers: redactHeaders(req.headers),
      });
    } else {
      console.log('[API Proxy]', { method, path: `${url.pathname}${url.search}`, status: upstream.status, ms });
    }

    res.end(upstreamBody);
  } catch (error) {
    const ms = Date.now() - start;
    console.error('[API Proxy] Upstream error', {
      method,
      path: `${url.pathname}${url.search}`,
      ms,
      error: error instanceof Error ? error.message : String(error),
    });
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ message: 'Backend unavailable' }));
  }
};
