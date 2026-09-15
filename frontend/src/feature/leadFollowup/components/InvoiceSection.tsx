"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  FileText,
  MapPin,
  Plus,
  Eye,
  Trash,
  Save,
  RefreshCw,
  History,
  Hash,
  Users,
  User as UserIcon,
  Info,
  CheckCircle2,
  XCircle,
  Mail,
  ChevronDown,
  Hotel,
  Car,
  Navigation,
  ImageIcon,
  MessageCircle,
} from "lucide-react";
import DayItineraryEditor from "@/components/shared/DayItineraryEditor";
import BannerImageUpload from "@/components/shared/BannerImageUpload";
import {
  useGetPackageBuilder,
  useSavePackageBuilderMutation,
  useDeletePackageBuilderMutation,
  useSendInvoiceEmailMutation,
  useMarkInvoiceSentMutation,
} from "../api/useLeadFollowup";
import apiClient from "@/lib/apiClient";
import { generatePdfUrl } from "../api";
import { useGetCurrentUser } from "@/feature/auth/api/useAuth";
import { ReusableModel } from "@/components/shared/reusableModel";
import { DialogTitle } from "@/components/ui/dialog";
import WhatsAppShareBtn from "@/components/shared/whatsAppShareBtn";
import { successToast, errorToast } from "@/components/shared/tost";
import type { PackageItem } from "./packageTypes";
import { DEFAULT_INCLUDES, DEFAULT_EXCLUDES, DEFAULT_NOTES, DEFAULT_CANCELLATION_POLICY } from "./packageTypes";
import TourPackageSection from "./TourPackageSection";
import InvoiceMainSection from "./InvoiceMainSection";
import InclusionsSection from "./InclusionsSection";
import ExclusionsSection from "./ExclusionsSection";
import PaymentPolicySection from "./PaymentPolicySection";
import CancellationPolicySection from "./CancellationPolicySection";
import PageLoader from "@/components/shared/PageLoader";
import VendorAssignmentModal from "./VendorAssignmentModal";
import { Briefcase } from "lucide-react";

