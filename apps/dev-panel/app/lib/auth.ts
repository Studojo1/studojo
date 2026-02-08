// Simple auth check - verify user has dev role
export async function checkDevAccess(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/check-role", {
      credentials: "include",
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.role === "dev" || data.role === "admin";
  } catch {
    return false;
  }
}

