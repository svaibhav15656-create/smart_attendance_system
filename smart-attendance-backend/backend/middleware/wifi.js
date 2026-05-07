const checkWifiRestriction = (req, res, next) => {
  // Skip WiFi check if no prefixes configured (development mode)
  const allowedPrefixes = process.env.ALLOWED_IP_PREFIXES;
  if (!allowedPrefixes || allowedPrefixes.trim() === '') {
    req.wifiVerified = true;
    return next();
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '';

  // Normalize IPv6 loopback
  const cleanIp = ip === '::1' ? '127.0.0.1' : ip.replace('::ffff:', '');

  const prefixes = allowedPrefixes.split(',').map(p => p.trim());
  const isAllowed =
    cleanIp === '127.0.0.1' || // always allow localhost in dev
    prefixes.some(prefix => cleanIp.startsWith(prefix));

  if (!isAllowed) {
    return res.status(403).json({
      error: 'WiFi restriction',
      message: 'Attendance can only be marked from college WiFi network.',
      yourIp: cleanIp
    });
  }

  req.clientIp = cleanIp;
  req.wifiVerified = true;
  next();
};

const getClientIp = (req) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    '';
  return ip === '::1' ? '127.0.0.1' : ip.replace('::ffff:', '');
};

module.exports = { checkWifiRestriction, getClientIp };
