import styles from './GarmentPlate.module.css';

type Props = {
  /** The garment as photographed in Shopify, print included. */
  image: string;
  imageAlt: string;
  /**
   * A second plate, revealed while an ancestor sets `--plate-face` to 1.
   * Decorative: the link's own text already names the item, so announcing a
   * second photograph of it adds nothing to a screen reader.
   */
  secondImage?: string;
  priority?: boolean;
  className?: string;
};

/**
 * One garment, shown as the store holds it. Used in the hero plate, the
 * catalogue cards and the item record.
 *
 * The site does not draw the garment or simulate the print. Shopify carries a
 * finished plate per product, and a variant may carry its own — which is what
 * makes selecting a blank change the plate.
 */
export default function GarmentPlate({
  image,
  imageAlt,
  secondImage,
  priority = false,
  className,
}: Props) {
  return (
    <div className={[styles.plate, className].filter(Boolean).join(' ')}>
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.image}
            src={image}
            alt={imageAlt}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
          {secondImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className={styles.second}
              src={secondImage}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </>
      ) : (
        <div className={styles.absent}>No plate recorded</div>
      )}
    </div>
  );
}
