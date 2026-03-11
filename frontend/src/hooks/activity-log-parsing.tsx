// hooks/useActivityLogParsing.ts
import { useMemo } from "react";
import { type DeviceData, type IPData } from "@/data/schema";

interface ParsedActivityLog {
  ipData: IPData;
  deviceData: DeviceData;
}

export function useActivityLogParsing(
  ipAddress: string,
  userAgent: string,
): ParsedActivityLog {
  const ipData = useMemo((): IPData => {
    // Remove IPv6 mapping prefix
    const cleaned = ipAddress.replace(/^::ffff:/i, "");

    // Classify IP type
    let type: IPData["type"] = "Public";
    let variant: IPData["variant"] = "default";
    let isInternal = false;

    // Loopback
    if (
      cleaned.startsWith("127.") ||
      cleaned === "::1" ||
      cleaned.toLowerCase() === "localhost"
    ) {
      type = "Loopback";
      variant = "outline";
      isInternal = true;
    }
    // Private Class A (10.0.0.0/8)
    else if (cleaned.startsWith("10.")) {
      type = "Private";
      variant = "secondary";
      isInternal = true;
    }
    // Private Class C (192.168.0.0/16)
    else if (cleaned.startsWith("192.168.")) {
      type = "Private";
      variant = "secondary";
      isInternal = true;
    }
    // Private Class B (172.16.0.0/12) - Docker range
    else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(cleaned)) {
      type = "Docker";
      variant = "secondary";
      isInternal = true;
    }
    // Link-local
    else if (cleaned.startsWith("169.254.")) {
      type = "Private";
      variant = "secondary";
      isInternal = true;
    }

    return {
      original: ipAddress,
      cleaned,
      type,
      variant,
      isInternal,
    };
  }, [ipAddress]);

  const deviceData = useMemo((): DeviceData => {
    const ua = userAgent || "";

    // Bot detection patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /googlebot/i,
      /bingbot/i,
      /slackbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /whatsapp/i,
      /telegrambot/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /axios/i,
      /postman/i,
    ];
    const isBot = botPatterns.some((pattern) => pattern.test(ua));

    // Browser detection
    let browser = "Unknown";
    let browserVersion = "";

    if (ua.includes("Edg/")) {
      // Edge (Chromium)
      const match = ua.match(/Edg\/([\d.]+)/);
      browser = "Edge";
      browserVersion = match ? match[1].split(".")[0] : "";
    } else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
      const match = ua.match(/Chrome\/([\d.]+)/);
      browser = "Chrome";
      browserVersion = match ? match[1].split(".")[0] : "";
    } else if (ua.includes("Firefox/")) {
      const match = ua.match(/Firefox\/([\d.]+)/);
      browser = "Firefox";
      browserVersion = match ? match[1].split(".")[0] : "";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
      const match = ua.match(/Version\/([\d.]+)/);
      browser = "Safari";
      browserVersion = match ? match[1].split(".")[0] : "";
    } else if (ua.includes("Opera/") || ua.includes("OPR/")) {
      const match = ua.match(/(?:Opera|OPR)\/([\d.]+)/);
      browser = "Opera";
      browserVersion = match ? match[1].split(".")[0] : "";
    } else if (ua.includes("MSIE") || ua.includes("Trident/")) {
      browser = "Internet Explorer";
      const match = ua.match(/(?:MSIE |rv:)([\d.]+)/);
      browserVersion = match ? match[1].split(".")[0] : "";
    }

    // OS detection
    let os = "Unknown";
    let osVersion = "";

    if (ua.includes("Windows NT")) {
      os = "Windows";
      const versionMap: Record<string, string> = {
        "10.0": "10/11",
        "6.3": "8.1",
        "6.2": "8",
        "6.1": "7",
        "6.0": "Vista",
        "5.1": "XP",
      };
      const match = ua.match(/Windows NT ([\d.]+)/);
      if (match) {
        osVersion = versionMap[match[1]] || match[1];
      }
    } else if (ua.includes("Mac OS X")) {
      os = "macOS";
      const match = ua.match(/Mac OS X ([\d_]+)/);
      if (match) {
        osVersion = match[1].replace(/_/g, ".");
      }
    } else if (ua.includes("Linux")) {
      os = "Linux";
      if (ua.includes("Ubuntu")) {
        os = "Ubuntu";
      } else if (ua.includes("Fedora")) {
        os = "Fedora";
      } else if (ua.includes("Debian")) {
        os = "Debian";
      }
    } else if (ua.includes("Android")) {
      os = "Android";
      const match = ua.match(/Android ([\d.]+)/);
      osVersion = match ? match[1] : "";
    } else if (ua.includes("iPhone") || ua.includes("iPad")) {
      os = ua.includes("iPad") ? "iPadOS" : "iOS";
      const match = ua.match(/OS ([\d_]+)/);
      if (match) {
        osVersion = match[1].replace(/_/g, ".");
      }
    }

    // Device type detection
    let deviceType: DeviceData["deviceType"] = "Desktop";

    if (isBot) {
      deviceType = "Bot";
    } else if (ua.includes("Mobile") || ua.includes("iPhone")) {
      deviceType = "Mobile";
    } else if (ua.includes("iPad") || ua.includes("Tablet")) {
      deviceType = "Tablet";
    } else if (
      ua.includes("Windows") ||
      ua.includes("Macintosh") ||
      ua.includes("Linux") ||
      ua.includes("X11")
    ) {
      deviceType = "Desktop";
    } else {
      deviceType = "Unknown";
    }

    // Vendor/Manufacturer detection
    let vendor = "";
    if (
      ua.includes("iPhone") ||
      ua.includes("iPad") ||
      ua.includes("Macintosh")
    ) {
      vendor = "Apple";
    } else if (ua.includes("Samsung")) {
      vendor = "Samsung";
    } else if (ua.includes("Huawei")) {
      vendor = "Huawei";
    } else if (ua.includes("Pixel")) {
      vendor = "Google";
    }

    return {
      browser,
      browserVersion,
      os,
      osVersion,
      deviceType,
      isBot,
      vendor,
      raw: ua,
    };
  }, [userAgent]);

  return { ipData, deviceData };
}

