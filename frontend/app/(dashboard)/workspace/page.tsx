"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  getProjects,
  createProject,
  uploadImage,
} from "@/services/api";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Palette,
  Type,
  Move,
  Crop,
  Settings,
  Image as ImageIcon,
  Sliders,
  Hash,
  FolderPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Layers,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Lock,
  Check,
  RotateCcw,
  MousePointer2,
  Wand2,
  PenTool,
  Circle,
  Paintbrush,
  Pencil,
  Eraser,
  RotateCw,
  Maximize2,
  Pipette,
  Hand,
  Search,
} from "lucide-react";
import Script from "next/script";
import JSZip from "jszip";
import { plans } from "@/lib/plans";
import { getFileFromIndexedDB } from "@/lib/db";

interface TextOverlay {
  id: string;
  text: string;
  bgColor: string;
  textColor: string;
  fontSize: number;
  x: number;
  y: number;
}

type AspectRatioType = "original" | "1:1" | "9:16" | "16:9" | "custom";
type ExportFormatType = "image/png" | "image/jpeg" | "image/webp";
type ExportQualityType = "original" | "2k" | "4k";
type BgType = "color" | "image";

interface WorkspaceImage {
  id: string;
  name: string;
  originalUrl: string;
  processedUrl: string | null;
  loading: boolean;
  imageElementLoaded?: boolean;
  error: string;
  
  bgType: BgType;
  bgColor: string;
  bgImage: string | null;
  shadowColor: string;
  shadowOpacity: number;
  shadowBlur: number;
  shadowX: number;
  shadowY: number;
  overlays: TextOverlay[];
  exportRatio: AspectRatioType;
  customCanvasWidth: number;
  customCanvasHeight: number;
  exportFormat: ExportFormatType;
  exportQuality: ExportQualityType;
}

