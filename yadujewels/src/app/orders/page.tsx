"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  pending: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-yellow-600 bg-yellow-50",
    label: "Pending",
  },
  processing: {
    icon: <RefreshCw className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-50",
    label: "Processing",
  },
  shipped: {
    icon: <Truck className="h-4 w-4" />,
    color: "text-purple-600 bg-purple-50",
    label: "Shipped",
  },
  delivered: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-green-600 bg-green-50",
    label: "Delivered",
  },
  cancelled: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600 bg-red-50",
    label: "Cancelled",
  },
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?redirect=/orders");
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, authLoading, router]);

  async function fetchOrders() {
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
        created_at,
        order_items (
          id,
          product_name,
          product_image,
          quantity,
          price
        )
      `
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as unknown as Order[]);
    }
    setLoading(false);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="pt-20 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <h1 className="font-heading text-3xl font-semibold mb-8">
              My Orders
            </h1>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-lg p-6 animate-pulse"
                >
                  <div className="flex justify-between mb-4">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-16 w-16 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-20 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl font-semibold">My Orders</h1>
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="font-heading text-xl font-semibold mb-3">
                No orders yet
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Looks like you haven't made any purchases yet. Start shopping
                to see your orders here!
              </p>
              <Button variant="gold" asChild>
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const itemCount = order.order_items?.length || 0;
                const firstItems = order.order_items?.slice(0, 3) || [];

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/order-success?order_id=${order.id}`}>
                      <div className="bg-card rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer group">
                        {/* Header */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-border">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${status.color}`}
                            >
                              {status.icon}
                              <span className="font-medium">{status.label}</span>
                            </div>
                            {order.payment_method === "cod" ? (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                COD
                              </span>
                            ) : order.payment_status === "paid" ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                Paid
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDate(order.created_at)}</span>
                            <span className="font-mono text-xs">
                              #{order.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>

                        {/* Items */}
                        <div className="flex items-center gap-4">
                          {/* Product Images */}
                          <div className="flex -space-x-3">
                            {firstItems.map((item, i) => (
                              <div
                                key={item.id}
                                className="relative h-14 w-14 rounded-lg overflow-hidden border-2 border-background bg-muted"
                                style={{ zIndex: 10 - i }}
                              >
                                <Image
                                  src={item.product_image || "/placeholder.svg"}
                                  alt={item.product_name}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              </div>
                            ))}
                            {itemCount > 3 && (
                              <div className="relative h-14 w-14 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                                +{itemCount - 3}
                              </div>
                            )}
                          </div>

                          {/* Order Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-muted-foreground">
                              {itemCount} item{itemCount !== 1 ? "s" : ""}
                            </p>
                            <p className="font-medium text-primary">
                              {formatPrice(order.total_amount)}
                            </p>
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
