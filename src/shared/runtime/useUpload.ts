// Runtime file upload — multipart/form-data POST to the platform's R2
// proxy at https://chat.aiwaves.tech/aigram/api/upload.
//
// The returned URL is publicly readable; do not upload sensitive data.

import { useCallback, useState } from 'react';

const UPLOAD_URL = 'https://chat.aiwaves.tech/aigram/api/upload';

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
}

export interface UseUpload {
  upload: (file: Blob, filename?: string) => Promise<UploadResult>;
  uploading: boolean;
  error: Error | null;
}

export function useUpload(): UseUpload {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (file: Blob, filename?: string): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      // FormData.append's third arg sets the multipart filename; when blob is
      // a File the browser uses file.name; for raw Blob, provide a name.
      if (filename) form.append('file', file, filename);
      else form.append('file', file);
      // NO credentials:'include'. The platform sets
      // Access-Control-Allow-Origin: *, which Safari/WebKit will then
      // reject as "Load failed" if the request also carries credentials.
      // Plain anonymous fetch is correct for this endpoint.
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        let detail = '';
        try { detail = await res.text(); } catch { /* ignore */ }
        throw new Error(`upload HTTP ${res.status}${detail ? ` — ${detail.slice(0, 120)}` : ''}`);
      }
      const json = (await res.json()) as UploadResult;
      if (!json.url) throw new Error('upload response had no url');
      return json;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error };
}
