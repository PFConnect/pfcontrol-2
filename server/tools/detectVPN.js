import axios from 'axios';

export async function detectVPN(req) {
    let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Skip localhost/private IPs
    if (ip.startsWith('172.') || ip.startsWith('192.168.') || ip === '127.0.0.1') {
        console.log(`Ignoring private or Docker IP: ${ip}`);
        return false;
    }

    try {
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