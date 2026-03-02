export const dynamic = 'force-dynamic';

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { createToken, verifyToken, hashPassword, comparePassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const db = await getDb();
    const user = await db.collection('users').findOne({ id: payload.userId });
    return user;
}

function isAdmin(user) {
    return user?.role === 'admin';
}

function sanitizeProductPayload(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
    const { id, _id, createdAt, updatedAt, ...payload } = body;
    return payload;
}

function getRouteParts(route) {
    return route ? route.split('/').filter(Boolean) : [];
}

function buildTrackingEvent(status, message) {
    return {
        id: uuidv4(),
        status,
        message,
        at: new Date(),
    };
}

function toMoney(value) {
    return Number(Number(value || 0).toFixed(2));
}

function getProductQuantity(product) {
    return Number(product?.totalQuantity ?? product?.total_quantity ?? 0);
}

function buildProductQuantityUpdate(newQty) {
    return {
        $set: {
            totalQuantity: newQty,
            total_quantity: newQty,
            updatedAt: new Date(),
        },
    };
}

function normalizeCartItems(items) {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => ({
            productId: item.productId,
            title: item.title || '',
            thumbImage: item.thumbImage || '',
            category: item.category || '',
            unitPrice: toMoney(item.unitPrice),
            quantity: Number(item.quantity || 0),
        }))
        .filter((item) => item.productId && item.quantity > 0);
}

