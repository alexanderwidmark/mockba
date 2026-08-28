/**
 * One query per collection handle. Shopify owns series, items, variants, source
 * records and rights status; the front end owns layout and section copy only.
 *
 * Collection metafields, namespace `mockba`:
 *   series_no  '001' · status  'release candidate' | 'issued' | 'closed'
 *   issued     free text, e.g. '2026.01'
 *
 * Product metafields, namespace `mockba`:
 *   command, contradiction, mechanism, role, colour_map (json),
 *   garment_color, sku_base, source (-> metaobject `source`)
 *
 * Prices come back in the buyer's market, so the site quotes what the checkout
 * will charge rather than the shop's own currency.
 *
 * `sku_base` is the accession stem, e.g. 'MAC-4'. The variant SKU belongs to
 * the fulfilment integration and is not an accession number, so the site
 * composes one from the stem, the blank and the size instead of showing it.
 *
 * Product image 1 is the garment plate. A variant may carry its own image; when
 * it does, choosing a blank changes the plate.
 */
export const SERIES_QUERY = /* GraphQL */ `
  query Series($handle: String!, $country: CountryCode!) @inContext(country: $country) {
    collection(handle: $handle) {
      handle
      title
      descriptionHtml
      metafields(
        identifiers: [
          { namespace: "mockba", key: "series_no" }
          { namespace: "mockba", key: "status" }
          { namespace: "mockba", key: "issued" }
        ]
      ) {
        key
        value
      }
      products(first: 24) {
        edges {
          node {
            id
            handle
            title
            availableForSale
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 10) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            options {
              name
              optionValues {
                name
              }
            }
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  sku
                  availableForSale
                  quantityAvailable
                  currentlyNotInStock
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions {
                    name
                    value
                  }
                  image {
                    url
                    altText
                  }
                }
              }
            }
            metafields(
              identifiers: [
                { namespace: "mockba", key: "command" }
                { namespace: "mockba", key: "contradiction" }
                { namespace: "mockba", key: "mechanism" }
                { namespace: "mockba", key: "role" }
                { namespace: "mockba", key: "colour_map" }
                { namespace: "mockba", key: "garment_color" }
                { namespace: "mockba", key: "sku_base" }
                { namespace: "mockba", key: "source" }
              ]
            ) {
              key
              value
              reference {
                ... on Metaobject {
                  type
                  fields {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;
