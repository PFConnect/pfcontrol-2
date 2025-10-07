import axios from 'axios';

export async function detectVPN(ip, req) {
    try {
        if (ip === '127.0.0.1' && req) {
            ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log(`IP extrahiert aus Header: ${ip}`);
        }

        // Skip localhost/private IPs
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('fc00::') || ip.startsWith('fe80::')) {
            console.log(`VPN detection skipped for localhost/private IP: ${ip}`);
            return false;
        }

        const response = await axios.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, {
            timeout: 5000
        });

        const isVpn = response.data.proxy || response.data.hosting || false;
        return isVpn;
    } catch (error) {
        console.error('VPN detection error for IP:', ip, error);
        return false;
    }
}