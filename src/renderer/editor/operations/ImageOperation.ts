// Concrete operation variants (rotate, flip, crop, adjustments, ...) are
// introduced starting with rotate/flip. Until then the operation stack is
// always empty, so this is a placeholder that keeps ImageDocument.operations
// correctly typed.
export type ImageOperation = never;
