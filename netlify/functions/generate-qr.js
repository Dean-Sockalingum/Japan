const _0x107940 = _0x4a55;
function _0x536d() {
    const _0xd38131 = [
        'ailed:',
        'RWMvd',
        '187980ubyhNN',
        'fWBZO',
        '2432115snQRvB',
        'R\x20code',
        'generate\x20Q',
        'FAKkt',
        'stringify',
        'XfKnZ',
        '3639524ezxtUh',
        'handler',
        'applicatio',
        '1563894BSeHRV',
        '40ocaqja',
        'n/json',
        '112ForYBk',
        '1272231VcLnJv',
        'POST',
        'qrcode',
        'neration\x20f',
        '1KCWBAn',
        'fFiZt',
        'HPPaq',
        '\x20invalid\x20u',
        'string',
        'parse',
        'error',
        'Missing\x20or',
        'sUWXU',
        '1473580ACJRWH',
        '600554txKcTp',
        'odMua',
        'wBrKS',
        'QR\x20code\x20ge',
        'body',
        'Method\x20Not'
    ];
    _0x536d = function () {
        return _0xd38131;
    };
    return _0x536d();
}
(function (_0x3a1a07, _0x422b03) {
    const _0x4866e5 = _0x4a55, _0x566510 = _0x3a1a07();
    while (!![]) {
        try {
            const _0x2a0f2b = -parseInt(_0x4866e5(0xde)) / (-0x8 * 0x3f5 + 0x1c0b * -0x1 + 0x3bb4) * (-parseInt(_0x4866e5(0xe8)) / (0x650 * -0x4 + -0xe * -0x17d + -0x2 * -0x236)) + parseInt(_0x4866e5(0xd6)) / (-0x2 * 0x787 + 0x1be + -0x3 * -0x471) + -parseInt(_0x4866e5(0xf8)) / (-0x526 * -0x3 + -0xaba + -0x4b4) + parseInt(_0x4866e5(0xf2)) / (-0x2034 + 0x17 * 0x161 + 0x82) + parseInt(_0x4866e5(0xf0)) / (0xd1 * -0x1a + 0x801 + 0xd3f) * (-parseInt(_0x4866e5(0xd9)) / (0x20e7 + -0x1 * -0x1edf + -0x3fbf)) + -parseInt(_0x4866e5(0xd7)) / (0xc6e + -0x1a * -0x6f + -0x3 * 0x7e4) * (-parseInt(_0x4866e5(0xda)) / (0x393 * -0xa + -0x1a40 + 0x3e07)) + -parseInt(_0x4866e5(0xe7)) / (-0x1 * -0x6e6 + 0xd * 0x1f3 + 0x1 * -0x2033);
            if (_0x2a0f2b === _0x422b03)
                break;
            else
                _0x566510['push'](_0x566510['shift']());
        } catch (_0x41f5ba) {
            _0x566510['push'](_0x566510['shift']());
        }
    }
}(_0x536d, 0xb0b39 + -0x29ff * 0x2f + 0x3a0ea * 0x1));
function _0x4a55(_0x1194f3, _0x2635f7) {
    const _0x3430cf = _0x536d();
    return _0x4a55 = function (_0x55d784, _0x356200) {
        _0x55d784 = _0x55d784 - (0x3df * 0x5 + 0x5b5 * 0x1 + -0x40a * 0x6);
        let _0x19c90e = _0x3430cf[_0x55d784];
        return _0x19c90e;
    }, _0x4a55(_0x1194f3, _0x2635f7);
}
const QRCode = require(_0x107940(0xdc));
exports[_0x107940(0xd4)] = async _0x166168 => {
    const _0x386a82 = _0x107940, _0x5c0085 = {
            'RWMvd': function (_0xf267ae, _0x53467f) {
                return _0xf267ae !== _0x53467f;
            },
            'fWBZO': _0x386a82(0xdb),
            'fFiZt': _0x386a82(0xd5) + _0x386a82(0xd8),
            'XfKnZ': _0x386a82(0xed) + '\x20Allowed',
            'wBrKS': function (_0x1bee48, _0xb2f42b) {
                return _0x1bee48 !== _0xb2f42b;
            },
            'odMua': _0x386a82(0xe2),
            'HPPaq': _0x386a82(0xe5) + _0x386a82(0xe1) + 'rl',
            'FAKkt': _0x386a82(0xeb) + _0x386a82(0xdd) + _0x386a82(0xee),
            'sUWXU': 'Failed\x20to\x20' + _0x386a82(0xf4) + _0x386a82(0xf3)
        };
    if (_0x166168['httpMethod'] && _0x5c0085[_0x386a82(0xef)](_0x166168['httpMethod'], _0x5c0085[_0x386a82(0xf1)]))
        return {
            'statusCode': 0x195,
            'headers': { 'Content-Type': _0x5c0085[_0x386a82(0xdf)] },
            'body': JSON['stringify']({ 'message': _0x5c0085[_0x386a82(0xf7)] })
        };
    try {
        const _0x4cebde = _0x166168['body'] ? JSON[_0x386a82(0xe3)](_0x166168[_0x386a82(0xec)]) : {}, {url: _0x5effc2} = _0x4cebde;
        if (!_0x5effc2 || _0x5c0085[_0x386a82(0xea)](typeof _0x5effc2, _0x5c0085[_0x386a82(0xe9)]))
            return {
                'statusCode': 0x190,
                'headers': { 'Content-Type': _0x5c0085[_0x386a82(0xdf)] },
                'body': JSON[_0x386a82(0xf6)]({ 'message': _0x5c0085[_0x386a82(0xe0)] })
            };
        const _0x1b20dc = await QRCode['toDataURL'](_0x5effc2, {
            'errorCorrectionLevel': 'H',
            'margin': 0x1,
            'width': 0x12c
        });
        return {
            'statusCode': 0xc8,
            'headers': { 'Content-Type': _0x5c0085['fFiZt'] },
            'body': JSON['stringify']({ 'qr': _0x1b20dc })
        };
    } catch (_0x27d28c) {
        return console[_0x386a82(0xe4)](_0x5c0085[_0x386a82(0xf5)], _0x27d28c), {
            'statusCode': 0x1f4,
            'headers': { 'Content-Type': _0x5c0085[_0x386a82(0xdf)] },
            'body': JSON[_0x386a82(0xf6)]({ 'message': _0x5c0085[_0x386a82(0xe6)] })
        };
    }
};