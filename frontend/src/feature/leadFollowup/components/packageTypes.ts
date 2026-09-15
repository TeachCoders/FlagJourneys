export interface PackageItem {
  id?: number;
  location: string;
  ServiceName: string;
  ServcieQty: number;
  UnitPrice: number;
  TotalPrice: number;
  hotelName?: string;
  hotelType?: string;
  carName?: string;
  carOwnerName?: string;
  carType?: string;
  carCities?: string[];
  guideName?: string;
  guideLanguage?: string;
  vendorId?: number;
  startDate?: string;
  endDate?: string;
}

// ── Default Inclusions (Standard Travel Industry) ──
export const DEFAULT_INCLUDES = [
  "Hotel Accommodation (as per selected category)",
  "Daily Breakfast",
  "Private AC Vehicle for all transfers & sightseeing",
  "Driver Allowance & Fuel Charges",
  "All Toll Tax, Parking & State Tax",
  "GST (as applicable)",
  "Dedicated Tour Coordinator",
];

// ── Default Exclusions (Standard Travel Industry) ──
export const DEFAULT_EXCLUDES = [
  "Flight / Train / Bus Tickets",
  "Personal & Shopping Expenses",
  "Lunch & Dinner (unless mentioned)",
  "Monument / Museum Entry Tickets",
  "Adventure Activity Charges",
  "Camera / Video Charges at Monuments",
  "Tips & Porter Charges",
  "Any expense due to Natural Calamity / Strike / Political Unrest",
  "Travel Insurance",
];

// ── Default Notes ──
export const DEFAULT_NOTES =
  "Hotel rooms subject to availability at time of confirmation.\n" +
  "Rates valid for the mentioned travel dates only — may change without prior notice.\n" +
  "Standard Check-in: 2:00 PM | Standard Check-out: 11:00 AM. Early check-in / late check-out subject to availability.\n" +
  "AC in vehicles not available in hill stations above 7,000 ft.\n" +
  "Company is not responsible for any delay or loss due to natural calamity or government restrictions.\n" +
  "Any extra km / night / service not included in the package will be charged extra.";

// ── Default Cancellation Policy (Industry Standard) ──
export const DEFAULT_CANCELLATION_POLICY =
  "CANCELLATION POLICY (Flag Journeys)\n\n" +
  "• Cancelled 30 days or more before travel date → 10% of total package cost\n" +
  "• Cancelled 15–30 days before travel date → 25% of total package cost\n" +
  "• Cancelled 7–15 days before travel date → 50% of total package cost\n" +
  "• Cancelled less than 7 days before travel date → 100% Non-Refundable\n" +
  "• No Show / Non-Arrival → 100% Non-Refundable\n\n" +
  "ADDITIONAL TERMS:\n" +
  "• Refunds (if applicable) processed within 7–10 working days to the original payment source.\n" +
  "• Cancellation request must be in writing via email or your Traveller Portal.\n" +
  "• In case of natural calamity, flight cancellation, or government travel ban — partial refund subject to vendor recovery.\n" +
  "• Date change / amendment requests subject to availability; may incur charges of ₹500–₹2,000 per person.\n" +
  "• Unused hotel nights, meals, or transport due to early departure are non-refundable.";
