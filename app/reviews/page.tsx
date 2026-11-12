import { Stars } from '@/components/ProductCard';

const REVIEWS = [
  {
    name: 'Ayesha Khan',
    city: 'Lahore',
    rating: 5,
    text: 'Ordered a dinner set and bedsheets — both arrived in 2 days, well packed. Quality is really good for the price. Will order again!',
    product: 'Ceramic Dinner Set',
  },
  {
    name: 'Muhammad Bilal',
    city: 'Karachi',
    rating: 5,
    text: 'The tool kit is excellent value. Cash on Delivery made it easy — paid when the parcel arrived. Highly recommended store.',
    product: '46-Piece Home Tool Kit',
  },
  {
    name: 'Fatima Raza',
    city: 'Islamabad',
    rating: 4,
    text: 'Bought earbuds and a power bank for my brother. Genuine products, fast delivery. Customer support on WhatsApp replied quickly.',
    product: 'Wireless Bluetooth Earbuds',
  },
  {
    name: 'Usman Ali',
    city: 'Faisalabad',
    rating: 5,
    text: 'Running shoes are comfortable and original quality. Delivery was free because my order was over Rs 7,000. Very happy!',
    product: "Men's Running Shoes",
  },
  {
    name: 'Hira Sheikh',
    city: 'Rawalpindi',
    rating: 5,
    text: 'The teddy bear is so soft — my daughter loves it. Packing was lovely too. This is now my go-to shop for gifts.',
    product: 'Soft Plush Teddy Bear',
  },
  {
    name: 'Ahmed Raza',
    city: 'Multan',
    rating: 4,
    text: 'Drill machine works perfectly, both batteries included as described. Delivery took 3 days to Multan but worth the wait.',
    product: 'Cordless Drill Machine 21V',
  },
];

export default function ReviewsPage() {
  return (
    <div className="page-wrap">
      <h1 className="page-title">Customer Reviews</h1>
      <p className="page-subtitle">
        Real feedback from real customers across Pakistan.
      </p>

      <div className="review-grid">
        {REVIEWS.map((r) => (
          <div key={r.name} className="review-card">
            <Stars rating={r.rating} />
            <p>“{r.text}”</p>
            <div className="review-name">{r.name}</div>
            <div className="review-city">
              {r.city} • bought: {r.product}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
