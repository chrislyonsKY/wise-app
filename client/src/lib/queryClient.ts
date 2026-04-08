import { QueryClient } from "@tanstack/react-query";

const API_BASE = (window as unknown as Record<string, string>)["__PORT_5000__"]?.startsWith("__")
  ? ""
  : ((window as unknown as Record<string, string>)["__PORT_5000__"] ?? "");

export { API_BASE };

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn =
  <T>(options: { on401: UnauthorizedBehavior }) =>
  async ({ queryKey }: { queryKey: readonly unknown[] }): Promise<T> => {
    const url = `${API_BASE}${queryKey[0]}`;
    const params = queryKey[1] as Record<string, unknown> | undefined;

    let fullUrl = url;
    if (params) {
      const qs = new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)])
        )
      ).toString();
      if (qs) fullUrl += "?" + qs;
    }

    const res = await fetch(fullUrl);
    if (options.on401 === "returnNull" && res.status === 401) return null as T;
    await throwIfResNotOk(res);
    return res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 min
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
