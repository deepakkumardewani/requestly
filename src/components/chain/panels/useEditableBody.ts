import { useEffect, useState } from "react";

export function useEditableBody(bodyContent: string | undefined, name: string) {
  const [editedBody, setEditedBody] = useState(bodyContent ?? "");

  // Sync when panel opens with a different request
  useEffect(() => {
    setEditedBody(bodyContent ?? "");
  }, [bodyContent, name]);

  const isDirty = editedBody !== (bodyContent ?? "");

  return { editedBody, setEditedBody, isDirty };
}
