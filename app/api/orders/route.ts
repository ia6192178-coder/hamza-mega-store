import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import {
  getOrderByNumber,
  getOrdersByPhone,
  getProducts,
  getSettings,
  hasDb,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/orders?phone=0307... — orders for one customer
// GET /api/orders?number=HMS-10001 — one order by its number
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  const number = searchParams.get('number');

  if (number) {
    const order = await getOrderByNumber(number.trim());
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }
    return NextResponse.json({ order });
  }

  if (phone) {
    const orders = await getOrdersByPhone(phone);
    return NextResponse.json({ orders });
  }

  return NextResponse.json(
    { error: 'Pass ?phone= or ?number= to look up orders.' },
    { status: 400 },
  );
}

// POST /api/orders — place a COD order.
// Body: { customer_name, phone, city, address, items: [{ product_id, quantity }] }
// Prices are always taken from the database, never from the request.
export async function POST(req: Request) {
  if (!hasDb()) {
    return NextResponse.json(
      { error: 'Database is not set up yet. The store owner must run /api/seed first.' },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const customerName = String(body.customer_name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const city = String(body.city ?? '').trim();
    const address = String(body.address ?? '').trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (customerName.length < 3)
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    if (phone.replace(/\D/g, '').length < 10)
      return NextResponse.json({ error: 'Please enter a valid mobile number.' }, { status: 400 });
    if (!city || !address)
      return NextResponse.json(
        { error: 'Please enter your city and full delivery address.' },
        { status: 400 },
      );
    if (items.length === 0)
      return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });

    const products = await getProducts();
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const lines: { product_id: number; product_name: string; price: number; quantity: number }[] = [];
    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1));
      const product = byId.get(productId);
      if (!product) {
        return NextResponse.json(
          { error: 'One of the products in your cart no longer exists.' },
          { status: 400 },
        );
      }
      if (product.is_sold_out || product.stock <= 0) {
        return NextResponse.json(
          { error: `"${product.name}" is sold out. Please remove it from your cart.` },
          { status: 400 },
        );
      }
      subtotal += product.price * quantity;
      lines.push({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity,
      });
    }

    const settings = await getSettings();
    const deliveryFee = Number(settings.delivery_fee || 250);
    const freeThreshold = Number(settings.free_delivery_threshold || 7000);
    const delivery = subtotal >= freeThreshold ? 0 : deliveryFee;
    const total = subtotal + delivery;

    // Insert with a temporary number, then set the real HMS-xxxxx number from the id.
    const tempNumber = `TMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const inserted = await sql`
      INSERT INTO orders (order_number, customer_name, phone, city, address, total, delivery_fee, status)
      VALUES (${tempNumber}, ${customerName}, ${phone}, ${city}, ${address}, ${total}, ${delivery}, 'Pending')
      RETURNING id
    `;
    const orderId = Number(inserted.rows[0].id);
    const orderNumber = `HMS-${10000 + orderId}`;
    await sql`
      UPDATE orders SET order_number = ${orderNumber} WHERE id = ${orderId}
    `;

    for (const line of lines) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
        VALUES (${orderId}, ${line.product_id}, ${line.product_name}, ${line.price}, ${line.quantity})
      `;
      await sql`
        UPDATE products
        SET stock = GREATEST(stock - ${line.quantity}, 0)
        WHERE id = ${line.product_id}
      `;
    }

    return NextResponse.json(
      { ok: true, order_number: orderNumber, total, delivery_fee: delivery },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not place the order.' },
      { status: 500 },
    );
  }
}
