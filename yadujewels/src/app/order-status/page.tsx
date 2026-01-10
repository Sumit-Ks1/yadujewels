"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Home,
  RefreshCw,
  Phone,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface OrderStatus {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total_amount: number;
  created_at: string;
}

export default function OrderStatusPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, payment_status, payment_method, total_amount, created_at")
      .eq("id", orderId)
      .single();

    if (!error && data) {
      setOrder(data as OrderStatus);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
  };

  const getStatusIcon = () => {
    if (!order) return <AlertCircle className="h-16 w-16 text-muted-foreground" />;
    
    switch (order.payment_status) {
      case "paid":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "failed":
        return <XCircle className="h-16 w-16 text-red-500" />;
      case "pending":
        return <Clock className="h-16 w-16 text-yellow-500" />;
      default:
        return <AlertCircle className="h-16 w-16 text-muted-foreground" />;
    }
  };

  const getStatusMessage = () => {
    if (!order) return { title: "Order Not Found", description: "We couldn't find this order." };
    
    switch (order.payment_status) {
      case "paid":
        return {
          title: "Payment Successful!",
          description: "Your payment has been confirmed. Your order is being processed.",
        };
      case "failed":
        return {
          title: "Payment Failed",
          description: "There was an issue with your payment. Please try again or contact support.",
        };
      case "pending":
        return {
          title: "Payment Pending",
          description: "We're waiting for payment confirmation. This may take a few moments.",
        };
      default:
        return {
          title: "Order Status Unknown",
          description: "Please contact support for assistance.",
        };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Checking order status...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const status = getStatusMessage();

  return (
    <Layout>
      <div className="pt-20 min-h-screen">
        <div className="container mx-auto px-4 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-lg mx-auto text-center"
          >
            {/* Status Icon */}
            <div className="mb-6">
              {getStatusIcon()}
            </div>

            {/* Status Message */}
            <h1 className="font-heading text-3xl font-semibold mb-4">
              {status.title}
            </h1>
            <p className="text-muted-foreground mb-8">
              {status.description}
            </p>

            {/* Order Details */}
            {order && (
              <div className="bg-card rounded-lg p-6 mb-8 text-left">
                <h2 className="font-medium mb-4">Order Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="font-mono">{order.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{formatPrice(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <span className={`font-medium capitalize ${
                      order.payment_status === "paid" ? "text-green-600" :
                      order.payment_status === "failed" ? "text-red-600" :
                      "text-yellow-600"
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {order?.payment_status === "pending" && (
                <Button
                  variant="gold-outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </>
                  )}
                </Button>
              )}

              {order?.payment_status === "paid" && (
                <Button variant="gold" asChild>
                  <Link href={`/order-success?order_id=${order.id}`}>
                    View Order Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}

              {order?.payment_status === "failed" && (
                <Button variant="gold" asChild>
                  <Link href="/checkout">
                    Try Again
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              )}

              <Button variant="ghost" asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Contact Support */}
            {order?.payment_status === "failed" && (
              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Need help? Contact our support team
                </p>
                <a
                  href="tel:+917906720961"
                  className="inline-flex items-center text-primary hover:underline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  +91 79067 20961
                </a>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
