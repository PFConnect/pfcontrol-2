import crypto from 'crypto';

export function generateSessionId() {
    return crypto.randomBytes(4).toString('hex').substring(0, 8);
}
export function generateAccessId() {
    return crypto.randomBytes(32).toString('hex');
}