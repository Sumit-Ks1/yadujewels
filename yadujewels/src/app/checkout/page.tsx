"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { motion } from "framer-motion";
import { ChevronLeft, CreditCard, Lock, Truck, Shield, Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAddresses } from "@/hooks/useAddresses";
import { formatPrice } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Declare Razorpay on window for TypeScript
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const { formData: savedAddress, isLoading: addressLoading, saveAddress } = useAddresses();

  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });

  const [isPincodeFetching, setIsPincodeFetching] = useState(false);
  const pincodeAbortControllerRef = useRef<AbortController | null>(null);
  const pincodeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Protect checkout route - redirect to auth if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to proceed to checkout");
      router.push("/auth?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  // Auto-fill form with saved address (only once when data loads)
  useEffect(() => {
    if (savedAddress && !addressAutoFilled && !addressLoading) {
      setFormData((prev) => ({
        ...prev,
        fullName: savedAddress.fullName || prev.fullName,
        phone: savedAddress.phone || prev.phone,
        address: savedAddress.address || prev.address,
        city: savedAddress.city || prev.city,
        state: savedAddress.state || prev.state,
        pincode: savedAddress.pincode || prev.pincode,
      }));
      setAddressAutoFilled(true);
    }
  }, [savedAddress, addressAutoFilled, addressLoading]);

  // Update email when user loads
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user, formData.email]);

  /**
   * Fetch city and state from pincode API
   */
  const fetchPincodeDetails = useCallback(async (pincode: string) => {
    // Cancel any ongoing request
    if (pincodeAbortControllerRef.current) {
      pincodeAbortControllerRef.current.abort();
    }

    // Only fetch for valid 6-digit pincodes
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return;
    }

    setIsPincodeFetching(true);
    pincodeAbortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/pincode?pincode=${pincode}`,
        { signal: pincodeAbortControllerRef.current.signal }
      );

      const data = await response.json();

      if (data?.success && data.city && data.state) {
        setFormData((prev) => ({
          ...prev,
          city: data.city || prev.city,
          state: data.state || prev.state,
        }));
      } else if (!data?.success) {
        console.log("[Pincode] Invalid pincode or no data found");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("[Pincode] Fetch error:", error);
      }
    } finally {
      setIsPincodeFetching(false);
    }
  }, []);

  /**
   * Debounced pincode lookup effect
   */
  useEffect(() => {
    // Clear existing debounce timer
    if (pincodeDebounceRef.current) {
      clearTimeout(pincodeDebounceRef.current);
    }

    // Only trigger for 6-digit pincodes
    if (formData.pincode.length === 6 && /^\d{6}$/.test(formData.pincode)) {
      pincodeDebounceRef.current = setTimeout(() => {
        fetchPincodeDetails(formData.pincode);
      }, 500); // 500ms debounce
    }

    return () => {
      if (pincodeDebounceRef.current) {
        clearTimeout(pincodeDebounceRef.current);
      }
    };
  }, [formData.pincode, fetchPincodeDetails]);

  const total = totalAmount;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  /**
   * Save address to database for future checkouts
   */
  const saveAddressToDb = useCallback(async () => {
    try {
      await saveAddress({
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
      });
    } catch (error) {
      console.error("Failed to save address:", error);
      // Don't throw - address saving is not critical to order completion
    }
  }, [formData, saveAddress]);

  /**
   * Validate form before payment
   */
  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (!formData.address.trim()) {
      toast.error("Please enter your address");
      return false;
    }
    if (!formData.city.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    if (!formData.state.trim()) {
      toast.error("Please enter your state");
      return false;
    }
    if (!formData.pincode.trim() || formData.pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit PIN code");
      return false;
    }
    return true;
  };

  /**
   * Handle payment with Razorpay or COD
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to place an order");
      router.push("/auth?redirect=/checkout");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!validateForm()) {
      return;
    }

    // For online payment, check if Razorpay is loaded
    if (paymentMethod === "online" && !razorpayLoaded) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }

    setIsProcessing(true);

    if (paymentMethod === "cod") {
      await handleCODOrder();
    } else {
      await handleOnlinePayment();
    }
  };

  /**
   * Handle Cash on Delivery order
   */
  const handleCODOrder = async () => {
    try {
      const response = await fetch("/api/orders/cod", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_image: item.product.images?.[0] || "",
            quantity: item.quantity,
            price: item.product.price,
          })),
          total_amount: total,
          shipping_address: {
            fullName: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to place order");
      }

      console.log("[Checkout] COD order placed:", data.order_id);

      // Save address for future checkouts (non-blocking)
      saveAddressToDb();

      // Order successful - clear cart and redirect
      clearCart();
      toast.success("Order placed successfully! Pay on delivery.");
      router.push(`/order-success?order_id=${data.order_id}`);
    } catch (error) {
      console.error("[Checkout] COD Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to place order"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle online payment with Razorpay
   */
  const handleOnlinePayment = async () => {
    try {
      // Step 1: Create Razorpay order via our API
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            product_image: item.product.images?.[0] || "",
            quantity: item.quantity,
            price: item.product.price,
          })),
          total_amount: total,
          shipping_address: {
            fullName: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
          notes: formData.notes,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      console.log("[Checkout] Order created:", orderData.order_id);

      // Step 2: Open Razorpay checkout modal
      const options: RazorpayOptions = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "YaduJewels",
        description: "Jewelry Purchase",
        order_id: orderData.razorpay_order_id,
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify payment on server
          await verifyPayment(response, orderData.order_id);
        },
        prefill: {
          name: orderData.prefill.name,
          email: orderData.prefill.email,
          contact: orderData.prefill.contact,
        },
        theme: {
          color: "#B8860B", // Gold theme to match brand
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info("Payment cancelled. Your order has been saved.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("[Checkout] Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate payment"
      );
      setIsProcessing(false);
    }
  };

  /**
   * Verify payment with our server
   */
  const verifyPayment = async (
    response: RazorpayResponse,
    orderId: string
  ) => {
    try {
      console.log("[Checkout] Verifying payment...");

      const verifyResponse = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          order_id: orderId,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed");
      }

      console.log("[Checkout] Payment verified successfully");

      // Save address for future checkouts (non-blocking)
      saveAddressToDb();

      // Payment successful - clear cart and redirect
      clearCart();
      toast.success("Payment successful! Order placed.");
      router.push(`/order-success?order_id=${orderId}`);
    } catch (error) {
      console.error("[Checkout] Verification error:", error);
      toast.error("Payment verification failed. Please contact support.");
      // Don't clear cart - user might need to retry
      // But still redirect to show order status
      router.push(`/order-status?order_id=${orderId}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect handled in useEffect, but show nothing while redirecting
  if (!user) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Redirecting to sign in...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-heading text-2xl font-semibold mb-4">
              Your cart is empty
            </h1>
            <p className="text-muted-foreground mb-6">
              Add some beautiful pieces before checking out
            </p>
            <Button variant="gold" asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Load Razorpay SDK */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        strategy="lazyOnload"
      />

      <div className="pt-20">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <Link
            href="/shop"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Continue Shopping
          </Link>

          <h1 className="font-heading text-3xl font-semibold mb-8">Checkout</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Shipping Information */}
              <div className="lg:col-span-2 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg p-6"
                >
                  <h2 className="font-heading text-xl font-medium mb-6 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Shipping Information
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">PIN Code *</Label>
                      <div className="relative">
                        <Input
                          id="pincode"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="6-digit PIN code"
                          maxLength={6}
                          required
                        />
                        {isPincodeFetching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="House/Flat No., Building, Street, Landmark"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any special instructions for delivery..."
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Payment */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-lg p-6"
                >
                  <h2 className="font-heading text-xl font-medium mb-6 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Method
                  </h2>
                  
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: string) => setPaymentMethod(value as "online" | "cod")}
                    className="space-y-4"
                  >
                    {/* Online Payment Option */}
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        paymentMethod === "online"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentMethod("online")}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="online" id="online" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-5 w-5 text-green-600" />
                            <Label htmlFor="online" className="font-medium cursor-pointer">
                              Pay Online (Razorpay)
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Pay securely using UPI, Credit/Debit Cards, Net Banking, or Wallets.
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-xs bg-background px-2 py-1 rounded border">UPI</span>
                            <span className="text-xs bg-background px-2 py-1 rounded border">Cards</span>
                            <span className="text-xs bg-background px-2 py-1 rounded border">Net Banking</span>
                            <span className="text-xs bg-background px-2 py-1 rounded border">Wallets</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cash on Delivery Option */}
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value="cod" id="cod" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Banknote className="h-5 w-5 text-green-600" />
                            <Label htmlFor="cod" className="font-medium cursor-pointer">
                              Cash on Delivery (COD)
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Pay in cash when your order is delivered. Available for orders up to ₹50,000.
                          </p>
                          {total > 50000 && (
                            <p className="text-sm text-destructive mt-2">
                              COD is not available for orders above ₹50,000. Please use online payment.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </motion.div>
              </div>

              {/* Order Summary */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-lg p-6 sticky top-24"
                >
                  <h2 className="font-heading text-xl font-medium mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex gap-4">
                        <div className="relative h-16 w-16 rounded overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={item.product.images?.[0] || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-1">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                          <p className="text-sm text-primary">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border text-sm">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full mt-6"
                    disabled={
                      isProcessing ||
                      (paymentMethod === "online" && !razorpayLoaded) ||
                      (paymentMethod === "cod" && total > 50000)
                    }
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : paymentMethod === "online" && !razorpayLoaded ? (
                      "Loading..."
                    ) : paymentMethod === "cod" ? (
                      <>
                        <Banknote className="h-4 w-4 mr-2" />
                        Place Order - Pay on Delivery
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Pay {formatPrice(total)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    By placing this order, you agree to our Terms of Service and
                    Privacy Policy.
                  </p>
                </motion.div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
