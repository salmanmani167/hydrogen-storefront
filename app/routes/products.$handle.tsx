import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {Image, Money} from '@shopify/hydrogen';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Sidejeans | ${data?.product.title ?? ''}`}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {
    product,
  };
}

function loadDeferredData({context, params}: Route.LoaderArgs) {
  return {};
}

export default function Product() {
  const {product} = useLoaderData<typeof loader>();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml, media, vendor} = product;

  return (
    <div className="product-page">
      {/* Product media left / info right — matching main-product layout */}
      <div className="product-main-top">
        {/* Media Section */}
        <div className="product-media-section">
          {media && media.nodes && media.nodes.length > 0 ? (
            <div className="product-media-grid">
              {media.nodes.slice(0, 5).map((med: any) => (
                <div key={med.id} className="product-media-image">
                  {med.__typename === 'Video' ? (
                    <video
                      src={med.sources?.[0]?.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{width: '100%', display: 'block'}}
                    />
                  ) : (
                    <Image
                      data={med.image || med.previewImage || med}
                      sizes="(min-width: 45em) 50vw, 100vw"
                      aspectRatio="3/4"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <ProductImage image={selectedVariant?.image} />
          )}
        </div>

        {/* Info Section */}
        <div className="product-info-section">
          <div className="product-info-inner">
            {/* Title & Price */}
            <div className="product-block">
              <h1 className="product-title">{title}</h1>
              <ProductPrice
                price={selectedVariant?.price}
                compareAtPrice={selectedVariant?.compareAtPrice}
              />
            </div>

            {/* Model info text */}
            {product.metafields?.custom?.model_heigh && (
              <div className="product-block product-model-text">
                {product.metafields.custom.model_heigh.value}
              </div>
            )}

            {/* Variant picker & buy buttons */}
            <div className="product-block">
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
              />
            </div>

            {/* Info image (slider/shipping) */}
            <div className="product-block product-info-image">
              <img
                src="https://cdn.shopify.com/s/files/1/0014/1361/1629/files/V2_33edfad9-f4ec-4775-b103-9cccc65b9f0d.jpg?v=1780555578"
                alt="Free shipping info"
                width="700"
                style={{maxWidth: '100%', height: 'auto'}}
              />
            </div>

            {/* Description accordion */}
            <div className="product-block product-description-accordion">
              <details className="product-accordion" open>
                <summary className="product-accordion-summary">
                  <span>Description</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </summary>
                <div className="product-accordion-content" dangerouslySetInnerHTML={{__html: descriptionHtml}} />
              </details>
            </div>

            {/* Size Guide accordion */}
            <div className="product-block product-description-accordion">
              <details className="product-accordion">
                <summary className="product-accordion-summary">
                  <span>Size Guide</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </summary>
                <div className="product-accordion-content">
                  <p>Please refer to the product measurements for sizing.</p>
                </div>
              </details>
            </div>

            {/* Shipping accordion */}
            <div className="product-block product-description-accordion">
              <details className="product-accordion">
                <summary className="product-accordion-summary">
                  <span>Versand</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </summary>
                <div className="product-accordion-content">
                  <p>Kostenlose Lieferung ab 120€ (in DE). 1-2 Werktage Lieferzeit.</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;
