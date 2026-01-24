// app/actions/folders.ts
export type Folder = {
  id: string;
  title: string | null;
};

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return data as T;
}

// ✅ GET /api/folders
export async function listFolders(): Promise<{ folders: Folder[] } | Folder[]> {
  return jsonFetch("/api/folders", { method: "GET" });
}

// ✅ POST /api/folders/create
export async function createFolder(title: string) {
  return jsonFetch("/api/folders/create", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

// ✅ PATCH /api/folders/[folderId]
export async function renameFolder(folderId: string, title: string) {
  if (!folderId) throw new Error("missing folderId");
  return jsonFetch(`/api/folders/${folderId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

// ✅ DELETE /api/folders/[folderId]
export async function deleteFolder(folderId: string) {
  if (!folderId) throw new Error("missing folderId");
  return jsonFetch(`/api/folders/${folderId}`, {
    method: "DELETE",
  });
}