const hexToRgba = (hex: string, opacity: number) => {
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const fallbackCollections = [
  { id: "1", name: "Summer Collection 2026" },
  { id: "2", name: "Indoor Plants Catalog" },
  { id: "3", name: "Kitchen Essentials" },
];

export default function WorkspacePage() {
  const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  // Collections state
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [collectionSearch, setCollectionSearch] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Accordion toggles
  const [shadowOpen, setShadowOpen] = useState<boolean>(false);
  const [badgesOpen, setBadgesOpen] = useState<boolean>(false);

  // Auto-disable batch mode if only 1 image left
  useEffect(() => {
    if (workspaceImages.length <= 1) {
      setIsBatchMode(false);
      setSelectedBatchIds([]);
    }
  }, [workspaceImages.length]);

  // Dropdown select popover states
  const [openDropdown, setOpenDropdown] = useState<"ratio" | "bg" | "density" | "format" | "collection" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom tool select & Undo states
  const [activeInspectorTab, setActiveInspectorTab] = useState<"batch" | "format" | "backdrop" | "badges" | "shadow" | "publish">("format");
  const [expandedOverlayId, setExpandedOverlayId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Record<string, WorkspaceImage[]>>({});
  // Local string states so custom canvas W/H fields can be cleared (empty) while typing
  const [customWidthStr, setCustomWidthStr] = useState<string>("");
  const [customHeightStr, setCustomHeightStr] = useState<string>("");

  const pushToUndoStack = () => {
    if (!activeImage) return;
    setUndoStack((prev) => {
      const currentStack = prev[activeImage.id] || [];
      return {
        ...prev,
        [activeImage.id]: [...currentStack.slice(-19), JSON.parse(JSON.stringify(activeImage))]
      };
    });
  };

  const handleUndo = () => {
    if (!activeImageId) return;
    const currentStack = undoStack[activeImageId] || [];
    if (currentStack.length === 0) return;
    
    const previousState = currentStack[currentStack.length - 1];
    setUndoStack((prev) => ({
      ...prev,
      [activeImageId]: currentStack.slice(0, -1)
    }));
    
    setWorkspaceImages((prev) =>
      prev.map((img) => (img.id === previousState.id ? previousState : img))
    );
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const [compareOriginal, setCompareOriginal] = useState<boolean>(false);

  // Auth, Pricing & Payment States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Default true to prevent layout flash before check
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{ plan: string; paymentId: string } | null>(null);
  const [razorpayReady, setRazorpayReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      if (window.Razorpay) {
        setRazorpayReady(true);
      }
    }
  }, []);

  const handleCheckout = async (planName: string) => {
    if (planName === "Starter") {
      setShowPricingModal(false);
      return;
    }

    if (!razorpayReady) {
      alert("Payment gateway is loading. Please try again in a moment.");
      return;
    }

    setPayingPlan(planName);

    try {
      // 1. Create Razorpay order from backend
      const res = await fetch("http://localhost:8000/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName, billing: billingCycle }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const orderData = await res.json();

      // 2. Open Razorpay Checkout popup
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DigiScale Product Studio",
        description: `${planName} Plan — ${billingCycle === "yearly" ? "Annual" : "Monthly"} Subscription`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          // 3. Verify payment signature on backend
          try {
            const verifyRes = await fetch("http://localhost:8000/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planName,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              // Mock auth token to instantly unlock workspace features
              localStorage.setItem("token", "unlocked-premium-trial-" + response.razorpay_payment_id);
              setIsLoggedIn(true);
              setPaymentSuccess({ plan: planName, paymentId: response.razorpay_payment_id });
              setShowPricingModal(false);
            } else {
              alert("Payment verification failed. Contact support.");
            }
          } catch {
            alert("Verification error. Contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: () => setPayingPlan(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setPayingPlan(null);
        alert("Payment failed. Please try again.");
      });
      rzp.open();
      setPayingPlan(null);
    } catch (err) {
      setPayingPlan(null);
      alert("Could not initiate payment. Make sure the backend server is running.");
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasUploadRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const dragItemRef = useRef<{ id: string; startX: number; startY: number; startPercentX: number; startPercentY: number } | null>(null);

  // Fetch collections on page load
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const { data, error } = await supabase.from('collections').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        if (data && data.length > 0) {
          setCollections(data);
          setSelectedCollectionId(data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to fetch collections from Supabase:", err);
      }
    };
    fetchCollections();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const loggedInState = !!token;
      setIsLoggedIn(loggedInState);

      // Load persisted free images if guest/free user
      if (!loggedInState) {
        const savedFreeImgs = localStorage.getItem("digiscale_free_workspace_images");
        if (savedFreeImgs) {
          const parsed = JSON.parse(savedFreeImgs);
          setWorkspaceImages(parsed);
          if (parsed.length > 0) {
            setActiveImageId(parsed[0].id);
          }
        }
      }

      // Check for pending local file from home page redirect
      const pendingFile = localStorage.getItem("digiscale_workspace_pending_file");
      if (pendingFile === "true") {
        localStorage.removeItem("digiscale_workspace_pending_file");
        getFileFromIndexedDB().then((file) => {
          if (file) {
            uploadAndProcessFile(file);
          }
        });
      }
    }
  }, []);

  // Sync free images to localStorage whenever workspaceImages state changes
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoggedIn) {
      localStorage.setItem("digiscale_free_workspace_images", JSON.stringify(workspaceImages));
    }
  }, [workspaceImages, isLoggedIn]);

  useEffect(() => {
    setCompareOriginal(false);
  }, [activeImageId]);

  const uploadAndProcessFile = (file: File) => {
    const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    
    const newImg: WorkspaceImage = {
      id: tempId,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      loading: true,
      imageElementLoaded: false,
      error: "",
      bgType: "color",
      bgColor: "#ffffff",
      bgImage: null,
      shadowColor: "#000000",
      shadowOpacity: 0.2,
      shadowBlur: 20,
      shadowX: 0,
      shadowY: 10,
      overlays: [],
      exportRatio: "1:1",
      customCanvasWidth: 500,
      customCanvasHeight: 500,
      exportFormat: "image/png",
      exportQuality: "original",
    };

    setWorkspaceImages((prev) => {
      const updated = [...prev, newImg];
      if (prev.length === 0) {
        setActiveImageId(tempId);
      }
      return updated;
    });

    uploadImage(file)
      .then((res) => {
        setWorkspaceImages((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  loading: false,
                  imageElementLoaded: true,
                  processedUrl: `http://localhost:8000/${res.processedImage}`,
                }
              : item
          )
        );
      })
      .catch((err) => {
        setWorkspaceImages((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  loading: false,
                  error: err.message || "Failed to remove background.",
                }
              : item
          )
        );
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!isLoggedIn && workspaceImages.length >= 3) {
      setShowPricingModal(true);
      return;
    }

    Array.from(files).forEach((file) => {
      uploadAndProcessFile(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (canvasUploadRef.current) canvasUploadRef.current.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setWorkspaceImages((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (activeImageId === id) {
        setActiveImageId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const activeImage = workspaceImages.find((img) => img.id === activeImageId);

  const updateActiveImage = (fields: Partial<WorkspaceImage>) => {
    if (!activeImageId) return;
    setWorkspaceImages((prev) =>
      prev.map((img) => (img.id === activeImageId ? { ...img, ...fields } : img))
    );
  };

  const exportQualityLabels: Record<ExportQualityType, string> = {
    original: "Original",
    "2k": "2K HD",
    "4k": "4K HD"
  };

  const exportFormatLabels: Record<ExportFormatType, string> = {
    "image/png": "PNG (.png)",
    "image/jpeg": "JPEG (.jpg)",
    "image/webp": "WEBP (.webp)"
  };

  const bgPresets = [
    { name: "White Canvas", value: "#ffffff" },
    { name: "Transparent", value: "transparent" },
    { name: "Light Grey", value: "#f8fafc" },
    { name: "Studio Grey", value: "#cbd5e1" },
    { name: "Sky Blue", value: "#e0f2fe" },
    { name: "Mint Green", value: "#dcfce7" },
  ];

  const badgePresets = [
    { name: "Red", value: "#f43f5e" },
    { name: "Yellow", value: "#eab308" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#22c55e" },
    { name: "Dark", value: "#1e293b" },
  ];

  const aspectRatios = [
    { id: "original", label: "Original Ratio" },
    { id: "1:1", label: "Instagram Post (1:1)" },
    { id: "9:16", label: "Instagram Story (9:16)" },
  ];

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!activeImage) return;
    pushToUndoStack();
    const overlay = activeImage.overlays.find((o) => o.id === id);
    if (!overlay || !previewContainerRef.current) return;

    dragItemRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      startPercentX: overlay.x,
      startPercentY: overlay.y,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragItemRef.current || !previewContainerRef.current || !activeImage) return;

    const { id, startX, startY, startPercentX, startPercentY } = dragItemRef.current;
    const rect = previewContainerRef.current.getBoundingClientRect();
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const percentDeltaX = (deltaX / rect.width) * 100;
    const percentDeltaY = (deltaY / rect.height) * 100;

    let newX = Math.max(0, Math.min(90, startPercentX + percentDeltaX));
    let newY = Math.max(0, Math.min(95, startPercentY + percentDeltaY));

    updateActiveImage({
      overlays: activeImage.overlays.map((o) => (o.id === id ? { ...o, x: newX, y: newY } : o)),
    });
  };

  const handleMouseUp = () => {
    dragItemRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const addOverlay = () => {
    if (!activeImage) return;
    pushToUndoStack();
    const newId = Date.now().toString();
    const newOverlay: TextOverlay = {
      id: newId,
      text: "NEW\nLABEL",
      bgColor: "#f43f5e",
      textColor: "#ffffff",
      fontSize: 18,
      x: 20,
      y: 20,
    };
    updateActiveImage({ overlays: [...activeImage.overlays, newOverlay] });
    setExpandedOverlayId(newId);
  };

  const updateOverlay = (id: string, fields: Partial<TextOverlay>) => {
    if (!activeImage) return;
    updateActiveImage({
      overlays: activeImage.overlays.map((o) => (o.id === id ? { ...o, ...fields } : o)),
    });
  };

  const removeOverlay = (id: string) => {
    if (!activeImage) return;
    pushToUndoStack();
    updateActiveImage({ overlays: activeImage.overlays.filter((o) => o.id !== id) });
  };

  const getAspectRatioStyle = () => {
    if (!activeImage) return "w-[500px] h-[500px]";
    switch (activeImage.exportRatio) {
      case "1:1":
        return "w-[520px] h-[520px]";
      case "9:16":
        return "w-[310px] h-[550px]";
      case "16:9":
        return "w-[640px] h-[360px]";
      case "custom": {
        const w = activeImage.customCanvasWidth || 500;
        const h = activeImage.customCanvasHeight || 500;
        const maxDim = 560;
        const scale = Math.min(maxDim / w, maxDim / h, 1);
        return `w-[${Math.round(w * scale)}px] h-[${Math.round(h * scale)}px]`;
      }
      default:
        return "w-[520px] h-[520px]";
    }
  };

  const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImage) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        updateActiveImage({
          bgImage: event.target.result as string,
          bgType: "image",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Assembles composite layout in an HTML canvas object
  const buildCompositeCanvas = (
    img: HTMLImageElement,
    callback: (canvas: HTMLCanvasElement) => void,
    targetImageOverride?: WorkspaceImage
  ) => {
    const targetImage = targetImageOverride || activeImage;
    if (!targetImage) return;

    let originalWidth = img.naturalWidth;
    let originalHeight = img.naturalHeight;

    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (targetImage.exportRatio === "1:1") {
      const size = Math.max(originalWidth, originalHeight);
      targetWidth = size;
      targetHeight = size;
    } else if (targetImage.exportRatio === "9:16") {
      targetWidth = originalHeight * (9 / 16);
      targetHeight = originalHeight;
    } else if (targetImage.exportRatio === "16:9") {
      targetWidth = originalWidth;
      targetHeight = originalWidth * (9 / 16);
    }

    if (targetImage.exportQuality === "2k") {
      const maxSide = 2048;
      if (targetWidth > targetHeight) {
        targetHeight = (targetHeight / targetWidth) * maxSide;
        targetWidth = maxSide;
      } else {
        targetWidth = (targetWidth / targetHeight) * maxSide;
        targetHeight = maxSide;
      }
    } else if (targetImage.exportQuality === "4k") {
      const maxSide = 3840;
      if (targetWidth > targetHeight) {
        targetHeight = (targetHeight / targetWidth) * maxSide;
        targetWidth = maxSide;
      } else {
        targetWidth = (targetWidth / targetHeight) * maxSide;
        targetHeight = maxSide;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(targetWidth);
    canvas.height = Math.round(targetHeight);
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawAllLayers = (bgImgLoaded: HTMLImageElement | null = null) => {
      if (targetImage.bgType === "image" && bgImgLoaded) {
        ctx.drawImage(bgImgLoaded, 0, 0, canvas.width, canvas.height);
      } else if (targetImage.bgColor !== "transparent") {
        ctx.fillStyle = targetImage.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (targetImage.exportFormat === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      const scale = Math.min(canvas.width / originalWidth, canvas.height / originalHeight) * 0.8;
      const drawWidth = originalWidth * scale;
      const drawHeight = originalHeight * scale;
      const drawX = (canvas.width - drawWidth) / 2;
      const drawY = (canvas.height - drawHeight) / 2;

      ctx.save();
      const exportScaleFactor = canvas.width / 500;
      ctx.shadowColor = hexToRgba(targetImage.shadowColor, targetImage.shadowOpacity);
      ctx.shadowBlur = targetImage.shadowBlur * exportScaleFactor;
      ctx.shadowOffsetX = targetImage.shadowX * exportScaleFactor;
      ctx.shadowOffsetY = targetImage.shadowY * exportScaleFactor;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      const scaleFactor = canvas.width / 500;

      targetImage.overlays.forEach((overlay) => {
        if (!overlay.text.trim()) return;

        const overlayFontSize = Math.round((overlay.fontSize || 18) * scaleFactor);
        const overlayLineHeight = overlayFontSize + 6 * scaleFactor;
        ctx.font = `bold ${overlayFontSize}px system-ui, -apple-system, sans-serif`;

        const lines = overlay.text.split("\n");

        let maxLineWidth = 0;
        lines.forEach((line) => {
          const width = ctx.measureText(line).width;
          if (width > maxLineWidth) maxLineWidth = width;
        });

        const paddingX = 16 * scaleFactor;
        const paddingY = 10 * scaleFactor;
        const badgeWidth = maxLineWidth + paddingX * 2;
        const badgeHeight = (lines.length * overlayLineHeight) + paddingY * 2 - (overlayLineHeight - overlayFontSize);

        const x = (overlay.x / 100) * canvas.width;
        const y = (overlay.y / 100) * canvas.height;

        if (overlay.bgColor !== "transparent") {
          ctx.fillStyle = overlay.bgColor;
          const radius = 10 * scaleFactor;
          ctx.beginPath();
          ctx.roundRect(x, y, badgeWidth, badgeHeight, radius);
          ctx.fill();
        }

        ctx.fillStyle = overlay.textColor || "#ffffff";
        ctx.textBaseline = "top";
        lines.forEach((line, index) => {
          ctx.fillText(line, x + paddingX, y + paddingY + (index * overlayLineHeight));
        });
      });

      callback(canvas);
    };

    if (targetImage.bgType === "image" && targetImage.bgImage) {
      const bgImg = new window.Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = targetImage.bgImage;
      bgImg.onload = () => {
        drawAllLayers(bgImg);
      };
      bgImg.onerror = () => {
        drawAllLayers(null);
      };
    } else {
      drawAllLayers(null);
    }
  };

  const saveCompositeToCollection = () => {
    if (!activeImage || !activeImage.processedUrl || !selectedCollectionId) return;
    setSaving(true);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = activeImage.processedUrl;

    img.onload = () => {
      buildCompositeCanvas(img, async (canvas) => {
        const dataUrl = canvas.toDataURL(activeImage.exportFormat, 0.95);

        try {
          const newProductId = 'AST-' + Math.random().toString(36).substr(2, 6).toUpperCase();
          
          const { error } = await supabase.from('products').insert([{
            id: newProductId,
            name: (activeImage.name.split(".")[0] || "Edited Image") + ' (Edited)',
            photoUrl: dataUrl,
            collection_id: selectedCollectionId
          }]);
          
          if (error) throw error;
          
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err: any) {
          console.error("Failed to save composite to Supabase:", err);
          alert("Failed to save to collection.");
        } finally {
          setSaving(false);
        }
      });
    };

    img.onerror = () => {
      alert("Failed to load processed image for saving.");
      setSaving(false);
    };
  };

  const handleBatchApplySettings = () => {
    if (!activeImageId) return;
    const active = workspaceImages.find(img => img.id === activeImageId);
    if (!active) return;

    setWorkspaceImages(prev => prev.map(img => {
      if (selectedBatchIds.includes(img.id) && img.id !== activeImageId) {
        return {
          ...img,
          bgType: active.bgType,
          bgColor: active.bgColor,
          bgImage: active.bgImage,
          shadowColor: active.shadowColor,
          shadowOpacity: active.shadowOpacity,
          shadowBlur: active.shadowBlur,
          shadowX: active.shadowX,
          shadowY: active.shadowY,
          overlays: JSON.parse(JSON.stringify(active.overlays)),
          exportRatio: active.exportRatio,
          exportFormat: active.exportFormat,
          exportQuality: active.exportQuality
        };
      }
      return img;
    }));
    
    alert(`Successfully applied active canvas configuration to ${selectedBatchIds.length - (selectedBatchIds.includes(activeImageId) ? 1 : 0)} selected assets.`);
  };

  const handleBatchDelete = () => {
    setWorkspaceImages(prev => prev.filter(img => !selectedBatchIds.includes(img.id)));
    setSelectedBatchIds([]);
    setIsBatchMode(false);
  };

  const handleBatchExport = async () => {
    setExporting(true);
    const zip = new JSZip();
    let filesAdded = 0;

    for (const id of selectedBatchIds) {
      const imgItem = workspaceImages.find(img => img.id === id);
      if (!imgItem || !imgItem.processedUrl) continue;
      
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = imgItem.processedUrl!;
        img.onload = () => {
          buildCompositeCanvas(img, (canvas) => {
            const ext = imgItem.exportFormat === "image/jpeg" ? "jpg" : imgItem.exportFormat === "image/webp" ? "webp" : "png";
            const filename = `${imgItem.name.split(".")[0]}_${imgItem.exportQuality}_${Date.now()}.${ext}`;
            
            // Get base64 data from canvas
            const dataUrl = canvas.toDataURL(imgItem.exportFormat, 0.95);
            const base64Data = dataUrl.split(",")[1];
            
            // Add file to ZIP
            zip.file(filename, base64Data, { base64: true });
            filesAdded++;
            resolve();
          }, imgItem);
        };
        img.onerror = () => {
          resolve();
        };
      });
    }

    if (filesAdded > 0) {
      try {
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.download = `digiscale_batch_${Date.now()}.zip`;
        link.href = URL.createObjectURL(content);
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (err) {
        alert("Failed to generate ZIP archive.");
        console.error(err);
      }
    } else {
      alert("No processed files were ready for batch export.");
    }
    
    setExporting(false);
  };

  const handleBatchSaveToCollection = async () => {
    if (!selectedCollectionId) {
      alert("Please select a collection in the inspector panel to save to.");
      return;
    }
    setSaving(true);
    let successCount = 0;
    
    for (const id of selectedBatchIds) {
      const imgItem = workspaceImages.find(img => img.id === id);
      if (!imgItem || !imgItem.processedUrl) continue;

      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = imgItem.processedUrl!;
        img.onload = () => {
          buildCompositeCanvas(img, (canvas) => {
            const dataUrl = canvas.toDataURL(imgItem.exportFormat, 0.95);
            
            if (typeof window !== "undefined" && selectedCollectionId) {
              const cacheKey = `digiscale_images_${selectedCollectionId}`;
              const existing = localStorage.getItem(cacheKey);
              const currentList = existing ? JSON.parse(existing) : [];
              const localImg = {
                id: Date.now() + Math.random(),
                processed_path: dataUrl,
                status: "completed",
                created_at: new Date().toISOString()
              };
              localStorage.setItem(cacheKey, JSON.stringify([localImg, ...currentList]));
              
              const cachedCols = localStorage.getItem("digiscale_collections");
              if (cachedCols) {
                const cols = JSON.parse(cachedCols);
                const updatedCols = cols.map((c: any) => 
                  c.id.toString() === selectedCollectionId.toString()
                    ? { ...c, images: (Array.isArray(c.images) ? c.images.length : (c.images || 0)) + 1 }
                    : c
                );
                localStorage.setItem("digiscale_collections", JSON.stringify(updatedCols));
              }
            }

            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  const ext = imgItem.exportFormat === "image/jpeg" ? "jpg" : "png";
                  const file = new File(
                    [blob], 
                    `${imgItem.name.split(".")[0]}_composite.${ext}`, 
                    { type: imgItem.exportFormat }
                  );
                  await uploadImage(file, parseInt(selectedCollectionId));
                  successCount++;
                } catch (err) {
                  console.warn("Upload failed for batch item, cache saved: ", err);
                  successCount++;
                }
              }
              resolve();
            });
          }, imgItem);
        };
        img.onerror = () => {
          resolve();
        };
      });
    }
    
    setSaving(false);
    alert(`Successfully saved ${successCount} assets to the collection.`);
    setSelectedBatchIds([]);
    setIsBatchMode(false);
  };

  const exportCompositeImage = () => {
    if (!activeImage || !activeImage.processedUrl) return;
    setExporting(true);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = activeImage.processedUrl;

    img.onload = () => {
      buildCompositeCanvas(img, (canvas) => {
        const dataUrl = canvas.toDataURL(activeImage.exportFormat, 0.95);
        const ext = activeImage.exportFormat === "image/jpeg" ? "jpg" : activeImage.exportFormat === "image/webp" ? "webp" : "png";
        const link = document.createElement("a");
        link.download = `${activeImage.name.split(".")[0]}_${activeImage.exportQuality}_${Date.now()}.${ext}`;
        link.href = dataUrl;
        link.click();
        setExporting(false);
      });
    };

    img.onerror = () => {
      alert("Failed to load processed image for export.");
      setExporting(false);
    };
  };

  // Determine if active image is fully ready to display
  const showProcessedImage = activeImage && activeImage.processedUrl;
  const isImageProcessing = activeImage && activeImage.loading;

  return (
    <div className="h-full w-full flex bg-slate-50/60 select-none overflow-hidden">
      
      {/* Main Workspace Split View (No header breadcrumb) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Assets Panel (Width 340px) */}
        <div className="w-[340px] border-r border-slate-200 bg-white p-5 flex flex-col justify-between shrink-0 z-10">
          <div className="space-y-5 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  Product Assets
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload multiple files and edit in parallel.</p>
              </div>
            </div>

            {/* Assets List */}
            {workspaceImages.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {workspaceImages.map((item) => {
                  const isActive = item.id === activeImageId;
                  const isItemProcessing = item.loading || (item.processedUrl && !item.imageElementLoaded);
                  const isChecked = selectedBatchIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveImageId(item.id)}
                      className={`group relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isActive
                          ? "border-blue-600 bg-blue-50/20"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg border border-slate-200/60 overflow-hidden shrink-0 bg-slate-50/50">
                        <img
                          src={item.originalUrl}
                          alt="Thumb"
                          className="w-full h-full object-cover"
                        />
                        {isItemProcessing && (
                          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <p className={`text-xs font-bold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                          {item.name}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 block mt-0.5 uppercase tracking-wider">
                          {isItemProcessing ? (
                            <span className="text-blue-650 flex items-center gap-1">
                              <Loader2 className="h-2.5 w-2.5 animate-spin" /> processing
                            </span>
                          ) : item.error ? (
                            <span className="text-red-500">Failed</span>
                          ) : (
                            <span className="text-green-600">Ready to edit</span>
                          )}
                        </span>
                      </div>

                      {!isItemProcessing && (
                        <div className="shrink-0 mr-0.5">
                          {item.error ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-50" />
                          )}
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(item.id);
                        }}
                        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-slate-850 hover:bg-red-555 text-white transition shadow opacity-0 group-hover:opacity-100"
                        style={{ opacity: isActive ? 1 : undefined }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                <ImageIcon className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs">No active assets loaded.</p>
              </div>
            )}
          </div>




          <div className="border-t border-slate-100 pt-5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3.5 text-xs font-bold shadow-sm transition active:scale-[0.98]"
            >
              <Upload className="h-4 w-4" />
              Upload Product Files
            </button>
          </div>
        </div>



        {/* Center Canvas Stage (No scroll, large fitting) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative select-none">
          <input
            type="file"
            ref={canvasUploadRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            className="hidden"
          />



          {/* Main canvas viewing area */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-hidden relative">

          {/* Floating Canvas Header Controls */}
          {activeImage && (
            <div className="absolute top-5 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
              {/* Document details (Left) */}
              <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-sm text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none pointer-events-auto">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Active Artboard</span>
              </div>

              {/* Floating Undo/Controls (Right) */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={handleUndo}
                  disabled={!(activeImageId && (undoStack[activeImageId]?.length || 0) > 0)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer select-none shadow-sm ${
                    (activeImageId && (undoStack[activeImageId]?.length || 0) > 0)
                      ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 active:scale-95"
                      : "border-slate-100 bg-slate-50/50 text-slate-350 pointer-events-none"
                  }`}
                  title="Undo last workspace modification"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Undo Edit</span>
                </button>
              </div>
            </div>
          )}

          {activeImage ? (
            <div className="relative flex flex-col items-center justify-center max-w-full max-h-full">
              
              {/* Artboard Frame */}
              <div
                ref={previewContainerRef}
                className="relative border border-slate-250 bg-white transition-all duration-300 flex items-center justify-center select-none shrink-0"
                style={{
                  width: getAspectRatioStyle().split(" ")[0].replace("w-[", "").replace("]", ""),
                  height: getAspectRatioStyle().split(" ")[1].replace("h-[", "").replace("]", ""),
                  backgroundColor: compareOriginal
                    ? "#ffffff"
                    : activeImage.bgType === "color" && activeImage.bgColor !== "transparent"
                    ? activeImage.bgColor
                    : "#ffffff",
                  backgroundImage: activeImage.bgType === "color" && activeImage.bgColor === "transparent"
                    ? "conic-gradient(#cbd5e1 25%, transparent 0 50%, #cbd5e1 0 75%, transparent 0)"
                    : activeImage.bgType === "image" && activeImage.bgImage
                    ? `url(${activeImage.bgImage})`
                    : "none",
                  backgroundSize: activeImage.bgType === "color" && activeImage.bgColor === "transparent"
                    ? "12px 12px"
                    : "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Generate clipping path loading state */}
                {isImageProcessing ? (
                  <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                    <p className="text-blue-650 font-bold text-xs animate-pulse">
                      Generating clipping path...
                    </p>
                  </div>
                ) : activeImage.error ? (
                  <div className="text-center p-6 text-red-500 space-y-2 z-10">
                    <AlertCircle className="h-8 w-8 mx-auto" />
                    <p className="text-xs font-bold">{activeImage.error}</p>
                  </div>
                ) : activeImage.processedUrl ? (
                  <div className="relative h-full w-full flex items-center justify-center p-6 select-none animate-in fade-in duration-300">
                    
                    {compareOriginal ? (
                      <img
                        key={`orig-${activeImage.id}`}
                        src={activeImage.originalUrl}
                        alt="Original Compare"
                        className="max-h-[80%] max-w-[80%] object-contain pointer-events-none"
                      />
                    ) : (
                      <>
                        <img
                          key={`proc-${activeImage.id}`}
                          src={activeImage.processedUrl}
                          alt="Canvas Subject"
                          className="max-h-[80%] max-w-[80%] object-contain pointer-events-none will-change-transform"
                          style={{
                            filter: `drop-shadow(${activeImage.shadowX}px ${activeImage.shadowY}px ${activeImage.shadowBlur}px ${hexToRgba(
                              activeImage.shadowColor,
                              activeImage.shadowOpacity
                            )})`,
                            transform: "translate3d(0,0,0)",
                          }}
                        />

                        {activeImage.overlays.map((overlay) => (
                          <div
                            key={overlay.id}
                            onMouseDown={(e) => handleMouseDown(e, overlay.id)}
                            className={`absolute z-10 font-bold px-4 py-2.5 rounded-xl text-center cursor-move select-none flex items-center gap-1.5 active:scale-95 transition-transform ${overlay.bgColor !== 'transparent' ? 'shadow-lg border border-white/20' : ''}`}
                            style={{
                              backgroundColor: overlay.bgColor === "transparent" ? "transparent" : overlay.bgColor,
                              color: overlay.textColor || "#ffffff",
                              fontSize: `${overlay.fontSize || 18}px`,
                              left: `${overlay.x}%`,
                              top: `${overlay.y}%`,
                              whiteSpace: "pre-line",
                              textAlign: "left",
                            }}
                          >
                            <Move className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
                            <div>{overlay.text}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Press and Hold Compare Reference Layer Tab */}
              <button
                onMouseDown={() => setCompareOriginal(true)}
                onMouseUp={() => setCompareOriginal(false)}
                onMouseLeave={() => setCompareOriginal(false)}
                onTouchStart={() => setCompareOriginal(true)}
                onTouchEnd={() => setCompareOriginal(false)}
                className={`mt-4 flex items-center gap-2 border px-4 py-2 rounded-xl text-[11px] font-bold select-none cursor-pointer transition ${
                  compareOriginal
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <img
                  src={activeImage.originalUrl}
                  className="w-5 h-5 rounded border object-cover"
                />
                <span className="flex items-center gap-1.5">
                  {compareOriginal ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Viewing Original Photo...
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Hold to view Original Photo
                    </>
                  )}
                </span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => canvasUploadRef.current?.click()}
              className="w-[520px] h-[520px] bg-white border border-dashed border-slate-300 hover:border-slate-450 cursor-pointer flex flex-col items-center justify-center text-center p-8 transition shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-2xl"
            >
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Document Active</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                Click or drop files inside this workspace to import assets.
              </p>
            </div>
          )}
          </div> {/* End main canvas viewing area */}
        </div>

        {/* Right Sidebar: Properties Panel */}
        {activeImage ? (
          <div ref={dropdownRef} className="w-[450px] flex shrink-0 border-l border-slate-200 bg-white z-10 overflow-hidden">
            {/* Inspector Content Area */}
            <div className="flex-1 flex flex-col justify-between p-5 overflow-hidden text-slate-800 border-r border-slate-100/60">
                <div className="pb-1 shrink-0">
                  <p className="text-[10px] text-slate-400 font-bold truncate">
                    {activeInspectorTab === "batch" 
                      ? `Batch Editing: ${selectedBatchIds.length} file(s) selected` 
                      : `Editing: ${activeImage.name}`}
                  </p>
                </div>

              <div className="space-y-4 flex-1 flex flex-col overflow-y-auto pr-1 relative custom-scrollbar">
                  {/* 0. Batch Mode Tab */}
                  {activeInspectorTab === "batch" && (
                    <div className="space-y-4 shrink-0 animate-in fade-in duration-100 py-2">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 pointer-events-none mb-3">
                        <Layers className="h-4 w-4 text-slate-800" />
                        Batch Operations
                      </label>
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                            {selectedBatchIds.length} Selected
                          </span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedBatchIds(workspaceImages.map(img => img.id))} className="text-[11px] font-bold text-blue-600 hover:underline">Select All</button>
                            <button onClick={() => setSelectedBatchIds([])} className="text-[11px] font-bold text-slate-400 hover:underline">Clear</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 pb-1">
                          {workspaceImages.map((item) => {
                            const isChecked = selectedBatchIds.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setSelectedBatchIds(selectedBatchIds.filter(id => id !== item.id));
                                  } else {
                                    setSelectedBatchIds([...selectedBatchIds, item.id]);
                                  }
                                  setActiveImageId(item.id);
                                }}
                                className={`relative shrink-0 aspect-square rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                                  isChecked ? "border-blue-500 shadow-md shadow-blue-200" : "border-slate-200 hover:border-slate-400"
                                }`}
                              >
                                {item.processedUrl ? (
                                  <img src={item.processedUrl} alt={item.name} className="w-full h-full object-contain bg-slate-50" />
                                ) : item.originalUrl ? (
                                  <img src={item.originalUrl} alt={item.name} className="w-full h-full object-contain bg-slate-50" />
                                ) : (
                                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-slate-300" />
                                  </div>
                                )}
                                {isChecked && (
                                  <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                                {item.loading && (
                                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {selectedBatchIds.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              onClick={handleBatchApplySettings}
                              disabled={!activeImageId}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition active:scale-95 disabled:opacity-50"
                            >
                              🪄 Apply Design
                            </button>
                            <button
                              onClick={handleBatchExport}
                              disabled={exporting}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition active:scale-95 disabled:opacity-50"
                            >
                              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              Export
                            </button>
                            <button
                              onClick={handleBatchSaveToCollection}
                              disabled={saving || !selectedCollectionId}
                              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-2.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50 shadow shadow-blue-500/20"
                            >
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />}
                              Save
                            </button>
                            <button
                              onClick={handleBatchDelete}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 px-3 py-2.5 text-xs font-bold text-red-600 transition active:scale-95"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

              {/* Tab Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* 1. Canvas Format Tab */}
                {activeInspectorTab === "format" && (
                  <div className="space-y-2 shrink-0 animate-in fade-in duration-100 py-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pointer-events-none mb-3">
                      <Crop className="h-3.5 w-3.5 text-blue-655" />
                      Canvas Size
                    </label>
                    <div className="flex flex-col gap-2">

                      {/* ── Custom Canvas (FIRST, always expanded) ── */}
                      <div className={`rounded-xl border transition-all ${
                        activeImage.exportRatio === "custom"
                          ? "border-blue-200 bg-blue-50/60"
                          : "border-slate-200 bg-white"
                      }`}>
                        <button
                          onClick={() => {
                            pushToUndoStack();
                            updateActiveImage({ exportRatio: "custom" });
                            setCustomWidthStr(String(activeImage.customCanvasWidth || 500));
                            setCustomHeightStr(String(activeImage.customCanvasHeight || 500));
                          }}
                          className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-all flex items-center justify-between rounded-xl ${
                            activeImage.exportRatio === "custom"
                              ? "text-blue-700"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <span>Custom Canvas Size</span>
                          {activeImage.exportRatio === "custom"
                            ? <Check className="h-3.5 w-3.5 text-blue-600" />
                            : <span className="text-[9px] text-slate-400 font-bold">CUSTOM</span>
                          }
                        </button>

                        {/* Always show W×H inputs — active when selected */}
                        <div className={`px-3 pb-3 space-y-2.5 ${activeImage.exportRatio !== "custom" ? "opacity-40 pointer-events-none" : ""}`}>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Width (px)</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={String(activeImage.customCanvasWidth || 500)}
                                value={customWidthStr}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "");
                                  setCustomWidthStr(raw);
                                  if (raw && parseInt(raw) >= 10) {
                                    updateActiveImage({ customCanvasWidth: parseInt(raw) });
                                  }
                                }}
                                onBlur={() => {
                                  if (!customWidthStr || parseInt(customWidthStr) < 10) {
                                    setCustomWidthStr(String(activeImage.customCanvasWidth || 500));
                                  }
                                }}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Height (px)</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder={String(activeImage.customCanvasHeight || 500)}
                                value={customHeightStr}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "");
                                  setCustomHeightStr(raw);
                                  if (raw && parseInt(raw) >= 10) {
                                    updateActiveImage({ customCanvasHeight: parseInt(raw) });
                                  }
                                }}
                                onBlur={() => {
                                  if (!customHeightStr || parseInt(customHeightStr) < 10) {
                                    setCustomHeightStr(String(activeImage.customCanvasHeight || 500));
                                  }
                                }}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono font-bold"
                              />
                            </div>
                          </div>
                          {activeImage.exportRatio === "custom" && (activeImage.customCanvasWidth || activeImage.customCanvasHeight) ? (
                            <p className="text-[9px] text-slate-400 font-mono">
                              {activeImage.customCanvasWidth || 500} × {activeImage.customCanvasHeight || 500} px
                              &nbsp;·&nbsp;
                              ratio {((activeImage.customCanvasWidth || 500) / (activeImage.customCanvasHeight || 500)).toFixed(2)}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-2 py-0.5">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">or preset</span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>

                      {/* Standard presets */}
                      {aspectRatios.map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => {
                            pushToUndoStack();
                            updateActiveImage({ exportRatio: ratio.id as AspectRatioType });
                          }}
                          className={`w-full text-left rounded-xl px-3 py-2.5 text-xs font-bold transition-all flex items-center justify-between border ${
                            activeImage.exportRatio === ratio.id
                              ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span>{ratio.label}</span>
                          {activeImage.exportRatio === ratio.id && <Check className="h-3.5 w-3.5 text-blue-650" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Background Canvas Tab */}
                {activeInspectorTab === "backdrop" && (
                  <div className="space-y-5 shrink-0 animate-in fade-in duration-100 py-2">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 pointer-events-none mb-4">
                      <Palette className="h-4 w-4 text-slate-800" />
                      Background Canvas
                    </label>

                    <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
                      <button
                        onClick={() => {
                          pushToUndoStack();
                          updateActiveImage({ bgType: "color" });
                        }}
                        className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                          activeImage.bgType === "color"
                            ? "bg-white text-slate-600 shadow-sm border border-slate-200/40"
                            : "text-slate-450 hover:text-slate-600 hover:bg-slate-200/40"
                        }`}
                      >
                        <Palette className="h-3.5 w-3.5 opacity-70" />
                        Solid Color
                      </button>
                      <button
                        onClick={() => {
                          pushToUndoStack();
                          updateActiveImage({ bgType: "image" });
                        }}
                        className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-1.5 ${
                          activeImage.bgType === "image"
                            ? "bg-white text-slate-600 shadow-sm border border-slate-200/40"
                            : "text-slate-450 hover:text-slate-600 hover:bg-slate-200/40"
                        }`}
                      >
                        <ImageIcon className="h-3.5 w-3.5 opacity-70" />
                        Custom Image
                      </button>
                    </div>

                    {activeImage.bgType === "color" ? (
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-2">
                          {bgPresets.map((preset) => (
                            <button
                              key={preset.value}
                              onClick={() => {
                                pushToUndoStack();
                                updateActiveImage({ bgColor: preset.value });
                              }}
                              className={`rounded-xl py-2.5 px-3 text-[11px] font-bold border transition-all flex items-center justify-start gap-2.5 ${
                                activeImage.bgColor === preset.value
                                  ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                                  : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600"
                              }`}
                            >
                              <span
                                className="h-4 w-4 rounded-full border border-slate-200 shrink-0"
                                style={{
                                  backgroundColor: preset.value === "transparent" ? "#ffffff" : preset.value,
                                  backgroundImage: preset.value === "transparent" 
                                    ? "conic-gradient(#cbd5e1 25%, transparent 0 50%, #cbd5e1 0 75%, transparent 0)"
                                    : "none",
                                  backgroundSize: "4px 4px"
                                }}
                              />
                              {preset.name}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200/60 mt-4">
                          <span className="text-[10px] text-slate-800 font-black uppercase tracking-wider flex items-center gap-1">
                            <Hash className="h-4 w-4 text-slate-400" />
                            Background Color
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={activeImage.bgColor === "transparent" ? "#ffffff" : activeImage.bgColor}
                              onFocus={pushToUndoStack}
                              onChange={(e) => updateActiveImage({ bgColor: e.target.value })}
                              placeholder="#ffffff"
                              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none font-mono text-center font-bold focus:border-blue-400 shadow-sm"
                            />
                            <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                              <input
                                type="color"
                                value={activeImage.bgColor === "transparent" ? "#ffffff" : activeImage.bgColor}
                                onMouseDown={pushToUndoStack}
                                onChange={(e) => updateActiveImage({ bgColor: e.target.value })}
                                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer bg-transparent border-0 p-0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5">
                        <input
                          type="file"
                          ref={bgImageInputRef}
                          onChange={handleBgImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          onClick={() => bgImageInputRef.current?.click()}
                          className="w-full py-4 px-4 rounded-2xl border border-dashed border-blue-200 hover:border-blue-400 bg-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_12px_rgba(37,99,235,0.04)]"
                        >
                          <Upload className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-bold text-blue-600">Upload Background Image</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Text Badges Tab */}
                {activeInspectorTab === "badges" && (
                  <div className="flex flex-col gap-3 shrink-0 animate-in fade-in duration-100 py-1">
                    {/* Header + Add button row */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[13px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 pointer-events-none">
                        <Type className="h-4 w-4 text-slate-500" />
                        Text Badges
                      </label>
                      <button
                        onClick={addOverlay}
                        className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-[12px] font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition active:scale-95 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Badge
                      </button>
                    </div>

                    {activeImage.overlays.length > 0 ? (
                      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                        {activeImage.overlays.map((overlay, index) => {
                          const isExpanded = expandedOverlayId === overlay.id;
                          return (
                            <div
                              key={overlay.id}
                              className={`rounded-2xl border transition-all ${
                                isExpanded ? "border-blue-200 shadow-sm" : "border-slate-200 hover:border-blue-100"
                              }`}
                            >
                              {/* Header */}
                              <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 rounded-2xl"
                                onClick={() => setExpandedOverlayId(isExpanded ? null : overlay.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">#{index + 1}</span>
                                  <span className="text-sm font-black text-slate-700 truncate max-w-[140px] uppercase">
                                    {overlay.text || "NEW LABEL"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedOverlayId(isExpanded ? null : overlay.id);
                                    }}
                                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                                  >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeOverlay(overlay.id);
                                    }}
                                    className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition text-slate-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded controls */}
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1">
                                  <div className="space-y-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                                    {/* Text textarea */}
                                    <textarea
                                      rows={2}
                                      value={overlay.text}
                                      onFocus={pushToUndoStack}
                                      onChange={(e) => updateOverlay(overlay.id, { text: e.target.value })}
                                      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 font-bold outline-none focus:border-blue-400 shadow-sm resize-none uppercase tracking-wide leading-relaxed"
                                      placeholder="NEW LABEL"
                                    />

                                    {/* Font Size & Color together */}
                                    <div className="grid grid-cols-2 gap-4">
                                      {/* Text Color */}
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                          <span>Color</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={overlay.textColor}
                                            onFocus={pushToUndoStack}
                                            onChange={(e) => updateOverlay(overlay.id, { textColor: e.target.value })}
                                            placeholder="#ffffff"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none font-mono text-center font-bold focus:border-blue-400 shadow-sm"
                                          />
                                          <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-white">
                                            <input
                                              type="color"
                                              value={overlay.textColor || "#ffffff"}
                                              onMouseDown={pushToUndoStack}
                                              onChange={(e) => updateOverlay(overlay.id, { textColor: e.target.value })}
                                              className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer bg-transparent border-0 p-0"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Font Size */}
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                          <span>Font Size</span>
                                          <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-sm">{overlay.fontSize || 18}</span>
                                        </div>
                                        <input
                                          type="range"
                                          min={8}
                                          max={72}
                                          value={overlay.fontSize || 18}
                                          onMouseDown={pushToUndoStack}
                                          onChange={(e) => updateOverlay(overlay.id, { fontSize: parseInt(e.target.value) })}
                                          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                                        />
                                      </div>
                                    </div>

                                    {/* Position sliders */}
                                    <div className="space-y-4 pt-4 border-t border-slate-200/60">
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                          <span>Position X</span>
                                          <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-sm">{Math.round(overlay.x)}%</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="90"
                                          value={overlay.x}
                                          onMouseDown={pushToUndoStack}
                                          onChange={(e) => updateOverlay(overlay.id, { x: parseFloat(e.target.value) })}
                                          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                                        />
                                      </div>
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                          <span>Position Y</span>
                                          <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-sm">{Math.round(overlay.y)}%</span>
                                        </div>
                                        <input
                                          type="range" min="0" max="95"
                                          value={overlay.y}
                                          onMouseDown={pushToUndoStack}
                                          onChange={(e) => updateOverlay(overlay.id, { y: parseFloat(e.target.value) })}
                                          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 border border-dashed border-slate-200 bg-white rounded-2xl text-center">
                        <Type className="h-6 w-6 text-slate-300 mb-1.5" />
                        <p className="text-[11px] text-slate-400 font-semibold">No badges yet</p>
                        <p className="text-[9px] text-slate-300 mt-0.5">Click Add Badge to start</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Drop Shadow FX Tab */}
                {activeInspectorTab === "shadow" && (
                  <div className="space-y-4 shrink-0 animate-in fade-in duration-100 py-2">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 pointer-events-none mb-5">
                      <Sliders className="h-4 w-4 text-slate-800" />
                      Drop Shadow FX
                    </label>

                    <div className="space-y-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <span>Blur Radius</span>
                          <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-sm">{activeImage.shadowBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={activeImage.shadowBlur}
                          onMouseDown={pushToUndoStack}
                          onChange={(e) => updateActiveImage({ shadowBlur: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <span>Opacity</span>
                          <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-sm">{Math.round(activeImage.shadowOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activeImage.shadowOpacity * 100}
                          onMouseDown={pushToUndoStack}
                          onChange={(e) => updateActiveImage({ shadowOpacity: parseFloat(e.target.value) / 100 })}
                          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            <span>Offset X</span>
                            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-sm">{activeImage.shadowX}</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            value={activeImage.shadowX}
                            onMouseDown={pushToUndoStack}
                            onChange={(e) => updateActiveImage({ shadowX: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            <span>Offset Y</span>
                            <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md shadow-sm">{activeImage.shadowY}</span>
                          </div>
                          <input
                            type="range"
                            min="-40"
                            max="40"
                            value={activeImage.shadowY}
                            onMouseDown={pushToUndoStack}
                            onChange={(e) => updateActiveImage({ shadowY: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-800 font-black uppercase tracking-wider">Shadow Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={activeImage.shadowColor}
                            onFocus={pushToUndoStack}
                            onChange={(e) => updateActiveImage({ shadowColor: e.target.value })}
                            placeholder="#000000"
                            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none font-mono text-center font-bold focus:border-blue-400 shadow-sm"
                          />
                          <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                            <input
                              type="color"
                              value={activeImage.shadowColor}
                              onMouseDown={pushToUndoStack}
                              onChange={(e) => updateActiveImage({ shadowColor: e.target.value })}
                              className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer bg-transparent border-0 p-0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Publish Settings Tab */}
                {activeInspectorTab === "publish" && (
                  <div className="space-y-4 shrink-0 animate-in fade-in duration-100 py-2">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 pointer-events-none mb-2">
                      <FolderPlus className="h-4 w-4 text-slate-800" />
                      Publish Settings
                    </label>

                    <div className="space-y-5">
                      {/* Density Direct Selection */}
                      <div className="space-y-2.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Density</span>
                        <div className="flex gap-2">
                          {Object.entries(exportQualityLabels).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => {
                                pushToUndoStack();
                                updateActiveImage({ exportQuality: key as ExportQualityType });
                              }}
                              className={`flex-1 py-2 text-[10px] font-bold rounded-[10px] transition-all border ${
                                activeImage.exportQuality === key
                                  ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Extension Direct Selection */}
                      <div className="space-y-2.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Extension</span>
                        <div className="flex gap-2">
                          {Object.entries(exportFormatLabels).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => {
                                pushToUndoStack();
                                updateActiveImage({ exportFormat: key as ExportFormatType });
                              }}
                              className={`flex-1 py-2 text-[10px] font-bold rounded-[10px] transition-all border ${
                                activeImage.exportFormat === key
                                  ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Target Collection Selector */}
                      {isLoggedIn && (
                        <div className="space-y-2.5 border-t border-slate-100 pt-4 text-left">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                            Target Collection
                          </label>
                          <div className="space-y-3 mt-1">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search collections..."
                                value={collectionSearch}
                                onChange={(e) => setCollectionSearch(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 shadow-sm"
                              />
                            </div>
                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                              {collections.filter(col => col.name.toLowerCase().includes(collectionSearch.toLowerCase())).length > 0 ? (
                                collections.filter(col => col.name.toLowerCase().includes(collectionSearch.toLowerCase())).map((col) => (
                                  <button
                                    key={col.id}
                                    onClick={() => setSelectedCollectionId(col.id.toString())}
                                    className={`w-full text-left rounded-xl px-3 py-2 text-[11px] font-bold transition border ${
                                      selectedCollectionId.toString() === col.id.toString()
                                        ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm"
                                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    }`}
                                  >
                                    {col.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-4 border border-dashed border-slate-200 rounded-xl text-center">
                                  <p className="text-[10px] text-slate-400 italic">No collections found.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Lock Overlay if guest / not logged in */}
              {!isLoggedIn && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[3.5px] z-20 flex flex-col items-center justify-center p-6 text-center rounded-2xl select-none">
                  <div className="rounded-full bg-blue-50 p-4 text-blue-600 ring-8 ring-blue-50/50 mb-4 animate-pulse">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Studio Editor Locked</h3>
                  <p className="text-[10px] text-slate-500 mt-2 font-semibold max-w-[200px] leading-relaxed">
                    Start your 7-Day Free Trial to unlock Aspect Ratios, AI Backgrounds, Shadows, and Text Badges!
                  </p>
                  <Link
                    href="/signup"
                    className="mt-6 rounded-xl bg-blue-650 hover:bg-blue-750 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/10 transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Start 7-Day Free Trial</span>
                  </Link>
                  <p className="text-[8px] text-slate-400 mt-2 font-medium">No credit card required • 30 credits included</p>
                </div>
              )}
            </div>

            {/* Save to Collection & Export section */}
            <div className="pt-4 border-t border-slate-150/60 bg-white shrink-0 space-y-3">
              {activeImage.processedUrl && !isImageProcessing && (
                <div className="flex flex-col gap-2">
                  {isLoggedIn && (
                    <button
                      onClick={saveCompositeToCollection}
                      disabled={saving || !selectedCollectionId}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${
                        saveSuccess
                          ? "bg-green-600 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : saveSuccess ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <FolderPlus className="h-4 w-4" />
                      )}
                      {saveSuccess ? "Saved to Collection!" : "Save to Collection"}
                    </button>
                  )}

                  <button
                    onClick={exportCompositeImage}
                    disabled={exporting}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 text-xs font-bold transition shadow-md shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {exporting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export Render Layer
                  </button>
                </div>
              )}
            </div>
            </div> {/* End Inspector Content Area */}

            {/* Vertical Tab Menu */}
            <div className="w-[72px] bg-sky-50 flex flex-col items-center py-4 px-1.5 space-y-1.5 overflow-y-auto shrink-0 relative z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.01)] border-l border-sky-100/50">
              {/* 0. Batch Mode */}
              <button
                type="button"
                onClick={() => setActiveInspectorTab("batch")}
                className={`w-full flex flex-col items-center gap-1 py-3 rounded-xl transition-all cursor-pointer ${
                  activeInspectorTab === "batch"
                    ? "bg-white text-blue-650 shadow-sm border border-slate-250/30 font-bold"
                    : "text-slate-450 hover:text-slate-700 hover:bg-slate-100/60 font-semibold"
                }`}
                title="Batch Mode Operations"
              >
                <Layers className="h-4 w-4" />
                <span className="text-[8px] uppercase tracking-wider">Batch</span>
              </button>

              {/* 1. Canvas */}
              <button
                type="button"
                onClick={() => setActiveInspectorTab("format")}
                className={`w-full flex flex-col items-center gap-1 py-3 rounded-xl transition-all cursor-pointer ${
                  activeInspectorTab === "format"
                    ? "bg-white text-blue-650 shadow-sm border border-slate-250/30 font-bold"
                    : "text-slate-450 hover:text-slate-700 hover:bg-slate-100/60 font-semibold"
                }`}
                title="Canvas Aspect Ratio Format"
              >
                <Crop className="h-4 w-4" />
                <span className="text-[8px] uppercase tracking-wider">Canvas</span>
              </button>

              {/* 2. Backdrop */}
              <button
                type="button"
                onClick={() => setActiveInspectorTab("backdrop")}
                className={`w-full flex flex-col items-center gap-1 py-3 rounded-xl transition-all cursor-pointer ${
                  activeInspectorTab === "backdrop"
                    ? "bg-white text-blue-650 shadow-sm border border-slate-250/30 font-bold"
                    : "text-slate-455 hover:text-slate-700 hover:bg-slate-100/60 font-semibold"
                }`}
                title="Canvas Background backdrop"
              >
                <Palette className="h-4 w-4" />
                <span className="text-[8px] uppercase tracking-wider">Backdrop</span>
              </button>

              {/* 3. Badges */}
              <button
                type="button"
                onClick={() => setActiveInspectorTab("badges")}
                className={`w-full flex flex-col items-center gap-1 py-3 rounded-xl transition-all cursor-pointer ${
                  activeInspectorTab === "badges"
                    ? "bg-white text-blue-650 shadow-sm border border-slate-250/30 font-bold"
                    : "text-slate-455 hover:text-slate-700 hover:bg-slate-100/60 font-semibold"
                }`}
                title="Overlays & Text Badges"
              >
                <Type className="h-4 w-4" />
                <span className="text-[8px] uppercase tracking-wider">Badges</span>
              </button>

              {/* 4. Shadows */}
              <button
                type="button"
                onClick={() => setActiveInspectorTab("shadow")}
                className={`w-full flex flex-col items-center gap-1 py-3 rounded-xl transition-all cursor-pointer ${
                  activeInspectorTab === "shadow"
                    ? "bg-white text-blue-650 shadow-sm border border-slate-250/30 font-bold"
                    : "text-slate-455 hover:text-slate-700 hover:bg-slate-100/60 font-semibold"
                }`}
                title="Drop Shadow FX"
              >
                <Sliders className="h-4 w-4" />
                <span className="text-[8px] uppercase tracking-wider">Shadow</span>
              </button>

              {/* 5. Publish */}
              <button
                type="button"
                onClick={() => setActiveInspectorTab("publish")}
                className={`w-full flex flex-col items-center gap-1 py-3 rounded-xl transition-all cursor-pointer ${
                  activeInspectorTab === "publish"
                    ? "bg-white text-blue-650 shadow-sm border border-slate-250/30 font-bold"
                    : "text-slate-455 hover:text-slate-700 hover:bg-slate-100/60 font-semibold"
                }`}
                title="Export & Save Target settings"
              >
                <FolderPlus className="h-4 w-4" />
                <span className="text-[8px] uppercase tracking-wider">Publish</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Pricing checkout modal for premium workspace features */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowPricingModal(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition font-bold"
            >
              ✕ Close
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                Premium Upgrade
              </span>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 leading-tight">
                Unlock <span className="text-blue-600">DigiScale Studio</span>
              </h3>
              <p className="mt-1.5 text-xs font-semibold text-slate-500 max-w-lg mx-auto">
                Get full access to AI background replacements, drop shadows, 4K exports, and custom templates.
              </p>

              {/* Billing Toggle */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingCycle === "yearly"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Yearly</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-extrabold text-emerald-700 uppercase tracking-wide">
                    Save Up to 18%
                  </span>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              {plans
                .filter((p) => p.name !== "Starter")
                .map((plan) => {
                  const displayPrice =
                    billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                  const isLoading = payingPlan === plan.name;

                  return (
                    <div
                      key={plan.name}
                      className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${
                        plan.featured
                          ? "border-2 border-blue-600 bg-gradient-to-b from-blue-50/20 via-white to-white shadow-[0_25px_60px_rgba(37,99,235,0.15)] ring-1 ring-blue-100"
                          : "border border-slate-200/90 bg-white shadow-lg shadow-slate-100/50"
                      }`}
                    >
                      {plan.featured && (
                        <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-[9px] font-black text-white uppercase tracking-widest shadow-sm">
                          RECOMMENDED
                        </span>
                      )}

                      <div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                          {plan.name}
                        </h4>
                        <p className="mt-2 text-[11px] font-medium text-slate-500 leading-relaxed min-h-[32px]">{plan.description}</p>

                        <div className="mt-6 border-b border-slate-100 pb-5 flex flex-col justify-end">
                          {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs line-through text-slate-400 font-bold">₹{plan.monthlyPrice}</span>
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                                Save {plan.discountPercent}%
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl font-black text-slate-950 tracking-tight">
                              ₹{displayPrice}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">/month</span>
                          </div>
                          {billingCycle === "yearly" && (
                            <span className="text-[10px] font-bold text-slate-450 mt-1">
                              Billed annually (₹{displayPrice * 12}/yr)
                            </span>
                          )}
                        </div>

                        <ul className="mt-6 space-y-3.5">
                          {plan.features.slice(0, 4).map((feature) => (
                            <li key={feature} className="flex items-start gap-2.5 text-xs font-semibold text-slate-600 leading-relaxed">
                              <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleCheckout(plan.name)}
                        disabled={isLoading}
                        className={`mt-8 w-full flex justify-center items-center gap-2 rounded-2xl py-4 text-xs font-extrabold tracking-wide transition active:scale-[0.97] disabled:opacity-60 ${
                          plan.featured
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
                            : "border-2 border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            {plan.featured && <Sparkles className="h-3.5 w-3.5" />}
                            <span>{plan.button}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 sm:p-10 flex flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-green-50 p-4 text-green-500 ring-8 ring-green-50/50">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Payment Successful!</h3>
              <p className="text-xs font-semibold text-slate-500">
                Studio workspace upgraded to {paymentSuccess.plan} successfully. All premium features are unlocked.
              </p>
            </div>

            <div className="w-full bg-slate-50 border border-slate-200/50 rounded-2xl p-5 text-left text-xs font-semibold text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment ID:</span>
                <span className="font-bold text-slate-800 text-blue-600 truncate ml-4">{paymentSuccess.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="font-bold text-slate-800">{paymentSuccess.plan}</span>
              </div>
            </div>

            <button
              onClick={() => setPaymentSuccess(null)}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-bold text-white transition active:scale-95 shadow-md"
            >
              Continue Editing →
            </button>
          </div>
        </div>
      )}

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
      />
    </div>
  );
}