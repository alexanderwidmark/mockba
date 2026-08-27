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
 *   garment_color, print_ink, print_aspect, source (-> metaobject `source`)
 */
export const SERIES_QUERY = /* GraphQL */ `
  query Series($handle: String!) {
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
            images(first: 3) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            options {
              name
              values
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
                { namespace: "mockba", key: "print_ink" }
                { namespace: "mockba", key: "print_aspect" }
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
