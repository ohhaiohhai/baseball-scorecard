"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteGameButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete ${label}? This can't be undone.`)) return;

    setDeleting(true);
    const res = await fetch(`/api/games/${id}`, { method: "DELETE" });

    if (res.ok) {
      // Re-run the server component to refresh the list.
      router.refresh();
    } else {
      setDeleting(false);
      window.alert("Could not delete the game.");
    }
  }

  return (
    <button
      type="button"
      className="btn"
      onClick={handleDelete}
      disabled={deleting}
      aria-label={`Delete ${label}`}
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
