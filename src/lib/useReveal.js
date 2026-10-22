import { useEffect, useRef, useState } from 'react';

// Plain IntersectionObserver based "reveal on scroll" hook.
// Returns a ref to attach to an element and a boolean that flips to
// true (and stays true) once the element has scrolled into view.
// This replaces framer-motion's `whileInView` with vanilla JS + CSS.
export function useReveal({ amount = 0.2 } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(node);
          }
        });
      },
      { threshold: amount }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [amount]);

  return [ref, visible];
}