function calculateCartSummary(items) {
    const normalizedItems = normalizeCartItems(items);
    const subtotal = toMoney(normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
    const deliveryFee = subtotal > 499 ? 0 : 49;
    const totalAmount = toMoney(subtotal + deliveryFee);
    return { items: normalizedItems, subtotal, deliveryFee, totalAmount };
}

function sanitizeUser(user) {
    if (!user) return null;
    const { password, _id, ...safeUser } = user;
    return safeUser;
}

function sanitizeOrderForResponse(order) {
    if (!order) return null;
    const { _id, ...safeOrder } = order;
    return safeOrder;
}

function getDefaultAdsConfig() {
    return {
        heroBanners: [
            {
                id: uuidv4(),
                title: 'Flat 20% Off On Daily Medicines',
                subtitle: 'Use code MED20 on checkout for eligible products',
                image: 'https://placehold.co/1400x420?text=MedicalHub+Banner+1',
                ctaText: 'Shop Offers',
                ctaLink: '/search?q=offer',
            },
            {
                id: uuidv4(),
                title: 'Heart Care Essentials',
                subtitle: 'Trusted cardiac support products with quick delivery',
                image: 'https://placehold.co/1400x420?text=MedicalHub+Banner+2',
                ctaText: 'Explore',
                ctaLink: '/categories/Cardiac',
            },
        ],
        offers: [
            {
                id: uuidv4(),
                title: 'Free Delivery',
                description: 'Free delivery on orders above ₹499',
                badge: 'Delivery',
                link: '/search?q=delivery',
                productIds: [],
            },
            {
                id: uuidv4(),
                title: 'Buy 2 Get 1',
                description: 'Selected wellness products only',
                badge: 'Combo',
                link: '/search?q=wellness',
                productIds: [],
            },
        ],
        carousel: [
            {
                id: uuidv4(),
                title: 'Monsoon Immunity Deals',
                description: 'Curated supplements and vitamins',
                image: 'https://placehold.co/1200x360?text=Carousel+1',
                link: '/search?q=immunity',
            },
            {
                id: uuidv4(),
                title: 'Family Health Pack',
                description: 'Save more on monthly medicine bundles',
                image: 'https://placehold.co/1200x360?text=Carousel+2',
                link: '/search?q=family',
            },
        ],
        updatedAt: new Date(),
    };
}

async function getAdsConfig(db) {
    const doc = await db.collection('siteContent').findOne({ key: 'ads' });
    if (!doc) {
        const config = getDefaultAdsConfig();
        await db.collection('siteContent').insertOne({
            key: 'ads',
            value: config,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return config;
    }
    return doc.value || getDefaultAdsConfig();
}

async function getUserCart(db, userId) {
    const cart = await db.collection('carts').findOne({ userId });
    if (!cart) {
        return {
            userId,
            items: [],
            subtotal: 0,
            deliveryFee: 0,
            totalAmount: 0,
            updatedAt: new Date(),
            createdAt: new Date(),
        };
    }
    const summary = calculateCartSummary(cart.items || []);
    return { ...cart, ...summary };
}

async function upsertUserCart(db, userId, items) {
    const summary = calculateCartSummary(items);
    const now = new Date();
    const payload = {
        userId,
        items: summary.items,
        subtotal: summary.subtotal,
        deliveryFee: summary.deliveryFee,
        totalAmount: summary.totalAmount,
        updatedAt: now,
    };

    await db.collection('carts').updateOne(
        { userId },
        { $set: payload, $setOnInsert: { createdAt: now } },
        { upsert: true }
    );

    return payload;
}

async function updateInventoryForOrder(db, orderItems) {
    for (const item of orderItems) {
        const product = await db.collection('products').findOne({ id: item.productId });
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const available = getProductQuantity(product);
        if (available < item.quantity) {
            throw new Error(`Insufficient quantity for ${product.title || 'product'}`);
        }
    }

    for (const item of orderItems) {
        const product = await db.collection('products').findOne({ id: item.productId });
        const available = getProductQuantity(product);
        const nextQty = available - item.quantity;
        await db.collection('products').updateOne({ id: item.productId }, buildProductQuantityUpdate(nextQty));
    }
}

async function buildCheckoutItems(db, cartItems) {
    const items = [];
    for (const cartItem of cartItems) {
        const product = await db.collection('products').findOne({ id: cartItem.productId });
        if (!product) throw new Error(`Product not found: ${cartItem.productId}`);

        items.push({
            productId: product.id,
            title: product.title || cartItem.title || 'Product',
            category: product.category || cartItem.category || '',
            thumbImage: product.thumbImage || cartItem.thumbImage || '',
            unitPrice: toMoney(product.price),
            quantity: Number(cartItem.quantity || 0),
        });
    }
    return normalizeCartItems(items);
}

export async function GET(request, { params }) {
    const { path } = await params;
    const route = path ? path.join('/') : '';

    try {
        const db = await getDb();
        const routeParts = getRouteParts(route);

        if (route === 'auth/me') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            return NextResponse.json({ user: sanitizeUser(user) });
        }

        if (route === 'auth/logout') {
            const cookieStore = await cookies();
            cookieStore.delete('auth_token');
            return NextResponse.json({ message: 'Logged out successfully' });
        }

        if (route === 'products') {
            const products = await db.collection('products').find({}).sort({ createdAt: -1 }).toArray();
            return NextResponse.json({ products });
        }

        if (route === 'ads') {
            const ads = await getAdsConfig(db);
            return NextResponse.json({ ads });
        }

        if (routeParts[0] === 'products' && routeParts[1]) {
            const product = await db.collection('products').findOne({ id: routeParts[1] });
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            return NextResponse.json({ product });
        }

        if (route === 'cart') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const cart = await getUserCart(db, user.id);
            return NextResponse.json({ cart: sanitizeOrderForResponse(cart) });
        }

        if (route === 'orders') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const query = isAdmin(user) ? {} : { userId: user.id };
            const orders = await db.collection('orders').find(query).sort({ createdAt: -1 }).toArray();
            return NextResponse.json({ orders: orders.map(sanitizeOrderForResponse) });
        }

        if (routeParts[0] === 'orders' && routeParts[1]) {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const order = await db.collection('orders').findOne({ id: routeParts[1] });
            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            if (!isAdmin(user) && order.userId !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            if (routeParts[2] === 'tracking') {
                return NextResponse.json({ tracking: order.tracking || [] });
            }

            return NextResponse.json({ order: sanitizeOrderForResponse(order) });
        }

        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { path } = await params;
    const route = path ? path.join('/') : '';

    try {
        const db = await getDb();
        const body = await request.json();
        const routeParts = getRouteParts(route);

        if (route === 'auth/register') {
            const { name, email, password, role } = body;
            if (!name || !email || !password || !role) {
                return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
            }

            const existingUser = await db.collection('users').findOne({ email });
            if (existingUser) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });

            const hashedPassword = await hashPassword(password);
            const userId = uuidv4();
            const user = {
                id: userId,
                name,
                email,
                password: hashedPassword,
                role,
                createdAt: new Date(),
            };

            await db.collection('users').insertOne(user);

            const token = await createToken({ userId, role });
            const cookieStore = await cookies();
            cookieStore.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return NextResponse.json({ user: sanitizeUser(user), token });
        }

        if (route === 'auth/login') {
            const { email, password } = body;
            if (!email || !password) {
                return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
            }

            const user = await db.collection('users').findOne({ email });
            if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

            const isValidPassword = await comparePassword(password, user.password);
            if (!isValidPassword) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

            const token = await createToken({ userId: user.id, role: user.role });
            const cookieStore = await cookies();
            cookieStore.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return NextResponse.json({ user: sanitizeUser(user), token });
        }

        if (route === 'products') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });

            const productPayload = sanitizeProductPayload(body);
            if (!Object.keys(productPayload).length) {
                return NextResponse.json({ error: 'Product payload is required' }, { status: 400 });
            }

            const product = { id: uuidv4(), ...productPayload, createdAt: new Date(), updatedAt: new Date() };
            await db.collection('products').insertOne(product);
            return NextResponse.json({ product }, { status: 201 });
        }

        if (route === 'bulk-products') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });

            const rawPayload = Array.isArray(body) ? body : [body];
            if (rawPayload.length === 0) {
                return NextResponse.json({ error: 'At least one product is required' }, { status: 400 });
            }

            const productsToInsert = rawPayload.map((item) => ({
                id: uuidv4(),
                ...sanitizeProductPayload(item),
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

            const result = await db.collection('products').insertMany(productsToInsert);
            return NextResponse.json(
                {
                    message: 'Products created successfully',
                    count: result.insertedCount,
                    products: productsToInsert,
                },
                { status: 201 }
            );
        }

        if (route === 'cart/items') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const productId = body?.productId;
            const quantity = Math.max(1, Number(body?.quantity || 1));
            if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });

            const product = await db.collection('products').findOne({ id: productId });
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

            const cart = await getUserCart(db, user.id);
            const items = normalizeCartItems(cart.items || []);
            const idx = items.findIndex((item) => item.productId === productId);
            const available = getProductQuantity(product);

            const nextQty = idx >= 0 ? items[idx].quantity + quantity : quantity;
            if (available && nextQty > available) {
                return NextResponse.json({ error: 'Requested quantity exceeds stock' }, { status: 400 });
            }

            if (idx >= 0) {
                items[idx].quantity = nextQty;
                items[idx].unitPrice = toMoney(product.price);
            } else {
                items.push({
                    productId: product.id,
                    title: product.title || 'Product',
                    thumbImage: product.thumbImage || '',
                    category: product.category || '',
                    unitPrice: toMoney(product.price),
                    quantity,
                });
            }

            const updatedCart = await upsertUserCart(db, user.id, items);
            return NextResponse.json({ cart: sanitizeOrderForResponse(updatedCart) });
        }

        if (route === 'checkout') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const paymentMethod = body?.paymentMethod;
            const shippingAddress = body?.shippingAddress || {};
            if (!['cod', 'online'].includes(paymentMethod)) {
                return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
            }

            const requiredAddressFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'postalCode'];
            for (const field of requiredAddressFields) {
                if (!String(shippingAddress[field] || '').trim()) {
                    return NextResponse.json({ error: `Shipping field required: ${field}` }, { status: 400 });
                }
            }

            const cart = await getUserCart(db, user.id);
            if (!cart.items?.length) {
                return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
            }

            const orderItems = await buildCheckoutItems(db, cart.items);
            if (!orderItems.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

            const summary = calculateCartSummary(orderItems);
            const now = new Date();
            const orderId = uuidv4();
            const order = {
                id: orderId,
                userId: user.id,
                userSnapshot: { id: user.id, name: user.name, email: user.email },
                items: summary.items,
                subtotal: summary.subtotal,
                deliveryFee: summary.deliveryFee,
                totalAmount: summary.totalAmount,
                paymentMethod,
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
                orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'payment_pending',
                deliveryStatus: paymentMethod === 'cod' ? 'processing' : 'awaiting_payment',
                shippingAddress,
                transaction: {
                    provider: paymentMethod === 'cod' ? 'cod' : 'razorpay',
                    razorpayOrderId: null,
                    razorpayPaymentId: null,
                    razorpaySignature: null,
                },
                tracking: [
                    buildTrackingEvent('placed', 'Order placed successfully'),
                    buildTrackingEvent(
                        paymentMethod === 'cod' ? 'confirmed' : 'payment_pending',
                        paymentMethod === 'cod' ? 'Order confirmed for Cash on Delivery' : 'Awaiting online payment'
                    ),
                ],
                createdAt: now,
                updatedAt: now,
            };

            if (paymentMethod === 'cod') {
                await updateInventoryForOrder(db, order.items);
                await db.collection('orders').insertOne(order);
                await upsertUserCart(db, user.id, []);
                return NextResponse.json({ order: sanitizeOrderForResponse(order) }, { status: 201 });
            }

            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            if (!keyId || !keySecret) {
                return NextResponse.json(
                    { error: 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env' },
                    { status: 500 }
                );
            }

            const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(order.totalAmount * 100),
                currency: 'INR',
                receipt: order.id,
                notes: {
                    orderId: order.id,
                    userId: user.id,
                },
            });

            order.transaction.razorpayOrderId = razorpayOrder.id;
            await db.collection('orders').insertOne(order);

            return NextResponse.json(
                {
                    order: sanitizeOrderForResponse(order),
                    razorpayOrder,
                    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
                },
                { status: 201 }
            );
        }

        if (route === 'payments/razorpay/verify') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
            if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
            }

            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            if (!keySecret) {
                return NextResponse.json({ error: 'Razorpay key secret missing in .env' }, { status: 500 });
            }

            const order = await db.collection('orders').findOne({ id: orderId });
            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            if (!isAdmin(user) && order.userId !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const generatedSignature = crypto
                .createHmac('sha256', keySecret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (generatedSignature !== razorpay_signature) {
                return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
            }

            if (order.paymentStatus !== 'paid') {
                await updateInventoryForOrder(db, order.items || []);
            }

            const updatedTracking = [
                ...(order.tracking || []),
                buildTrackingEvent('paid', 'Online payment completed successfully'),
                buildTrackingEvent('confirmed', 'Order confirmed and moved to processing'),
            ];

            const updatedOrder = await db.collection('orders').findOneAndUpdate(
                { id: orderId },
                {
                    $set: {
                        paymentStatus: 'paid',
                        orderStatus: 'confirmed',
                        deliveryStatus: 'processing',
                        'transaction.razorpayOrderId': razorpay_order_id,
                        'transaction.razorpayPaymentId': razorpay_payment_id,
                        'transaction.razorpaySignature': razorpay_signature,
                        tracking: updatedTracking,
                        updatedAt: new Date(),
                    },
                },
                { returnDocument: 'after' }
            );

            await upsertUserCart(db, user.id, []);
            return NextResponse.json({ order: sanitizeOrderForResponse(updatedOrder) });
        }

        if (routeParts[0] === 'orders' && routeParts[1] && routeParts[2] === 'cancel') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const order = await db.collection('orders').findOne({ id: routeParts[1] });
            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            if (!isAdmin(user) && order.userId !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (['shipped', 'delivered', 'cancelled'].includes(order.deliveryStatus)) {
                return NextResponse.json({ error: 'Order can no longer be cancelled' }, { status: 400 });
            }

            const updatedOrder = await db.collection('orders').findOneAndUpdate(
                { id: routeParts[1] },
                {
                    $set: {
                        orderStatus: 'cancelled',
                        deliveryStatus: 'cancelled',
                        updatedAt: new Date(),
                    },
                    $push: {
                        tracking: buildTrackingEvent('cancelled', 'Order cancelled by user'),
                    },
                },
                { returnDocument: 'after' }
            );

            return NextResponse.json({ order: sanitizeOrderForResponse(updatedOrder) });
        }

        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { path } = await params;
    const route = path ? path.join('/') : '';

    try {
        const db = await getDb();
        const body = await request.json();
        const routeParts = getRouteParts(route);

        if (routeParts[0] === 'products' && routeParts[1]) {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });

            const productPayload = sanitizeProductPayload(body);
            if (!Object.keys(productPayload).length) {
                return NextResponse.json({ error: 'At least one field is required for update' }, { status: 400 });
            }

            const result = await db.collection('products').findOneAndUpdate(
                { id: routeParts[1] },
                { $set: { ...productPayload, updatedAt: new Date() } },
                { returnDocument: 'after' }
            );

            if (!result) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            return NextResponse.json({ product: result });
        }

        if (routeParts[0] === 'cart' && routeParts[1] === 'items' && routeParts[2]) {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const quantity = Number(body?.quantity || 0);
            if (quantity <= 0) return NextResponse.json({ error: 'Quantity must be greater than zero' }, { status: 400 });

            const product = await db.collection('products').findOne({ id: routeParts[2] });
            if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

            const available = getProductQuantity(product);
            if (available && quantity > available) {
                return NextResponse.json({ error: 'Requested quantity exceeds stock' }, { status: 400 });
            }

            const cart = await getUserCart(db, user.id);
            const items = normalizeCartItems(cart.items || []);
            const idx = items.findIndex((item) => item.productId === routeParts[2]);
            if (idx === -1) return NextResponse.json({ error: 'Product not in cart' }, { status: 404 });

            items[idx].quantity = quantity;
            items[idx].unitPrice = toMoney(product.price);
            const updatedCart = await upsertUserCart(db, user.id, items);
            return NextResponse.json({ cart: sanitizeOrderForResponse(updatedCart) });
        }

        if (routeParts[0] === 'orders' && routeParts[1] && routeParts[2] === 'status') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });

            const order = await db.collection('orders').findOne({ id: routeParts[1] });
            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            const orderStatus = body?.orderStatus || order.orderStatus;
            const deliveryStatus = body?.deliveryStatus || order.deliveryStatus;
            const paymentStatus = body?.paymentStatus || order.paymentStatus;
            const message = body?.message || `Order updated to ${deliveryStatus}`;

            const updatedOrder = await db.collection('orders').findOneAndUpdate(
                { id: routeParts[1] },
                {
                    $set: {
                        orderStatus,
                        deliveryStatus,
                        paymentStatus,
                        updatedAt: new Date(),
                    },
                    $push: {
                        tracking: buildTrackingEvent(deliveryStatus, message),
                    },
                },
                { returnDocument: 'after' }
            );

            return NextResponse.json({ order: sanitizeOrderForResponse(updatedOrder) });
        }

        if (route === 'ads') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });

            const current = await getAdsConfig(db);
            const nextValue = {
                heroBanners: Array.isArray(body?.heroBanners) ? body.heroBanners : current.heroBanners || [],
                offers: Array.isArray(body?.offers) ? body.offers : current.offers || [],
                carousel: Array.isArray(body?.carousel) ? body.carousel : current.carousel || [],
                updatedAt: new Date(),
            };

            await db.collection('siteContent').updateOne(
                { key: 'ads' },
                { $set: { value: nextValue, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
                { upsert: true }
            );

            return NextResponse.json({ ads: nextValue });
        }

        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { path } = await params;
    const route = path ? path.join('/') : '';

    try {
        const db = await getDb();
        const routeParts = getRouteParts(route);

        if (routeParts[0] === 'products' && routeParts[1]) {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });

            const result = await db.collection('products').deleteOne({ id: routeParts[1] });
            if (result.deletedCount === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            return NextResponse.json({ message: 'Product deleted successfully' });
        }

        if (routeParts[0] === 'cart' && routeParts[1] === 'items' && routeParts[2]) {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const cart = await getUserCart(db, user.id);
            const items = normalizeCartItems(cart.items || []).filter((item) => item.productId !== routeParts[2]);
            const updatedCart = await upsertUserCart(db, user.id, items);
            return NextResponse.json({ cart: sanitizeOrderForResponse(updatedCart) });
        }

        if (route === 'cart/clear') {
            const user = await getAuthenticatedUser();
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const updatedCart = await upsertUserCart(db, user.id, []);
            return NextResponse.json({ cart: sanitizeOrderForResponse(updatedCart) });
        }

        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
