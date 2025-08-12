// src/components/SvgInline.tsx
import { useEffect, useRef } from 'react';

type Props = { dataUrl: string; className?: string; title?: string };

export function SvgInline({ dataUrl, className, title }: Props) {
  if (import.meta.env.DEV) {
    // DEV-only path to test if warnings are caused by inline HTML
    return <img src={dataUrl} className={className} alt={title} loading="lazy" decoding="async" />
  }

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b64 = dataUrl.split(',')[1] ?? '';
    const html = b64 ? atob(b64) : '';
    if (ref.current) ref.current.innerHTML = html;
  }, [dataUrl]);

  return <div ref={ref} className={className} aria-label={title} />;
}
