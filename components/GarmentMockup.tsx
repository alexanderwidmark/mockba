import { frameAspect, inkStyle, subInk } from '@/lib/ink';
import styles from './GarmentMockup.module.css';

type Props = {
  /** Blank colour, hex. Drives both the silhouette and the ink simulation. */
  garmentColor: string;
  /** Print ink colour, hex, from the selected blank's colour_map entry. */
  printInk: string;
  poster: string;
  posterAlt: string;
  /** 'w/h' from the print_aspect metafield, so no artwork is cropped. */
  printAspect: string;
  /** Layer 1 — the command. */
  title: string;
  /** Layer 2 — the contradiction. */
  secondary: string;
  scale?: 'plate' | 'card';
  priority?: boolean;
  className?: string;
};

/**
 * The garment plate: silhouette, print area, ink simulation, printed caption.
 * Used in the hero plate, the catalogue cards and the item record.
 */
export default function GarmentMockup({
  garmentColor,
  printInk,
  poster,
  posterAlt,
  printAspect,
  title,
  secondary,
  scale = 'plate',
  priority = false,
  className,
}: Props) {
  const ink = inkStyle(garmentColor);
  const aspect = frameAspect(printAspect);

  return (
    <div
      className={[styles.mockup, scale === 'card' ? styles.card : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.silhouette} style={{ background: garmentColor }} />

      <div className={styles.printArea}>
        <div className={styles.frame} style={{ aspectRatio: aspect }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.poster}
            src={poster}
            alt={posterAlt}
            style={{ aspectRatio: aspect, ...ink }}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
          <div className={styles.screen} />
        </div>

        <div className={styles.caption}>
          <div className={styles.captionTitle} style={{ color: printInk }}>
            {title}
          </div>
          <div className={styles.captionSecondary} style={{ color: subInk(printInk) }}>
            {secondary}
          </div>
        </div>
      </div>
    </div>
  );
}
