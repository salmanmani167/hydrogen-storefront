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
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: collections.nodes[0],
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
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home-page">
      {/* Hero Banner — fullscreen, matching Sidejeans image-banner section */}
      <HeroBanner collection={data.featuredCollection} />

      {/* Content Cards — 2×2 grid matching section-content-cards */}
      <ContentCardsSection />

      {/* Featured Products — product grid matching featured-collection section */}
      <FeaturedProducts products={data.featuredProducts} />
    </div>
  );
}

function HeroBanner({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
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
        <h1 className="h2">Summer Collection</h1>
        <Link
          className="button button--outline hero-banner-cta"
          to={`/collections/${collection.handle}`}
        >
          SHOP NOW
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
