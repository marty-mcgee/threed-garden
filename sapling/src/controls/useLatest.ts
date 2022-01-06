import { useEffect, useRef } from "react";

/** This hook converts a changing value into a reference and keeps the reference up to date.

    The motivation for this is that there are often instances where an effect, memo or callback
    depends on a changing value (such as a function reference), but we want to avoid re-running
    the effect/memo/callback when that value changes. This is especially true in the case
    of callbacks which might not be called, there's no point in re-binding the closure every time
    the callback changes. But we do want to call the latest callback when we need it.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}
