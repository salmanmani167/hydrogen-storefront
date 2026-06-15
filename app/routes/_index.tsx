import {Await, useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Sidejeans | Home'}];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const [{collections}, {shop}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    context.storefront.query(BANNER_METAFIELDS_QUERY),
  ]);

  // Transform metafields array into a keyed object for easy access
  const banner: BannerMetafields = {};
  if (shop?.metafields) {
    for (const mf of shop.metafields) {
      if (mf) banner[mf.key as keyof BannerMetafields] = mf;
    }
  }

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
    banner,
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const featuredProducts = context.storefront
    .query(FEATURED_PRODUCTS_QUERY)
    .catch((error: Error) => {
      console.error(error);
      return null;
    });

  return {
    featuredProducts,
  };
}

const CONTENT_CARDS = [
  {
    title: 'SHIRTS',
    link: '/collections/shirt-casual',
  },
  {
    title: 'BOTTOMS',
    link: '/collections/bottoms',
  },
  {
    title: 'DENIMS',
    link: '/collections/denims',
  },
  {
    title: 'BASICS',
    link: '/collections/essentials',
  },
];

export default function Homepage() {
  const {featuredCollection, featuredProducts, banner} =
    useLoaderData<typeof loader>();
  return (
    <div className="home-page">
      {/* Hero Banner — fullscreen, matching Sidejeans image-banner section */}
      <HeroBanner collection={featuredCollection} banner={banner} />

      {/* Content Cards — 2×2 grid matching section-content-cards */}
      <ContentCardsSection />

      {/* Featured Products — product grid matching featured-collection section */}
      <FeaturedProducts products={featuredProducts} />
    </div>
  );
}

function HeroBanner({
  collection,
  banner,
}: {
  collection: FeaturedCollectionFragment;
  banner: BannerMetafields | null;
}) {
  if (!collection) return null;

  // Use metafields if available, otherwise fall back to defaults
  const heading = banner?.banner_heading?.value || 'Summer Collection';
  const subtext = banner?.banner_subtext?.value || '';
  const buttonText = banner?.banner_button_text?.value || 'SHOP NOW';
  const buttonLink = banner?.banner_button_link?.value || `/collections/${collection.handle}`;

  const image = collection?.image;
  return (
    <section className="hero-banner banner-style-fullscreen">
      {image && (
        <div className="hero-banner-image">
          <Image
            data={image}
            sizes="100vw"
            alt={image.altText || collection.title}
            loading="eager"
            fetchPriority="high"
          />
        </div>
      )}
      <div className="hero-banner-overlay" />
      <div className="hero-banner-text">
        {subtext && <p className="hero-banner-subtext">{subtext}</p>}
        <h1 className="h2">{heading}</h1>
        <Link className="button button--outline hero-banner-cta" to={buttonLink}>
          {buttonText}
        </Link>
      </div>
    </section>
  );
}

function ContentCardsSection() {
  return (
    <section className="content-cards-section">
      <div className="content-cards-grid">
        {CONTENT_CARDS.map((card, i) => (
          <Link key={card.title} to={card.link} className="content-card">
            <div className="content-card-image">
              <div className="content-card-placeholder">
                <span>{card.title}</span>
              </div>
              <div className="content-card-overlay" />
            </div>
            <div className="content-card-text">
              <h3 className="h3">{card.title}</h3>
              <span className="content-card-link">SHOP NOW</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeaturedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section className="featured-products-section">
      <Suspense
        fallback={
          <div className="featured-products-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="product-item">
                <div className="product-item-image" style={{background: '#f4f3f1', aspectRatio: '3/4'}} />
              </div>
            ))}
          </div>
        }
      >
        <Await resolve={products}>
          {(response) => (
            <div className="featured-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                    <ProductItem key={product.id} product={product} showNewBadge />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </section>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const FEATURED_PRODUCTS_QUERY = `#graphql
  fragment FeaturedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query FeaturedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...FeaturedProduct
      }
    }
  }
` as const;

const BANNER_METAFIELDS_QUERY = `#graphql
  query BannerMetafields ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      metafields(identifiers: [
        {namespace: "custom", key: "banner_heading"}
        {namespace: "custom", key: "banner_subtext"}
        {namespace: "custom", key: "banner_button_text"}
        {namespace: "custom", key: "banner_button_link"}
      ]) {
        namespace
        key
        value
      }
    }
  }
` as const;

type BannerMetafields = {
  banner_heading?: {value: string};
  banner_subtext?: {value: string};
  banner_button_text?: {value: string};
  banner_button_link?: {value: string};
};
