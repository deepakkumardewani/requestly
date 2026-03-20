export type DiffKind = "added" | "removed" | "changed" | "unchanged";

export type DiffNode = {
  key: string;
  kind: DiffKind;
  leftValue: unknown;
  rightValue: unknown;
  // null = leaf; array = object/array node with sub-diffs
  children: DiffNode[] | null;
  // dot-notation path e.g. "user.address.city" or "items[0].name"
  path: string;
};

export type DiffStats = {
  added: number;
  removed: number;
  changed: number;
};

export type DiffResult = {
  nodes: DiffNode[];
  stats: DiffStats;
};

export const MAX_DIFF_DEPTH = 50;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildPath(
  parentPath: string,
  key: string,
  isArrayIndex: boolean,
): string {
  if (!parentPath) return key;
  return isArrayIndex ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
}

function accumulateStats(nodes: DiffNode[], stats: DiffStats): void {
  for (const node of nodes) {
    if (node.children !== null) {
      // Interior node — recurse into children, don't count the node itself
      accumulateStats(node.children, stats);
    } else {
      // Leaf node — count it
      if (node.kind === "added") stats.added++;
      else if (node.kind === "removed") stats.removed++;
      else if (node.kind === "changed") stats.changed++;
    }
  }
}

function diffValues(
  left: unknown,
  right: unknown,
  key: string,
  parentPath: string,
  isArrayIndex: boolean,
  depth: number,
): DiffNode {
  const path = buildPath(parentPath, key, isArrayIndex);

  if (depth > MAX_DIFF_DEPTH) {
    // Treat as a changed leaf to avoid infinite recursion
    return {
      key,
      kind: "changed",
      leftValue: left,
      rightValue: right,
      children: null,
      path,
    };
  }

  // Both plain objects → recurse key-by-key
  if (isPlainObject(left) && isPlainObject(right)) {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
    const children: DiffNode[] = [];

    for (const k of allKeys) {
      const inLeft = k in left;
      const inRight = k in right;

      if (!inLeft) {
        children.push({
          key: k,
          kind: "added",
          leftValue: undefined,
          rightValue: right[k],
          children: null,
          path: buildPath(path, k, false),
        });
      } else if (!inRight) {
        children.push({
          key: k,
          kind: "removed",
          leftValue: left[k],
          rightValue: undefined,
          children: null,
          path: buildPath(path, k, false),
        });
      } else {
        children.push(diffValues(left[k], right[k], k, path, false, depth + 1));
      }
    }

    const hasChanges = children.some((c) => c.kind !== "unchanged");
    return {
      key,
      kind: hasChanges ? "changed" : "unchanged",
      leftValue: left,
      rightValue: right,
      children,
      path,
    };
  }

  // Both arrays → zip by index
  if (Array.isArray(left) && Array.isArray(right)) {
    const len = Math.max(left.length, right.length);
    const children: DiffNode[] = [];

    for (let i = 0; i < len; i++) {
      const idx = String(i);
      if (i >= left.length) {
        children.push({
          key: idx,
          kind: "added",
          leftValue: undefined,
          rightValue: right[i],
          children: null,
          path: buildPath(path, idx, true),
        });
      } else if (i >= right.length) {
        children.push({
          key: idx,
          kind: "removed",
          leftValue: left[i],
          rightValue: undefined,
          children: null,
          path: buildPath(path, idx, true),
        });
      } else {
        children.push(
          diffValues(left[i], right[i], idx, path, true, depth + 1),
        );
      }
    }

    const hasChanges = children.some((c) => c.kind !== "unchanged");
    return {
      key,
      kind: hasChanges ? "changed" : "unchanged",
      leftValue: left,
      rightValue: right,
      children,
      path,
    };
  }

  // Type mismatch or primitive comparison
  if (left === right) {
    return {
      key,
      kind: "unchanged",
      leftValue: left,
      rightValue: right,
      children: null,
      path,
    };
  }

  return {
    key,
    kind: "changed",
    leftValue: left,
    rightValue: right,
    children: null,
    path,
  };
}

export function diffJson(left: unknown, right: unknown): DiffResult {
  const stats: DiffStats = { added: 0, removed: 0, changed: 0 };

  // Top-level: treat as if comparing a root node, then return its children
  const root = diffValues(left, right, "(root)", "", false, 0);

  // If root has children (both were objects/arrays), surface them directly
  const nodes = root.children ?? [root];

  accumulateStats(nodes, stats);

  return { nodes, stats };
}

export function parseJsonSafe(
  input: string,
): { value: unknown; error: null } | { value: null; error: string } {
  if (!input.trim()) return { value: null, error: null };
  try {
    return { value: JSON.parse(input), error: null };
  } catch (e) {
    return {
      value: null,
      error: e instanceof SyntaxError ? e.message : "Invalid JSON",
    };
  }
}

export function formatJson(input: string): string {
  const { value, error } = parseJsonSafe(input);
  if (error !== null || value === null) return input;
  return JSON.stringify(value, null, 2);
}