// Optional: Export individual parsers if needed
export function parseIPAddress(ipAddress: string): IPData {
  const cleaned = ipAddress.replace(/^::ffff:/i, "");
  let type: IPData["type"] = "Public";
  let variant: IPData["variant"] = "default";
  let isInternal = false;

  if (cleaned.startsWith("127.") || cleaned === "::1") {
    type = "Loopback";
    variant = "outline";
    isInternal = true;
  } else if (cleaned.startsWith("10.")) {
    type = "Private";
    variant = "secondary";
    isInternal = true;
  } else if (cleaned.startsWith("192.168.")) {
    type = "Private";
    variant = "secondary";
    isInternal = true;
  } else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(cleaned)) {
    type = "Docker";
    variant = "secondary";
    isInternal = true;
  }

  return { original: ipAddress, cleaned, type, variant, isInternal };
}

export function parseUserAgent(userAgent: string): DeviceData {
  // Same logic as above, extracted for reusability
  const ua = userAgent || "";

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /googlebot/i,
    /bingbot/i,
    /slackbot/i,
  ];
  const isBot = botPatterns.some((pattern) => pattern.test(ua));

  let browser = "Unknown";
  let browserVersion = "";

  if (ua.includes("Edg/")) {
    const match = ua.match(/Edg\/([\d.]+)/);
    browser = "Edge";
    browserVersion = match ? match[1].split(".")[0] : "";
  } else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    browser = "Chrome";
    browserVersion = match ? match[1].split(".")[0] : "";
  } else if (ua.includes("Firefox/")) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    browser = "Firefox";
    browserVersion = match ? match[1].split(".")[0] : "";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    const match = ua.match(/Version\/([\d.]+)/);
    browser = "Safari";
    browserVersion = match ? match[1].split(".")[0] : "";
  }

  let os = "Unknown";
  let osVersion = "";

  if (ua.includes("Windows NT")) {
    os = "Windows";
    const versionMap: Record<string, string> = {
      "10.0": "10/11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
    };
    const match = ua.match(/Windows NT ([\d.]+)/);
    if (match) {
      osVersion = versionMap[match[1]] || match[1];
    }
  } else if (ua.includes("Mac OS X")) {
    os = "macOS";
    const match = ua.match(/Mac OS X ([\d_]+)/);
    if (match) {
      osVersion = match[1].replace(/_/g, ".");
    }
  } else if (ua.includes("Linux")) {
    os = "Linux";
  } else if (ua.includes("Android")) {
    os = "Android";
    const match = ua.match(/Android ([\d.]+)/);
    osVersion = match ? match[1] : "";
  } else if (ua.includes("iPhone") || ua.includes("iPad")) {
    os = ua.includes("iPad") ? "iPadOS" : "iOS";
    const match = ua.match(/OS ([\d_]+)/);
    if (match) {
      osVersion = match[1].replace(/_/g, ".");
    }
  }

  let deviceType: DeviceData["deviceType"] = "Desktop";
  if (isBot) {
    deviceType = "Bot";
  } else if (ua.includes("Mobile") || ua.includes("iPhone")) {
    deviceType = "Mobile";
  } else if (ua.includes("iPad") || ua.includes("Tablet")) {
    deviceType = "Tablet";
  }

  let vendor = "";
  if (
    ua.includes("iPhone") ||
    ua.includes("iPad") ||
    ua.includes("Macintosh")
  ) {
    vendor = "Apple";
  } else if (ua.includes("Samsung")) {
    vendor = "Samsung";
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    deviceType,
    isBot,
    vendor,
    raw: ua,
  };
}
