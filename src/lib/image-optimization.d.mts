export function prepareImage(bytes: Uint8Array, maxEdge?: number): Promise<{
  data: Buffer; width: number; height: number; originalWidth: number | undefined;
  originalHeight: number | undefined; originalBytes: number; savedBytes: number;
} | null>;
