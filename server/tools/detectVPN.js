import axios from 'axios';

export async function detectVPN(ip) {
    try {
        // Skip localhost/private IPs
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return false;
        }

        const response = await axios.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, {
            timeout: 5000
        });

        return response.data.proxy || response.data.hosting || false;
    } catch (error) {
        console.error('VPN detection error:', error);
        return false;
    }
}
