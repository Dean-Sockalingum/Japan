const QRCode = require('qrcode');

exports.handler = async (event) => {
    if (event.httpMethod && event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Method Not Allowed' })
        };
    }

    try {
        const payload = event.body ? JSON.parse(event.body) : {};
        const { url } = payload;

        if (!url || typeof url !== 'string') {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Missing or invalid url' })
            };
        }

        const qr = await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr })
        };
    } catch (error) {
        console.error('QR code generation failed:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Failed to generate QR code' })
        };
    }
};
