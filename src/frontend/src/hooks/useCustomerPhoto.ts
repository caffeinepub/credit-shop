import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useEffect, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

const STORAGE_KEY = "customer-photos";

function getPhotoMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setPhotoHash(customerId: string, hash: string) {
  const map = getPhotoMap();
  map[customerId] = hash;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

let clientPromise: Promise<StorageClient> | null = null;

async function getStorageClient(): Promise<StorageClient> {
  if (!clientPromise) {
    clientPromise = loadConfig().then((config) => {
      const agent = new HttpAgent({ host: config.backend_host });
      return new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
    });
  }
  return clientPromise;
}

export function useCustomerPhoto(customerId: bigint) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const customerKey = customerId.toString();

  useEffect(() => {
    const map = getPhotoMap();
    const hash = map[customerKey];
    if (!hash) return;

    let cancelled = false;
    getStorageClient()
      .then((client) => client.getDirectURL(hash))
      .then((url) => {
        if (!cancelled) setPhotoUrl(url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [customerKey]);

  const uploadPhoto = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const client = await getStorageClient();
        const { hash } = await client.putFile(bytes);
        setPhotoHash(customerKey, hash);
        const url = await client.getDirectURL(hash);
        setPhotoUrl(url);
      } finally {
        setIsUploading(false);
      }
    },
    [customerKey],
  );

  return { photoUrl, uploadPhoto, isUploading };
}
