"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  ArrowRight,
  Home,
  Truck,
  CreditCard,
  Calendar,
  Copy,
  Check,
  Banknote,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface OrderDetails {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  shipping_address: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  order_items: OrderItem[];
}

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          total_amount,
          status,
          payment_status,
          payment_method,
          razorpay_payment_id,
          created_at,
          shipping_address,
          order_items (
            id,
            product_id,
            product_name,
            product_image,
            quantity,
            price
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (!error && data) {
        setOrder(data as unknown as OrderDetails);
      }
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  const copyOrderId = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate subtotal from items
  const subtotal = order?.order_items?.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  ) || 0;

  return (
    <Layout>
      <div className="pt-20 min-h-screen">
        <div className="container mx-auto px-4 py-8 lg:py-16">
          {loading ? (
            <div className="max-w-3xl mx-auto">
              <div className="animate-pulse space-y-8">
                <div className="h-24 w-24 bg-muted rounded-full mx-auto"></div>
                <div className="h-8 bg-muted rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="bg-card rounded-lg p-6 space-y-4">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : order ? (
            <div className="max-w-3xl mx-auto">
              {/* Success Header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-6"
                >
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </motion.div>

                <h1 className="font-heading text-3xl font-semibold mb-3">
                  {order.payment_method === "cod"
                    ? "Order Confirmed!"
                    : order.payment_status === "paid"
                    ? "Payment Successful!"
                    : "Order Placed!"}
                </h1>
                <p className="text-muted-foreground">
                  {order.payment_method === "cod"
                    ? "Thank you for your order. Please keep cash ready for payment on delivery."
                    : "Thank you for your purchase. We've received your order and will process it shortly."}
                </p>
              </motion.div>

              <div className="grid lg:grid-cols-5 gap-8">
                {/* Order Items - Left Column */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-3 space-y-6"
                >
                  {/* Items Purchased */}
                  <div className="bg-card rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="font-medium">Items Purchased</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {order.order_items?.length || 0} item(s)
                      </span>
                    </div>

                    <div className="space-y-4">
                      {order.order_items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                        >
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={item.product_image || "/placeholder.svg"}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {item.product_name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-medium text-primary mt-1">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Price Summary */}
                    <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                      <div className="flex justify-between font-semibold text-base">
                        <span>
                          {order.payment_method === "cod"
                            ? "Amount to Pay"
                            : "Total Paid"}
                        </span>
                        <span className="text-primary">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shipping_address && (
                    <div className="bg-card rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                        <Truck className="h-5 w-5 text-primary" />
                        <span className="font-medium">Shipping Address</span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">
                          {order.shipping_address.fullName}
                        </p>
                        {order.shipping_address.phone && (
                          <p className="text-muted-foreground mt-1">
                            Phone: {order.shipping_address.phone}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-2">
                          {order.shipping_address.address}
                        </p>
                        <p className="text-muted-foreground">
                          {order.shipping_address.city},{" "}
                          {order.shipping_address.state} -{" "}
                          {order.shipping_address.pincode}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Order Summary - Right Column */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2"
                >
                  <div className="bg-card rounded-lg p-6 sticky top-24">
                    <h3 className="font-medium mb-4">Order Summary</h3>

                    <div className="space-y-4 text-sm">
                      {/* Order ID */}
                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Order ID
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {order.id.slice(0, 8)}...
                          </code>
                          <button
                            onClick={copyOrderId}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copy full order ID"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Order Date */}
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Order Date
                          </span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div className="flex items-start gap-3">
                        {order.payment_method === "cod" ? (
                          <Banknote className="h-4 w-4 text-muted-foreground mt-0.5" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                        )}
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Payment Method
                          </span>
                          {order.payment_method === "cod" ? (
                            <>
                              <span className="font-medium text-orange-600">
                                Cash on Delivery
                              </span>
                              <p className="text-xs text-muted-foreground mt-1">
                                Pay {formatPrice(order.total_amount)} on delivery
                              </p>
                            </>
                          ) : (
                            <>
                              <span
                                className={`inline-flex items-center gap-1 ${
                                  order.payment_status === "paid"
                                    ? "text-green-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                {order.payment_status === "paid" ? (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    Paid Online
                                  </>
                                ) : (
                                  "Payment Pending"
                                )}
                              </span>
                              {order.razorpay_payment_id && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ID: {order.razorpay_payment_id.slice(0, 12)}...
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Order Status */}
                      <div className="flex items-start gap-3">
                        <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            Order Status
                          </span>
                          <span className="capitalize font-medium">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-6 border-t border-border space-y-3">
                      <Button variant="gold" className="w-full" asChild>
                        <Link href="/orders">
                          View All Orders
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/shop">Continue Shopping</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Help Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  Need help with your order?{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    Contact our support team
                  </Link>
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto text-center">
              <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h1 className="font-heading text-2xl font-semibold mb-4">
                Order Not Found
              </h1>
              <p className="text-muted-foreground mb-8">
                We couldn't find the order you're looking for. It may have been
                processed under a different account.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gold" asChild>
                  <Link href="/shop">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Shop
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/orders">View My Orders</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
