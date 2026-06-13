import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
  showNewBadge = false,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
  showNewBadge?: boolean;
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  return (
    <Link
      className="card-product"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="card-media">
        {showNewBadge && (
          <span className="badge badge--new">NEW</span>
        )}
        <div className="card-product--image">
          {image ? (
            <Image
              alt={image.altText || product.title}
              data={image}
              loading={loading}
              aspectRatio="3/4"
              sizes="(min-width: 45em) 400px, 100vw"
            />
          ) : (
            <div className="card-product--placeholder" />
          )}
        </div>
      </div>
      <div className="card-product--info">
        <h3 className="card-product--title">{product.title}</h3>
        <div className="card-product--price">
          <Money data={product.priceRange.minVariantPrice} />
        </div>
      </div>
    </Link>
  );
}
