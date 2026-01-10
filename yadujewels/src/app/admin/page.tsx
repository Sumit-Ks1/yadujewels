"use client";

import { motion } from "framer-motion";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useOrders } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: products } = useProducts();
  const { data: orders } = useOrders();

  const totalProducts = products?.length || 0;
  const totalOrders = orders?.length || 0;
  const totalRevenue =
    orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const pendingOrders =
    orders?.filter((o) => o.status === "pending").length || 0;

  const stats = [
    {
      name: "Total Products",
      value: totalProducts,
      icon: Package,
      change: "+12%",
      trend: "up",
    },
    {
      name: "Total Orders",
      value: totalOrders,
      icon: ShoppingCart,
      change: "+8%",
      trend: "up",
    },
    {
      name: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      change: "+23%",
      trend: "up",
    },
    {
      name: "Pending Orders",
      value: pendingOrders,
      icon: TrendingUp,
      change: "-5%",
      trend: "down",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-card rounded-lg p-6 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <span
                className={`flex items-center text-sm ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.change}
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
              </span>
            </div>
            <h3 className="font-heading text-2xl font-semibold">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-card rounded-lg border border-border"
      >
        <div className="p-6 border-b border-border">
          <h2 className="font-heading text-xl font-semibold">Recent Orders</h2>
        </div>
        <div className="p-6">
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">
                      {formatPrice(order.total_amount || 0)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        order.status === "delivered"
                          ? "bg-green-500/10 text-green-500"
                          : order.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No orders yet
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