export default function packagesection({
  leadId,
  leadStatus,
  clientName,
  clientEmail,
  clientPhone,
  cityNames,
  activeSection,
  lead,
}: {
  leadId: number | string;
  leadStatus?: any;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  cityNames?: string;
  activeSection?: "tour-package" | "invoice" | "inclusions" | "exclusions" | "payment-policy" | "cancellation-policy";
  lead?: any;
}) {
  const [items, setItems] = useState<PackageItem[]>([]);
  const [newCity, setNewCity] = useState("");
  const [gstRate, setGstRate] = useState(12);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVendorAssignOpen, setIsVendorAssignOpen] = useState(false);
  const [viewingHistoryPackage, setViewingHistoryPackage] = useState<any>(null);

  const [quotationNo, setQuotationNo] = useState("");
  const [validTill, setValidTill] = useState("");

  const [packageName, setPackageName] = useState("");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);

  const [discount, setDiscount] = useState<number>(0);

  const [includes, setIncludes] = useState<string[]>(DEFAULT_INCLUDES);
  const [excludes, setExcludes] = useState<string[]>(DEFAULT_EXCLUDES);
  const [newInclude, setNewInclude] = useState("");
  const [newExclude, setNewExclude] = useState("");

  const [notes, setNotes] = useState<string>(DEFAULT_NOTES);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [balanceTerms, setBalanceTerms] = useState<string>("Before Arrival");
  const [cancellationPolicy, setCancellationPolicy] = useState<string>(DEFAULT_CANCELLATION_POLICY);

  const [itinerary, setItinerary] = useState<{ day: number; title: string; content: string }[]>([]);

  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [bannerUrls, setBannerUrls] = useState<string[]>([]);

  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { user } = useGetCurrentUser();
  const { data: packageResponse, isLoading: isLoadingPackages } = useGetPackageBuilder(String(leadId));
  const packages = packageResponse?.data || [];

  const savePackageMutation = useSavePackageBuilderMutation();
  const deletePackageBuilderMutation = useDeletePackageBuilderMutation();
  const sendInvoiceEmailMutation = useSendInvoiceEmailMutation();
  const markInvoiceSentMutation = useMarkInvoiceSentMutation();

  const isEmailSent = packages?.find((p: any) => p.id === selectedPackageId)?.isEmailSent;
  const isWhatsappSent = packages?.find((p: any) => p.id === selectedPackageId)?.isWhatsappSent;

  const normalizedRole = (user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const isSuperAdmin = normalizedRole.includes("super") && normalizedRole.includes("admin");

  const generateQuotationNo = () => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const seq = String((packages?.length || 0) + 1).padStart(3, "0");
    return `QT-${dateStr}-${seq}`;
  };

  const getDefaultValidTill = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

  const applyPackageToState = (pkg: any) => {
    setSelectedPackageId(pkg.id);
    setItems(pkg.items || []);
    const calculatedGst = pkg.subtotal > 0 ? Math.round((pkg.gst / pkg.subtotal) * 100) : 12;
    setGstRate(calculatedGst);
    setDiscount(pkg.discount || 0);
    setQuotationNo(pkg.quotationNo || generateQuotationNo());
    setValidTill(pkg.validTill ? String(pkg.validTill).split("T")[0] : getDefaultValidTill());
    setPackageName(pkg.packageName || "");
    setDestination(pkg.destination || "");
    setDuration(pkg.duration || "");
    setTravelDate(pkg.travelDate ? String(pkg.travelDate).split("T")[0] : "");
    setAdults(pkg.adults ?? 1);
    setChildren(pkg.children ?? 0);
    setIncludes(pkg.includes && pkg.includes.length > 0 ? pkg.includes : DEFAULT_INCLUDES);
    setExcludes(pkg.excludes && pkg.excludes.length > 0 ? pkg.excludes : DEFAULT_EXCLUDES);
    setNotes(pkg.notes || DEFAULT_NOTES);
    setAdvanceAmount(pkg.advanceAmount || 0);
    setBalanceTerms(pkg.balanceTerms || "Before Arrival");
    setCancellationPolicy(pkg.cancellationPolicy || DEFAULT_CANCELLATION_POLICY);
    setItinerary(Array.isArray(pkg.itinerary) ? pkg.itinerary : []);
    setBannerUrls(Array.isArray(pkg.bannerImageUrl) ? pkg.bannerImageUrl : pkg.bannerImageUrl ? [pkg.bannerImageUrl] : []);
    setBannerFiles([]);
  };

  const resetToBlank = () => {
    setSelectedPackageId(null);
    setItems([]);
    setGstRate(12);
    setDiscount(0);
    setQuotationNo(generateQuotationNo());
    setValidTill(getDefaultValidTill());
    setPackageName("");
    setDestination("");
    setDuration("");
    setTravelDate("");
    setAdults(1);
    setChildren(0);
    setIncludes(DEFAULT_INCLUDES);
    setExcludes(DEFAULT_EXCLUDES);
    setNotes(DEFAULT_NOTES);
    setAdvanceAmount(0);
    setBalanceTerms("Before Arrival");
    setCancellationPolicy(DEFAULT_CANCELLATION_POLICY);
    setItinerary([]);
    setBannerFiles([]);
    setBannerUrls([]);
  };

  useEffect(() => {
    if (packages.length > 0 && selectedPackageId === null) {
      applyPackageToState(packages[0]);
    } else if (packages.length === 0 && !quotationNo) {
      resetToBlank();
    }
  }, [packages, selectedPackageId]);

  useEffect(() => {
    if (!cityNames || items.length > 0 || packages.length > 0) return;
    const cities = cityNames.split(",").map(c => c.trim()).filter(Boolean);
    if (cities.length === 0) return;

    const reqStart = lead?.requirement?.startDate;
    const reqEnd = lead?.requirement?.endDate;

    const newItems: PackageItem[] = [];
    let currentDate = reqStart ? new Date(reqStart) : null;

    for (const city of cities) {
      const nights = 1;
      let startDateStr = "";
      let endDateStr = "";
      if (currentDate && reqEnd) {
        startDateStr = currentDate.toISOString().split("T")[0];
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + nights);
        if (endDate > new Date(reqEnd)) endDate.setTime(new Date(reqEnd).getTime());
        endDateStr = endDate.toISOString().split("T")[0];
        currentDate = new Date(endDate);
      }
      newItems.push({
        location: city,
        ServiceName: "Hotel",
        ServcieQty: 1,
        UnitPrice: 0,
        TotalPrice: 0,
        hotelName: "",
        hotelType: "",
        startDate: startDateStr,
        endDate: endDateStr,
      });
    }
    setItems(newItems);
  }, [cityNames, lead?.requirement?.startDate, lead?.requirement?.endDate]);



  const addCity = () => {
    if (!newCity.trim()) return;
    const reqStart = lead?.requirement?.startDate;
    const reqEnd = lead?.requirement?.endDate;

    let startDateStr = "";
    let endDateStr = "";
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      if (lastItem.endDate) {
        startDateStr = lastItem.endDate;
        const endDate = new Date(lastItem.endDate);
        endDate.setDate(endDate.getDate() + 1);
        if (reqEnd && endDate > new Date(reqEnd)) endDate.setTime(new Date(reqEnd).getTime());
        endDateStr = endDate.toISOString().split("T")[0];
      }
    } else if (reqStart) {
      startDateStr = new Date(reqStart).toISOString().split("T")[0];
      const endDate = new Date(reqStart);
      endDate.setDate(endDate.getDate() + 1);
      if (reqEnd && endDate > new Date(reqEnd)) endDate.setTime(new Date(reqEnd).getTime());
      endDateStr = endDate.toISOString().split("T")[0];
    }

    const newItem: PackageItem = {
      location: newCity.trim(),
      ServiceName: "Hotel",
      ServcieQty: 1,
      UnitPrice: 0,
      TotalPrice: 0,
      hotelName: "",
      hotelType: "",
      startDate: startDateStr,
      endDate: endDateStr,
    };
    setItems([...items, newItem]);
    setNewCity("");
  };

  const addService = (loc: string, serviceName: string) => {
    const cityItem = items.find(it => it.location === loc);
    const base = { location: loc, ServiceName: serviceName, ServcieQty: 0, UnitPrice: 0, TotalPrice: 0, startDate: cityItem?.startDate || "", endDate: cityItem?.endDate || "" };
    if (serviceName === "Hotel") setItems([...items, { ...base, hotelName: "", hotelType: "" }]);
    else if (serviceName === "Car") setItems([...items, { ...base, carName: "", carType: "" }]);
    else if (serviceName === "Guide") setItems([...items, { ...base, guideName: "", guideLanguage: "" }]);
  };

  const handleChange = (index: number, field: keyof PackageItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].TotalPrice = (Number(newItems[index].ServcieQty) || 0) * (Number(newItems[index].UnitPrice) || 0);
    setItems(newItems);
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const addInclude = () => {
    if (!newInclude.trim()) return;
    setIncludes([...includes, newInclude.trim()]);
    setNewInclude("");
  };
  const removeInclude = (idx: number) => setIncludes(includes.filter((_, i) => i !== idx));

  const addExclude = () => {
    if (!newExclude.trim()) return;
    setExcludes([...excludes, newExclude.trim()]);
    setNewExclude("");
  };
  const removeExclude = (idx: number) => setExcludes(excludes.filter((_, i) => i !== idx));

  const createNewPackage = () => {
    resetToBlank();
    successToast("Ready to build new invoice");
  };

  const loadInvoice = (inv: any) => {
    applyPackageToState(inv);
    successToast(`Loaded Package Version #${inv.version}`);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      errorToast("Please add at least one service/item before saving.");
      return;
    }

    if (!itinerary || itinerary.length === 0) {
      errorToast("Please add the day program (itinerary) before saving.");
      return;
    }

    const minAdvance = Math.round(payablePrice * 0.5);
    if (advanceAmount > 0 && advanceAmount < minAdvance) {
      errorToast(`Advance must be at least 50% (₹${minAdvance.toLocaleString("en-IN")})`);
      return;
    }

    let finalBannerUrls = [...bannerUrls];
    if (bannerFiles.length > 0) {
      for (const file of bannerFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await apiClient.post("/upload", formData);
          const uploadData = uploadRes.data;
          if (uploadData.url) {
            finalBannerUrls.push(uploadData.url);
          }
        } catch {
          errorToast("Failed to upload banner image");
        }
      }
      setBannerUrls(finalBannerUrls);
      setBannerFiles([]);
    }

    const subtotal = items.reduce((sum, item) => sum + item.TotalPrice, 0);
    const gstAmount = Math.round(subtotal * (gstRate / 100));
    const discountAmount = Number(discount) || 0;
    const grandTotalAmount = subtotal + gstAmount - discountAmount;

    savePackageMutation.mutate(
      {
        leadId,
        payload: {
          packageId: selectedPackageId,
          quotationNo,
          validTill,
          packageName,
          destination,
          duration,
          travelDate,
          adults: Number(adults || 0),
          children: Number(children || 0),
          items: items.map(item => ({
            location: item.location,
            ServiceName: item.ServiceName,
            ServcieQty: Number(item.ServcieQty || 0),
            UnitPrice: Number(item.UnitPrice || 0),
            TotalPrice: Number(item.TotalPrice || 0),
            vendorId: item.vendorId || null,
            hotelName: item.hotelName || null,
            hotelType: item.hotelType || null,
            carName: item.carName || null,
            carOwnerName: item.carOwnerName || null,
            carType: item.carType || null,
            guideName: item.guideName || null,
            guideLanguage: item.guideLanguage || null,
            startDate: item.startDate || null,
            endDate: item.endDate || null,
          })),
          subtotal,
          gst: gstAmount,
          discount: discountAmount,
          serviceCharges: 0,
          grandTotal: grandTotalAmount,
          includes,
          excludes,
          notes,
          cancellationPolicy,
          advanceAmount: Number(advanceAmount || 0),
          balanceTerms,
          itinerary,
          bannerImageUrl: finalBannerUrls,
          status: "SAVED"
        }
      },
      {
        onSuccess: (res: any) => {
          successToast(selectedPackageId ? "Package updated successfully!" : "New package created and saved!");
          if (res?.data?.id) {
            setSelectedPackageId(res.data.id);
          }
        },
        onError: () => {
          errorToast("Failed to save invoice. Please try again.");
        }
      }
    );
  };

  const handleSendInvoice = () => {
    if (!selectedPackageId) {
      errorToast("Please save the package first before sending.");
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.TotalPrice, 0);
    const gstAmount = Math.round(subtotal * (gstRate / 100));
    const discountAmount = Number(discount) || 0;
    const grandTotalAmount = subtotal + gstAmount - discountAmount;

    sendInvoiceEmailMutation.mutate(
      {
        leadId,
        payload: {
          invoiceNo: quotationNo,
          packageName,
          destination,
          travelDate,
          duration: computedDuration,
          items,
          includes,
          excludes,
          notes,
          cancellationPolicy,
          advanceAmount,
          balanceTerms,
          validTill,
          subtotal,
          gst: gstAmount,
          discount: discountAmount,
          grandTotal: grandTotalAmount,
          itinerary,
          bannerImageUrl: bannerUrls,
          gstRate,
          travellerInfo: lead ? {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            cityNames: lead.requirement?.cityNames,
            serviceType: lead.requirement?.serviceType,
            tourTypes: lead.requirement?.tourTypes || [],
            startDate: lead.requirement?.startDate,
            endDate: lead.requirement?.endDate,
            adults: lead.requirement?.adults || 0,
            children: lead.requirement?.children || 0,
            budget: lead.requirement?.budget || 0,
            needGuide: lead.requirement?.needGuide || false,
          } : null,
        }
      },
      {
        onSuccess: () => successToast("Invoice sent to traveller successfully!"),
        onError: () => errorToast("Failed to send invoice. Please try again.")
      }
    );
  };

  const handleDeletePackage = (id: number) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deletePackageBuilderMutation.mutate(
        { id, leadId },
        {
          onSuccess: () => {
            successToast("Invoice deleted successfully!");
            if (selectedPackageId === id) {
              createNewPackage();
            }
          },
          onError: () => {
            errorToast("Failed to delete invoice. Please try again.");
          }
        }
      );
    }
  };

  const groupedData = items.reduce((acc: any, item) => {
    if (!acc[item.location]) acc[item.location] = [];
    acc[item.location].push(item);
    return acc;
  }, {});

  const subtotal = items.reduce((sum, item) => sum + item.TotalPrice, 0);
  const gstAmount = Math.round(subtotal * (gstRate / 100));
  const discountAmount = Number(discount) || 0;
  const payablePrice = subtotal + gstAmount - discountAmount;

  // Auto-calculate duration from traveller requirement dates
  const computedDuration = (() => {
    const start = lead?.requirement?.startDate;
    const end = lead?.requirement?.endDate;
    if (!start || !end) return duration;
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return duration;
    const totalDays = Math.ceil(diffMs / 86400000) + 1;
    const nights = totalDays - 1;
    return `${nights > 0 ? nights + "N" : ""} ${totalDays > 0 ? totalDays + "D" : ""}`.trim() || duration;
  })();

  // Auto-generate package name from duration + cities when packageName is empty
  useEffect(() => {
    if (packageName) return;
    const cities = cityNames?.split(",").map(c => c.trim()).filter(Boolean) || [];
    if (cities.length === 0) return;
    const daysMatch = computedDuration.match(/(\d+)\s*D/);
    const totalDays = daysMatch ? daysMatch[1] : null;
    const citySlug = cities.map(c => c.toLowerCase().replace(/\s+/g, "-")).join("-");
    const name = totalDays
      ? `${totalDays}-days-${citySlug}-trip`
      : `${citySlug}-trip`;
    setPackageName(name);
  }, [cityNames, computedDuration]);

  // Auto-fill advance amount to 50% when payablePrice changes and advance is 0
  useEffect(() => {
    if (payablePrice > 0 && advanceAmount === 0) {
      setAdvanceAmount(Math.round(payablePrice * 0.5));
    }
  }, [payablePrice]);

  // --- START PREMIUM WHATSAPP LOGIC ---
  const buildWhatsAppMessage = () => {
    const lines: string[] = [];

    // Header & Personalization
    lines.push(`*TOUR QUOTATION: ${packageName || destination || "Custom Package"}`);
    lines.push(`_Dear ${clientName || "Guest"},_`);
    lines.push("");
    lines.push(`Greetings from ${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}!`);
    lines.push("As per our discussion, we've curated a special itinerary just for you:");
    lines.push("");

    lines.push("*TRIP OVERVIEW:*");
    if (computedDuration) lines.push(`Duration: ${computedDuration}`);
    if (travelDate) lines.push(`Travel Date:  ${travelDate}`);
    const paxInfo = `${adults || 0} Adults${children > 0 ? ` & ${children} Children` : ""}`;
    lines.push(`Pax: ${paxInfo}`);
    lines.push("");

    lines.push("STAY & TRANSPORT DETAILS:");
    const cities = Object.keys(groupedData);
    for (const city of cities) {
      lines.push(`\n*${city.toUpperCase()}*`);
      const cityItems = groupedData[city];
      for (const item of cityItems) {
        let icon = ">";
        if (item.ServiceName === "Hotel") icon = "[Hotel]";
        else if (item.ServiceName === "Car") icon = "[Car]";
        else if (item.ServiceName === "Guide") icon = "[Guide]";

        const name = item.ServiceName === "Hotel" ? item.hotelName : item.ServiceName === "Car" ? item.carName : item.guideName;
        const type = item.ServiceName === "Hotel" ? item.hotelType : item.ServiceName === "Car" ? item.carType : item.guideLanguage;
        const qtyLabel = item.ServiceName === "Hotel" ? "Nights" : "Days";

        lines.push(`  ${icon} *${item.ServiceName}*: ${name || "Standard"}${type ? ` (${type})` : ""} | ${item.ServcieQty} ${qtyLabel}`);
      }
    }
    lines.push("");

    lines.push("PACKAGE COSTING:");
    lines.push(`- Subtotal: ${Number(subtotal).toLocaleString("en-IN")}`);
    lines.push(`- GST (${gstRate}%): ${Number(gstAmount).toLocaleString("en-IN")}`);
    if (discountAmount > 0) {
      lines.push(`- Special Discount: -${Number(discountAmount).toLocaleString("en-IN")}`);
    }
    lines.push(`---------------------------`);
    lines.push(`GRAND TOTAL: ${Number(payablePrice).toLocaleString("en-IN")}`);
    if (advanceAmount > 0) {
      lines.push(`_Booking Amount: ${Number(advanceAmount).toLocaleString("en-IN")}_`);
    }
    lines.push("");

    if (includes.length > 0) {
      lines.push("What's Included:");
      lines.push(includes.slice(0, 5).map(i => `  > ${i}`).join("\n"));
      if (includes.length > 5) lines.push(`  _+ more in the detailed PDF_`);
      lines.push("");
    }

    lines.push("I've attached the detailed PDF link below for the full itinerary & terms.");
    lines.push("");
    lines.push("Looking forward to hosting you! Feel free to call for any changes.");
    lines.push("");
    lines.push(`*${process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}*`);
    lines.push("_Premium Travel Experiences_");

    return lines.join("\n");
  };

  const buildPdfPayload = () => {
    return {
      invoiceNo: quotationNo,
      packageName,
      destination,
      travelDate,
      duration: computedDuration,
      items,
      includes,
      excludes,
      notes,
      cancellationPolicy,
      advanceAmount,
      balanceTerms,
      validTill,
      subtotal,
      gst: gstAmount,
      discount: discountAmount,
      grandTotal: payablePrice,
      itinerary,
      bannerImageUrl: bannerUrls,
      gstRate,
      travellerInfo: lead ? {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        cityNames: lead.requirement?.cityNames,
        startDate: lead.requirement?.startDate,
        endDate: lead.requirement?.endDate,
        adults: lead.requirement?.adults,
        children: lead.requirement?.children,
      } : null,
    };
  };

  const handleWhatsApp = async () => {
    if (!clientPhone) {
      errorToast("No phone number found for this traveller.");
      return;
    }
    if (items.length === 0) {
      errorToast("Please add at least one service before sharing.");
      return;
    }

    setGeneratingPdf(true);
    try {
      const payload = buildPdfPayload();

      const res = await generatePdfUrl(leadId, payload);

      if (!res || !res.url) {
        throw new Error("API did not return a PDF URL");
      }

      const pdfUrl = res.url;
      let message = buildWhatsAppMessage();

      message += `\n\n---------------------------\n*DOWNLOAD FULL QUOTATION PDF:*\n${pdfUrl}`;

      const cleanedPhone = clientPhone.replace(/\D/g, "");
      const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;

      window.open(waUrl, "_blank");
      successToast("PDF generated successfully!");

      if (selectedPackageId) {
        markInvoiceSentMutation.mutate({ id: selectedPackageId, leadId });
      }
    } catch (err: any) {
      // The real error will appear here in the console
      console.error("FULL ERROR DETAILS:", err);
      errorToast("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };
  // --- END PREMIUM WHATSAPP LOGIC ---

  const handlePrint = () => {
    const content = document.getElementById("printable-invoice");
    if (!content) return;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>PACKAGE QUOTATION</title>
          ${styles}
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; padding: 20px; background: white !important; }
            }
            img { max-width: 100% !important; height: auto !important; }
            .prose img { max-width: 100% !important; height: auto !important; border-radius: 8px; }
          </style>
        </head>
        <body class="bg-white">
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const tourPackageProps = {
    items, setItems, newCity, setNewCity, addCity, addService,
    handleChange, removeItem, groupedData, openAccordions, toggleAccordion,
  };

  const inclusionsProps = {
    includes, setIncludes, newInclude, setNewInclude,
  };

  const exclusionsProps = {
    excludes, setExcludes, newExclude, setNewExclude,
  };

  const paymentPolicyProps = {
    advanceAmount, setAdvanceAmount, balanceTerms, setBalanceTerms, notes, setNotes, grandTotal: payablePrice,
  };

  const cancellationPolicyProps = {
    cancellationPolicy, setCancellationPolicy,
  };

  if (activeSection === "tour-package") {
    return <TourPackageSection {...tourPackageProps} />;
  }

  if (activeSection === "invoice") {
    return (
      <InvoiceMainSection
        createNewPackage={createNewPackage}
        handleSave={handleSave}
        isSaving={savePackageMutation.isPending}
        setIsPreviewOpen={setIsPreviewOpen}
        handleSendInvoice={handleSendInvoice}
        isSending={sendInvoiceEmailMutation.isPending}
        selectedPackageId={selectedPackageId}
        clientName={clientName}
        clientEmail={clientEmail}
        clientPhone={clientPhone}
        packageName={packageName}
        setPackageName={setPackageName}
        destination={destination}
        setDestination={setDestination}
        payablePrice={payablePrice}
        advanceAmount={advanceAmount}
        quotationNo={quotationNo}
        setQuotationNo={setQuotationNo}
        generateQuotationNo={generateQuotationNo}
        validTill={validTill}
        setValidTill={setValidTill}
        travelDate={travelDate}
        setTravelDate={setTravelDate}
        duration={computedDuration}
        setDuration={setDuration}
        adults={adults}
        setAdults={setAdults}
        children={children}
        setChildren={setChildren}
        items={items}
        groupedData={groupedData}
        subtotal={subtotal}
        gstRate={gstRate}
        setGstRate={setGstRate}
        gstAmount={gstAmount}
        discount={discount}
        setDiscount={setDiscount}
        bannerUrls={bannerUrls}
        setBannerUrls={setBannerUrls}
        bannerFiles={bannerFiles}
        setBannerFiles={setBannerFiles}
        itinerary={itinerary}
        setItinerary={setItinerary}
        isPreviewOpen={isPreviewOpen}
        includes={includes}
        excludes={excludes}
        notes={notes}
        balanceTerms={balanceTerms}
        packages={packages}
        leadId={leadId}
        handleWhatsApp={handleWhatsApp}
        generatingPdf={generatingPdf}
      />
    );
  }

  if (activeSection === "inclusions") {
    return <InclusionsSection {...inclusionsProps} />;
  }

  if (activeSection === "exclusions") {
    return <ExclusionsSection {...exclusionsProps} />;
  }

  if (activeSection === "payment-policy") {
    return <PaymentPolicySection {...paymentPolicyProps} />;
  }

  if (activeSection === "cancellation-policy") {
    return <CancellationPolicySection {...cancellationPolicyProps} />;
  }

  return (
    <div className="space-y-6 w-full items-start">

      {/* ── 1. TOUR QUOTATION ── */}
      <div className="bg-white rounded-xl border shadow-sm w-full overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="text-white/80" size={20} />
              <div>
                <h2 className="text-white font-bold text-base">Tour Quotation</h2>
                <p className="text-indigo-200 text-xs mt-0.5">
                  {quotationNo && `#${quotationNo}`}
                  {selectedPackageId && ` • Version ${packages.find((inv: any) => inv.id === selectedPackageId)?.version || 1}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={createNewPackage}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors backdrop-blur-sm"
              >
                <Plus size={14} /> New
              </button>
              <button
                onClick={handleSave}
                disabled={savePackageMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-brand-primary hover:bg-brand-primary-light disabled:opacity-50 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                {savePackageMutation.isPending ? <PageLoader size="inline" /> : <Save size={14} />}
                Save Quotation
              </button>
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors backdrop-blur-sm"
              >
                <Eye size={14} /> Preview
              </button>
              <button
                onClick={handleSendInvoice}
                disabled={sendInvoiceEmailMutation.isPending || !selectedPackageId || isEmailSent}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                title="Save package first to send"
              >
                {sendInvoiceEmailMutation.isPending ? <PageLoader size="inline" /> : <Mail size={14} />}
                {isEmailSent ? "Email Sent ✓" : "Send Email"}
              </button>
              <button
                onClick={handleWhatsApp}
                disabled={generatingPdf || isWhatsappSent || !selectedPackageId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generatingPdf ? <PageLoader size="inline" /> : <MessageCircle size={14} />}
                {isWhatsappSent ? "WhatsApp Sent ✓" : "WhatsApp"}
              </button>
              <button
                onClick={() => setIsVendorAssignOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 btn-primary text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Briefcase size={14} /> Assign Vendor
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-brand-neutral-light rounded-lg p-3 border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quotation No.</label>
              <div className="flex items-center gap-1.5">
                <input
                  className="bg-transparent border-none outline-none w-full text-sm font-bold text-brand-neutral-dark p-0"
                  value={quotationNo}
                  onChange={(e) => setQuotationNo(e.target.value)}
                />
                <button
                  onClick={() => setQuotationNo(generateQuotationNo())}
                  className="text-slate-400 hover:text-brand-primary transition-colors shrink-0"
                  title="Regenerate"
                  type="button"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
            <div className="bg-brand-neutral-light rounded-lg p-3 border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valid Till</label>
              <input type="date" className="bg-transparent border-none outline-none w-full text-sm font-semibold text-brand-neutral p-0" value={validTill} onChange={(e) => setValidTill(e.target.value)} />
            </div>
            <div className="bg-brand-primary-light rounded-lg p-3 border border-indigo-100">
              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Package Name</label>
              <input className="bg-transparent border-none outline-none w-full text-sm font-bold text-indigo-800 p-0" placeholder="e.g. Golden Triangle Tour" value={packageName} onChange={(e) => setPackageName(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TRAVELLER INFORMATION ── */}
      {lead?.requirement && (
        <div className="bg-white p-6 rounded-xl border shadow-sm w-full">
          <h2 className="text-lg font-bold flex items-center gap-2 text-brand-neutral-dark mb-4 border-b pb-3">
            <Users size={18} className="text-brand-primary" /> Traveller Information
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {lead.name && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light rounded-l-lg">Name</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">{lead.name}</td>
                  </tr>
                )}
                {lead.email && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light">Email</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">{lead.email}</td>
                  </tr>
                )}
                {lead.phone && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light">Phone</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">{lead.phone}</td>
                  </tr>
                )}
                {lead.requirement?.cityNames && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light">Destination</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">{lead.requirement?.cityNames}</td>
                  </tr>
                )}
                {lead.requirement?.serviceType && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light">Service Type</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">{lead.requirement?.serviceType}</td>
                  </tr>
                )}
                {lead.requirement?.tourTypes?.length > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light">Tour Types</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">
                      <div className="flex flex-wrap gap-1.5">
                        {lead.requirement?.tourTypes.map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-brand-primary-light text-brand-primary text-xs font-semibold rounded-full">{t}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {(lead.requirement?.startDate || lead.requirement?.endDate) && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light">Travel Dates</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">
                      {lead.requirement?.startDate && new Date(lead.requirement?.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {lead.requirement?.startDate && lead.requirement?.endDate && " → "}
                      {lead.requirement?.endDate && new Date(lead.requirement?.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                )}
                {(lead.requirement?.adults > 0 || lead.requirement?.children > 0) && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light">Travellers</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">
                      {lead.requirement?.adults > 0 && `${lead.requirement?.adults} Adult${lead.requirement?.adults > 1 ? "s" : ""}`}
                      {lead.requirement?.adults > 0 && lead.requirement?.children > 0 && ", "}
                      {lead.requirement?.children > 0 && `${lead.requirement?.children} Child${lead.requirement?.children > 1 ? "ren" : ""}`}
                    </td>
                  </tr>
                )}
                {lead.requirement?.budget > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light">Budget</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark font-semibold">₹{lead.requirement?.budget.toLocaleString("en-IN")}</td>
                  </tr>
                )}
                {(lead.requirement?.needGuide) && (
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-brand-neutral-muted w-1/3 bg-brand-neutral-light rounded-b-lg">Extra Services</td>
                    <td className="py-2.5 px-4 text-brand-neutral-dark">
                      <div className="flex gap-2">
                        {lead.requirement?.needGuide && <span className="px-2 py-0.5 bg-brand-success-light text-brand-success text-xs font-semibold rounded-full">Guide Required</span>}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 3. BANNER IMAGE ── */}
      <div className="bg-white p-6 rounded-xl border shadow-sm w-full">
        <h3 className="font-bold text-brand-neutral mb-3 flex items-center gap-2 text-sm">
          <ImageIcon size={16} className="text-brand-primary" /> Banner Images
        </h3>
        <BannerImageUpload
          value={bannerUrls}
          onChange={setBannerUrls}
          onFilesSelect={setBannerFiles}
          maxImages={15}
        />
      </div>

      {/* ── 4. DAY-TO-DAY ITINERARY ── */}
      <div className="bg-white p-6 rounded-xl border shadow-sm w-full">
        <h3 className="font-bold text-brand-neutral mb-3 flex items-center gap-2 text-sm">
          <History size={16} className="text-brand-primary" /> Day-by-Day Itinerary
        </h3>
        <DayItineraryEditor value={itinerary} onChange={setItinerary} />
      </div>

      {/* ── 5. INVOICE SECTION ── */}
      <div className="bg-white rounded-xl border shadow-sm w-full overflow-hidden">
        <div className="bg-teal-700 px-5 py-3">
          <h3 className="text-white font-bold text-base tracking-wide flex items-center gap-2">Invoice</h3>
        </div>
        <div className="p-6">
          <TourPackageSection {...tourPackageProps} />

          {items.length > 0 && (
            <div className="mt-6 border-t border-brand-neutral-border pt-5">
              <h4 className="font-bold text-brand-neutral mb-4 flex items-center gap-2 text-sm">
                <Hash size={16} className="text-brand-primary" /> Cost Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-end gap-4 items-center">
                  <span className="text-brand-neutral text-sm">Subtotal:</span>
                  <span className="font-semibold text-brand-neutral-dark w-28 text-base">₹{subtotal}</span>
                </div>
                <div className="flex justify-end items-center gap-4">
                  <span className="text-brand-neutral text-sm">GST Rate (%)</span>
                  <input
                    type="number"
                    className="w-16 border p-1 rounded text-center text-sm bg-white focus:ring-1 focus:ring-brand-primary"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                  />
                  <span className="w-28 font-semibold text-brand-neutral-dark text-base">: ₹{gstAmount}</span>
                </div>
                <div className="flex justify-end items-center gap-4">
                  <span className="text-brand-neutral text-sm">Discount (₹)</span>
                  <input
                    type="number"
                    className="w-28 border p-1.5 rounded text-right text-sm bg-white focus:ring-1 focus:ring-brand-primary font-semibold text-brand-danger"
                    value={discount === 0 ? "" : discount}
                    placeholder="0"
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
                <div className="border-t pt-3 flex justify-end gap-4 items-center">
                  <span className="text-base font-bold text-brand-neutral-dark">Payable Price:</span>
                  <span className="text-lg font-extrabold text-brand-primary w-28">₹{payablePrice}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PaymentPolicySection {...paymentPolicyProps} />
      <InclusionsSection {...inclusionsProps} />
      <ExclusionsSection {...exclusionsProps} />
      <CancellationPolicySection {...cancellationPolicyProps} />

      {/* ── PACKAGE HISTORY ── */}
      <div className="bg-white p-5 rounded-xl border shadow-sm w-full">
        <h3 className="text-base font-bold text-brand-neutral-dark mb-4 flex items-center gap-2 border-b pb-3">
          <History className="text-indigo-500" size={18} /> Package History
          <span className="text-xs bg-slate-100 text-brand-neutral px-2 py-0.5 rounded-full font-bold ml-auto">
            {packages.length}
          </span>
        </h3>

        {isLoadingPackages ? (
          <PageLoader size="sm" />
        ) : packages.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-brand-neutral-light/50 rounded-lg border border-dashed">
            <p className="text-xs font-semibold">No past packages saved</p>
          </div>
        ) : (
          <div className="space-y-5">
            {packages.map((inv: any) => {
              const isActive = selectedPackageId === inv.id;

              return (
                <div
                  key={inv.id}
                  className={`rounded-xl border transition-all overflow-hidden ${isActive
                    ? "border-indigo-600 ring-1 ring-brand-primary"
                    : "border-brand-neutral-border"
                    }`}
                >
                  <div
                    onClick={() => loadInvoice(inv)}
                    className={`flex flex-wrap items-center justify-between gap-3 p-4 cursor-pointer hover:bg-brand-neutral-light transition-colors ${isActive ? "bg-brand-primary-light/40" : "bg-brand-neutral-light/50"}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-brand-neutral">Version #{inv.version}</span>
                      {inv.packageName && (
                        <span className="text-xs text-brand-neutral-muted font-medium">— {inv.packageName}</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded bg-indigo-100 text-brand-primary">
                        {inv.status || "SAVED"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(inv.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-primary">₹{inv.grandTotal}</span>
                      {isActive && (
                        <span className="text-[10px] bg-brand-primary text-white px-2 py-0.5 rounded font-bold">EDITING</span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingHistoryPackage(inv);
                          }}
                          className="p-1.5 rounded-md text-indigo-500 hover:bg-brand-primary-light hover:text-brand-primary transition-colors"
                          title="View Invoice Details"
                        >
                          <Eye size={15} />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePackage(inv.id);
                            }}
                            disabled={deletePackageBuilderMutation.isPending}
                            className="p-1.5 rounded-md text-brand-danger hover:bg-brand-danger-light hover:text-brand-danger transition-colors disabled:opacity-50"
                            title="Delete Invoice"
                          >
                            {deletePackageBuilderMutation.isPending ? <PageLoader size="inline" /> : <Trash size={15} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReusableModel
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        contentClassName="max-w-5xl sm:max-w-5xl md:max-w-6xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:max-w-none print:shadow-none p-8"
      >
        <DialogTitle className="sr-only">Package Quotation Preview</DialogTitle>

        <div className="flex justify-end gap-2 mb-6 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 btn-primary text-white rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            Print / PDF
          </button>
        </div>

        <div id="printable-invoice" className="print:block bg-white p-6 md:p-8" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
          {/* Header Row: Brand Logo & Quote Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 mb-5 border-b-2 border-teal-600 gap-4">
            <div>
              <img
                src="/logo-with-name.png"
                alt="Flag Journeys"
                className="h-14 w-auto object-contain mb-2"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {packageName || "LUXURY TOUR PACKAGE"}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {destination && (
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded">
                    📍 {destination}
                  </span>
                )}
                {computedDuration && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                    ⏱️ {computedDuration}
                  </span>
                )}
                {(adults > 0 || children > 0) && (
                  <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded">
                    👥 {adults} Adults{children > 0 ? `, ${children} Children` : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="inline-block bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded mb-1.5">
                OFFICIAL QUOTATION
              </span>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                {(process.env.NEXT_PUBLIC_BRAND_NAME || "FLAG JOURNEYS").toUpperCase()}
              </h2>
              <div className="text-xs text-slate-500 space-y-0.5 mt-1 font-medium">
                {quotationNo && <p className="font-mono text-slate-700 font-bold">Quote #{quotationNo}</p>}
                <p>Date: {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                {validTill && (
                  <p className="text-teal-600 font-semibold">Valid Till: {new Date(validTill).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                )}
              </div>
            </div>
          </div>

          {/* Traveller Info Bar - Clean Inline Strip (No Outer Box) */}
          {(clientName || clientEmail || clientPhone || travelDate) && (
            <div className="py-3.5 mb-6 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {clientName && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Prepared For</span>
                  <span className="font-bold text-slate-900 text-sm">{clientName}</span>
                </div>
              )}
              {clientPhone && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Phone / WhatsApp</span>
                  <span className="font-semibold text-slate-800">{clientPhone}</span>
                </div>
              )}
              {clientEmail && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Email</span>
                  <span className="font-semibold text-slate-800">{clientEmail}</span>
                </div>
              )}
              {travelDate && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Travel Date</span>
                  <span className="font-bold text-teal-700">{travelDate}</span>
                </div>
              )}
            </div>
          )}

          {bannerUrls.length > 0 && (
            <div className={`mb-6 ${bannerUrls.length === 1 ? "" : "grid grid-cols-2 gap-3"}`}>
              {bannerUrls.map((url, i) => (
                <div key={i} className="rounded-xl border border-brand-neutral-border overflow-hidden">
                  <img src={url} alt={`Banner ${i + 1}`} className="w-full h-auto" />
                </div>
              ))}
            </div>
          )}

          {Array.isArray(itinerary) && itinerary.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <History size={16} /> Day-by-Day Itinerary
              </h3>
              <div className="space-y-4">
                {itinerary.map((day, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {day.day || idx + 1}
                      </div>
                      {idx < itinerary.length - 1 && <div className="w-0.5 flex-1 bg-teal-100 mt-1" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900">{day.title || `Day ${idx + 1}`}</h4>
                      {day.content && (
                        <div className="mt-1 text-sm text-brand-neutral prose prose-sm max-w-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg" dangerouslySetInnerHTML={{ __html: day.content }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="border-b-2 border-teal-600 pb-2 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Services & Pricing Breakdown
              </h3>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No items added yet.</p>
            )}

            {items.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-3 py-2.5 w-24">City</th>
                      <th className="px-3 py-2.5 w-24">Service</th>
                      <th className="px-3 py-2.5">Name</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5 text-center w-20">Qty</th>
                      <th className="px-3 py-2.5 text-right w-28">Unit ₹</th>
                      <th className="px-3 py-2.5 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.map((item, idx) => {
                      const getName = () => {
                        if (item.ServiceName === "Hotel") return item.hotelName || "—";
                        if (item.ServiceName === "Car") return item.carName || "—";
                        if (item.ServiceName === "Guide") return item.guideName || "—";
                        return "—";
                      };
                      const getType = () => {
                        if (item.ServiceName === "Hotel") return item.hotelType || "—";
                        if (item.ServiceName === "Car") return item.carType || "—";
                        if (item.ServiceName === "Guide") return item.guideLanguage || "—";
                        return "—";
                      };
                      const getQtyLabel = () => item.ServiceName === "Hotel" ? "Nights" : "Days";
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-slate-900">{item.location}</td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${item.ServiceName === "Hotel" ? "bg-teal-50 text-teal-700 border border-teal-100" :
                              item.ServiceName === "Car" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>{item.ServiceName}</span>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-900">{getName()}</td>
                          <td className="px-3 py-2.5 text-slate-600">{getType()}</td>
                          <td className="px-3 py-2.5 text-center text-slate-600">{item.ServcieQty || 0} {getQtyLabel()}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">₹{Number(item.UnitPrice || 0).toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900">₹{Number(item.TotalPrice || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2">
              <div className="space-y-2 max-w-xs ml-auto text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>GST ({gstRate}%):</span>
                  <span className="font-semibold text-slate-800">₹{gstAmount}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount:</span>
                    <span className="font-semibold">- ₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-sm font-black text-slate-900">
                  <span>Total Cost:</span>
                  <span className="text-teal-700">₹{payablePrice}</span>
                </div>
                {advanceAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-bold mt-1">
                    <span>Advance Required:</span>
                    <span>₹{advanceAmount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(includes.length > 0 || excludes.length > 0) && (
            <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-brand-neutral-border">
              {includes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-brand-success uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> What&apos;s Included
                  </h3>
                  <ul className="space-y-1.5 text-sm text-brand-neutral">
                    {includes.map((inc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">&#10004;</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {excludes.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-brand-danger uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <XCircle size={14} /> What&apos;s Excluded
                  </h3>
                  <ul className="space-y-1.5 text-sm text-brand-neutral">
                    {excludes.map((exc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-brand-danger mt-0.5">&#10008;</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {notes && (
            <div className="mt-6 pt-6 border-t border-brand-neutral-border">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Important Notes</h3>
              <ul className="space-y-1 text-sm text-brand-neutral">
                {notes.split("\n").filter(Boolean).map((line, idx) => {
                  const cleanLine = line.replace(/^[•\-\*\s]+/, "").trim();
                  if (!cleanLine) return null;
                  return <li key={idx}>&#8226; {cleanLine}</li>;
                })}
              </ul>
            </div>
          )}

          {(advanceAmount > 0 || balanceTerms) && (
            <div className="mt-6 pt-6 border-t border-brand-neutral-border">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Terms</h3>
              <div className="text-sm text-brand-neutral space-y-1">
                {advanceAmount > 0 && <p>Advance: ₹{advanceAmount}</p>}
                <p>Balance: {balanceTerms || "Before Arrival"}</p>
              </div>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-brand-neutral-border text-center">
            <p className="text-sm font-bold text-brand-neutral">Thank You for Choosing {process.env.NEXT_PUBLIC_BRAND_NAME || "Flag Journeys"}</p>
            <p className="text-xs text-slate-400 mt-1">Premium Travel Experiences</p>
          </div>
        </div>
      </ReusableModel>

      {/* Package History View Model */}
      <ReusableModel
        open={!!viewingHistoryPackage}
        onOpenChange={(open: boolean) => !open && setViewingHistoryPackage(null)}
        contentClassName="max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6"
        title={`Package Version #${viewingHistoryPackage?.version}`}
      >
        {viewingHistoryPackage && (() => {
          const invGrouped = (viewingHistoryPackage.items || []).reduce((acc: any, itm: any) => {
            if (!acc[itm.location]) acc[itm.location] = [];
            acc[itm.location].push(itm);
            return acc;
          }, {});
          const invSubtotal = (viewingHistoryPackage.items || []).reduce((s: number, itm: any) => s + (itm.TotalPrice || 0), 0);
          const invIncludes: string[] = viewingHistoryPackage.includes || [];
          const invExcludes: string[] = viewingHistoryPackage.excludes || [];
          const invNotes: string = viewingHistoryPackage.notes || "";

          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-brand-neutral-light p-3 rounded-lg border border-slate-100">
                <div>
                  {viewingHistoryPackage.quotationNo && (
                    <p className="text-xs font-bold text-brand-neutral">Quotation No: {viewingHistoryPackage.quotationNo}</p>
                  )}
                  <p className="text-xs text-brand-neutral-muted">Date: {new Date(viewingHistoryPackage.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs font-bold text-brand-neutral mt-0.5">Status: {viewingHistoryPackage.status || "SAVED"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-brand-primary">₹{viewingHistoryPackage.grandTotal}</p>
                </div>
              </div>

              {(viewingHistoryPackage.packageName || viewingHistoryPackage.destination || viewingHistoryPackage.duration || viewingHistoryPackage.travelDate) && (
                <div className="grid grid-cols-2 gap-2 bg-brand-neutral-light/50 border border-slate-100 rounded-lg p-3 text-xs">
                  {viewingHistoryPackage.packageName && (
                    <div><span className="text-slate-400">Package:</span> <span className="font-semibold text-brand-neutral">{viewingHistoryPackage.packageName}</span></div>
                  )}
                  {viewingHistoryPackage.destination && (
                    <div><span className="text-slate-400">Destination:</span> <span className="font-semibold text-brand-neutral">{viewingHistoryPackage.destination}</span></div>
                  )}
                  {viewingHistoryPackage.duration && (
                    <div><span className="text-slate-400">Duration:</span> <span className="font-semibold text-brand-neutral">{viewingHistoryPackage.duration}</span></div>
                  )}
                  {viewingHistoryPackage.travelDate && (
                    <div><span className="text-slate-400">Travel Date:</span> <span className="font-semibold text-brand-neutral">{new Date(viewingHistoryPackage.travelDate).toLocaleDateString()}</span></div>
                  )}
                  {(viewingHistoryPackage.adults || viewingHistoryPackage.children) && (
                    <div><span className="text-slate-400">Pax:</span> <span className="font-semibold text-brand-neutral">{viewingHistoryPackage.adults || 0} Adults, {viewingHistoryPackage.children || 0} Children</span></div>
                  )}
                </div>
              )}

              {Object.entries(invGrouped).map(([loc, locItems]: [string, any]) => (
                <div key={loc} className="border border-slate-100 rounded-lg p-3 bg-brand-neutral-light/30">
                  <h4 className="text-xs font-bold text-brand-primary mb-2 flex items-center gap-1.5">
                    <MapPin size={13} /> {loc}
                  </h4>
                  <table className="tbl">
                    <thead>
                      <tr className="bg-brand-neutral-light border-b border-brand-neutral-border">
                        <th className="tbl-th-sm">Service</th>
                        <th className="tbl-th-sm">Details</th>
                        <th className="tbl-th-sm text-right">Unit Price</th>
                        <th className="tbl-th-sm text-right">Qty</th>
                        <th className="tbl-th-sm text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-neutral-light">
                      {locItems.map((itm: any, idx: number) => {
                        let details = "";
                        if (itm.ServiceName === "Hotel" && itm.hotelName) {
                          details = `${itm.hotelName}${itm.hotelType ? " (" + itm.hotelType + ")" : ""}`;
                        } else if (itm.ServiceName === "Car" && itm.carName) {
                          details = `${itm.carName}${itm.carOwnerName ? " - Owner: " + itm.carOwnerName : ""}${itm.carType ? " (" + itm.carType + ")" : ""}`;
                        } else if (itm.ServiceName === "Guide" && itm.guideName) {
                          details = `${itm.guideName}${itm.guideLanguage ? " (" + itm.guideLanguage + ")" : ""}`;
                        }

                        return (
                          <tr key={idx} className="hover:bg-brand-neutral-light/50 transition-colors">
                            <td className="py-1.5 text-brand-neutral font-medium">
                              {itm.ServiceName}
                            </td>
                            <td className="py-1.5 text-brand-neutral-muted text-[10px]">
                              {details || "---"}
                            </td>
                            <td className="py-1.5 text-right text-brand-neutral-muted">₹{itm.UnitPrice}</td>
                            <td className="py-1.5 text-right text-brand-neutral-muted">
                              {itm.ServcieQty}
                              <span className="text-[9px] text-slate-400 ml-0.5">
                                {itm.ServiceName === "Hotel" ? "/night" : "/day"}
                              </span>
                            </td>
                            <td className="py-1.5 text-right font-semibold text-brand-neutral">₹{itm.TotalPrice}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

              <div className="text-right space-y-1 text-xs pt-4 border-t border-slate-100">
                <div className="flex justify-end gap-3 text-brand-neutral-muted">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-brand-neutral w-20">₹{viewingHistoryPackage.subtotal || invSubtotal}</span>
                </div>
                <div className="flex justify-end gap-3 text-brand-neutral-muted">
                  <span>GST:</span>
                  <span className="font-semibold text-brand-neutral w-20">₹{viewingHistoryPackage.gst || 0}</span>
                </div>
                {Number(viewingHistoryPackage.discount || 0) > 0 && (
                  <div className="flex justify-end gap-3 text-brand-danger">
                    <span>Discount:</span>
                    <span className="font-semibold w-20">- ₹{viewingHistoryPackage.discount}</span>
                  </div>
                )}
                <div className="flex justify-end gap-3 text-sm font-bold text-brand-neutral-dark border-t border-brand-neutral-border pt-1.5">
                  <span>Grand Total:</span>
                  <span className="text-brand-primary w-20">₹{viewingHistoryPackage.grandTotal}</span>
                </div>
              </div>

              {(invIncludes.length > 0 || invExcludes.length > 0) && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  {invIncludes.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-brand-success uppercase mb-1">Includes</h4>
                      <ul className="text-xs text-brand-neutral space-y-0.5">
                        {invIncludes.map((inc: string, idx: number) => <li key={idx}>&#10004; {inc}</li>)}
                      </ul>
                    </div>
                  )}
                  {invExcludes.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold text-brand-danger uppercase mb-1">Excludes</h4>
                      <ul className="text-xs text-brand-neutral space-y-0.5">
                        {invExcludes.map((exc: string, idx: number) => <li key={idx}>&#10008; {exc}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {invNotes && (
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-brand-neutral-muted uppercase mb-1">Notes</h4>
                  <ul className="text-xs text-brand-neutral space-y-0.5">
                    {invNotes.split("\n").filter(Boolean).map((line, idx) => <li key={idx}>&#8226; {line}</li>)}
                  </ul>
                </div>
              )}

              {(viewingHistoryPackage.advanceAmount > 0 || viewingHistoryPackage.balanceTerms) && (
                <div className="pt-3 border-t border-slate-100 text-xs text-brand-neutral space-y-0.5">
                  <h4 className="text-[11px] font-bold text-brand-neutral-muted uppercase mb-1">Payment Terms</h4>
                  {viewingHistoryPackage.advanceAmount > 0 && <p>Advance: ₹{viewingHistoryPackage.advanceAmount}</p>}
                  <p>Balance: {viewingHistoryPackage.balanceTerms || "Before Arrival"}</p>
                </div>
              )}
            </div>
          );
        })()}
      </ReusableModel>

      {isVendorAssignOpen && lead && (
        <VendorAssignmentModal
          leadId={Number(leadId)}
          lead={lead}
          onClose={() => setIsVendorAssignOpen(false)}
        />
      )}

    </div>
  );
}