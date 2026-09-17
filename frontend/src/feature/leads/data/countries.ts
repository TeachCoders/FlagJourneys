import apiClient from "@/lib/apiClient";

export interface Country {
  name: string;
  code: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  { name: "India", code: "IN", dialCode: "+91" },
  { name: "United States", code: "US", dialCode: "+1" },
  { name: "United Kingdom", code: "GB", dialCode: "+44" },
  { name: "Australia", code: "AU", dialCode: "+61" },
  { name: "Canada", code: "CA", dialCode: "+1" },
  { name: "Germany", code: "DE", dialCode: "+49" },
  { name: "France", code: "FR", dialCode: "+33" },
  { name: "Japan", code: "JP", dialCode: "+81" },
  { name: "China", code: "CN", dialCode: "+86" },
  { name: "Singapore", code: "SG", dialCode: "+65" },
  { name: "UAE", code: "AE", dialCode: "+971" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966" },
  { name: "Thailand", code: "TH", dialCode: "+66" },
  { name: "Malaysia", code: "MY", dialCode: "+60" },
  { name: "South Korea", code: "KR", dialCode: "+82" },
  { name: "Italy", code: "IT", dialCode: "+39" },
  { name: "Spain", code: "ES", dialCode: "+34" },
  { name: "Netherlands", code: "NL", dialCode: "+31" },
  { name: "Brazil", code: "BR", dialCode: "+55" },
  { name: "Russia", code: "RU", dialCode: "+7" },
  { name: "South Africa", code: "ZA", dialCode: "+27" },
  { name: "New Zealand", code: "NZ", dialCode: "+64" },
  { name: "Nepal", code: "NP", dialCode: "+977" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94" },
  { name: "Bangladesh", code: "BD", dialCode: "+880" },
  { name: "Turkey", code: "TR", dialCode: "+90" },
  { name: "Indonesia", code: "ID", dialCode: "+62" },
  { name: "Philippines", code: "PH", dialCode: "+63" },
  { name: "Egypt", code: "EG", dialCode: "+20" },
  { name: "Kenya", code: "KE", dialCode: "+254" },
  { name: "Poland", code: "PL", dialCode: "+48" },
  { name: "Czech Republic", code: "CZ", dialCode: "+420" },
  { name: "Ukraine", code: "UA", dialCode: "+380" },
  { name: "Ireland", code: "IE", dialCode: "+353" },
  { name: "Mexico", code: "MX", dialCode: "+52" },
  { name: "Argentina", code: "AR", dialCode: "+54" },
  { name: "Portugal", code: "PT", dialCode: "+351" },
  { name: "Greece", code: "GR", dialCode: "+30" },
  { name: "Sweden", code: "SE", dialCode: "+46" },
  { name: "Norway", code: "NO", dialCode: "+47" },
  { name: "Denmark", code: "DK", dialCode: "+45" },
  { name: "Finland", code: "FI", dialCode: "+358" },
  { name: "Switzerland", code: "CH", dialCode: "+41" },
  { name: "Austria", code: "AT", dialCode: "+43" },
  { name: "Belgium", code: "BE", dialCode: "+32" },
  { name: "Vietnam", code: "VN", dialCode: "+84" },
  { name: "Hong Kong", code: "HK", dialCode: "+852" },
  { name: "Taiwan", code: "TW", dialCode: "+886" },
  { name: "Qatar", code: "QA", dialCode: "+974" },
  { name: "Kuwait", code: "KW", dialCode: "+965" },
  { name: "Oman", code: "OM", dialCode: "+968" },
  { name: "Bahrain", code: "BH", dialCode: "+973" },
  { name: "Israel", code: "IL", dialCode: "+972" },
  { name: "Jordan", code: "JO", dialCode: "+962" },
  { name: "Morocco", code: "MA", dialCode: "+212" },
  { name: "Mauritius", code: "MU", dialCode: "+230" },
  { name: "Maldives", code: "MV", dialCode: "+960" },
  { name: "Bhutan", code: "BT", dialCode: "+975" },
  { name: "Myanmar", code: "MM", dialCode: "+95" },
  { name: "Nigeria", code: "NG", dialCode: "+234" },
  { name: "Ghana", code: "GH", dialCode: "+233" },
  { name: "Tanzania", code: "TZ", dialCode: "+255" },
  { name: "Uganda", code: "UG", dialCode: "+256" },
  { name: "Pakistan", code: "PK", dialCode: "+92" },
  { name: "Kazakhstan", code: "KZ", dialCode: "+7" },
];

export const HOTEL_CATEGORIES = [
  "Budget",
  "3 Star",
  "4 Star",
  "5 Star",
  "5 Star Luxury",
  "Heritage",
  "Resort",
  "Hostel",
  "Villa",
  "Homestay",
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function detectCountryFromIP(): Promise<Country | null> {
  return detectGeoFromIP().then((geo) => geo?.country || null);
}

export interface GeoMeta {
  ip: string;
  country: Country | null;
  location: string;
}

export function detectGeoFromIP(): Promise<GeoMeta | null> {
  return apiClient
    .get("/chat/geo")
    .then((res) => {
      const geo = res.data?.data;
      if (!geo) return null;
      const country = getCountryByCode(geo.countryCode || "") || null;
      return {
        ip: geo.ip || "",
        country,
        location: geo.location || "",
      };
    })
    .catch(() => null);
}

export function stripDialCode(phone: string, dialCode: string): string {
  const stripped = phone.replace(new RegExp(`^\\s*\\${dialCode}`), "").trim();
  return stripped === phone ? phone.replace(/^\+?\d[\d\s-]*/, "").trim() : stripped;
}

export function getCountryFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
