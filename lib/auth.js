import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

/* ================= JWT ================= */

export async function createToken(payload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(secret);
    return token;
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getAuthUser() {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return null;

        const payload = await verifyToken(token);
        return payload;
    } catch (error) {
        return null;
    }
}

/* ================= PASSWORD (bcrypt) ================= */

export async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
