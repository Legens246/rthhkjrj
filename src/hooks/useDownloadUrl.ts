import { useState, useCallback } from "react";

const OWNER = "Legens246";
const REPO = "Legens-X-Launcher-Dowload";
const ALLOW_PRERELEASE = false;
const FALLBACK_URL = `https://github.com/${OWNER}/${REPO}/releases/latest`;

export function useDownloadUrl() {
  const [loading, setLoading] = useState(false);

  const download = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = ALLOW_PRERELEASE
        ? `https://api.github.com/repos/${OWNER}/${REPO}/releases`
        : `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;

      const res = await fetch(endpoint, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

      let release: any;
      if (ALLOW_PRERELEASE) {
        const releases = await res.json();
        release = releases.find((r: any) => !r.draft);
      } else {
        release = await res.json();
      }

      if (!release) {
        window.location.href = FALLBACK_URL;
        return;
      }

      const assets: any[] = release.assets || [];
      const exe = assets.find((a) => a.name?.toLowerCase().endsWith(".exe"));
      const zip = assets.find((a) => a.name?.toLowerCase().endsWith(".zip"));
      const any = assets[0];

      const url =
        exe?.browser_download_url ||
        zip?.browser_download_url ||
        any?.browser_download_url ||
        release.html_url ||
        FALLBACK_URL;

      window.location.href = url;
    } catch (e) {
      console.error(e);
      window.location.href = FALLBACK_URL;
    } finally {
      setTimeout(() => setLoading(false), 1200);
    }
  }, []);

  return { download, loading };
}
