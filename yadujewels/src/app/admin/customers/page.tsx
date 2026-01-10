"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useOrders } from "@/hooks/useOrders";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  MapPin,
  Phone,
  Mail,
  User,
  ShoppingBag,
  TrendingUp,
  Calendar,
  X,
  Users,
} from "lucide-react";
import Link from "next/link";

interface ShippingAddress {
  fullName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: Array<{
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    payment_status: string;
    payment_method: string;
    itemCount: number;
  }>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  processing: "bg-purple-500/10 text-purple-500",
  shipped: "bg-indigo-500/10 text-indigo-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
};

export default function AdminCustomers() {
  const { data: orders, isLoading } = useOrders();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Expanded customers
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(
    new Set()
  );

  // Process orders to get unique customers
  const customers = useMemo(() => {
    if (!orders) return [];

    const customerMap = new Map<string, CustomerData>();

    orders.forEach((order) => {
      const shippingAddr = order.shipping_address as ShippingAddress;
      
      // Use user_id as the primary key since all customers must be signed in
      // (no guest checkout allowed)
      const customerKey = order.user_id;
      
      // Skip orders without user_id (shouldn't happen with current system)
      if (!customerKey) return;

      const phone = shippingAddr?.phone || "";
      const email = shippingAddr?.email || "";

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: customerKey,
          name: shippingAddr?.fullName || "Unknown Customer",
          email: email,
          phone: phone,
          city: shippingAddr?.city || "",
          state: shippingAddr?.state || "",
          orderCount: 0,
          totalSpent: 0,
          lastOrderDate: order.created_at,
          orders: [],
        });
      }

      const customer = customerMap.get(customerKey)!;
      
      // Only count non-cancelled orders for total spent
      if (order.status !== "cancelled") {
        customer.totalSpent += order.total_amount || 0;
      }
      
      customer.orderCount += 1;
      customer.orders.push({
        id: order.id,
        created_at: order.created_at,
        total_amount: order.total_amount || 0,
        status: order.status || "pending",
        payment_status: order.payment_status || "pending",
        payment_method: order.payment_method || "unknown",
        itemCount: order.order_items?.length || 0,
      });

      // Update last order date if this order is more recent
      if (new Date(order.created_at) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.created_at;
        // Update name if available (in case first order had incomplete info)
        if (shippingAddr?.fullName) {
          customer.name = shippingAddr.fullName;
        }
      }
    });

    let customerList = Array.from(customerMap.values());

    // Sort orders within each customer by date (most recent first)
    customerList.forEach((customer) => {
      customer.orders.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return customerList;
  }, [orders]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(searchQuery) ||
          customer.city.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (sortBy) {
      case "recent":
        result.sort(
          (a, b) =>
            new Date(b.lastOrderDate).getTime() -
            new Date(a.lastOrderDate).getTime()
        );
        break;
      case "orders":
        result.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case "spent":
        result.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [customers, searchQuery, sortBy]);

  const toggleExpanded = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalOrders = orders?.length || 0;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const repeatCustomers = customers.filter((c) => c.orderCount > 1).length;

    return {
      totalCustomers,
      totalOrders,
      totalRevenue,
      avgOrderValue,
      repeatCustomers,
    };
  }, [customers, orders]);

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("recent");
  };

  const hasActiveFilters = searchQuery || sortBy !== "recent";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Customers</h1>
        <p className="text-muted-foreground">
          Manage customers who have placed orders •{" "}
          {filteredCustomers.length} of {customers.length} customers
        </p>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
      >
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" />
            Total Customers
          </div>
          <div className="text-2xl font-semibold">{stats.totalCustomers}</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <ShoppingBag className="h-4 w-4" />
            Total Orders
          </div>
          <div className="text-2xl font-semibold">{stats.totalOrders}</div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="h-4 w-4" />
            Total Revenue
          </div>
          <div className="text-2xl font-semibold text-primary">
            {formatPrice(stats.totalRevenue)}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Package className="h-4 w-4" />
            Avg. Order Value
          </div>
          <div className="text-2xl font-semibold">
            {formatPrice(stats.avgOrderValue)}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <User className="h-4 w-4" />
            Repeat Customers
          </div>
          <div className="text-2xl font-semibold">
            {stats.repeatCustomers}
            <span className="text-sm text-muted-foreground ml-1">
              ({stats.totalCustomers > 0
                ? Math.round((stats.repeatCustomers / stats.totalCustomers) * 100)
                : 0}
              %)
            </span>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-lg border border-border p-4 mb-6"
      >
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent Order</SelectItem>
              <SelectItem value="orders">Most Orders</SelectItem>
              <SelectItem value="spent">Highest Spent</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Customers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-lg border border-border overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading customers...
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="divide-y divide-border">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-[40px_1.5fr_1fr_1fr_100px_100px_120px] gap-4 p-4 bg-muted/50 text-sm font-medium text-muted-foreground">
              <div></div>
              <div>Customer</div>
              <div>Contact</div>
              <div>Location</div>
              <div>Orders</div>
              <div>Total Spent</div>
              <div>Last Order</div>
            </div>

            {/* Customer Rows */}
            {filteredCustomers.map((customer) => {
              const isExpanded = expandedCustomers.has(customer.id);

              return (
                <Collapsible
                  key={customer.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(customer.id)}
                >
                  {/* Main Row */}
                  <CollapsibleTrigger asChild>
                    <div className="grid md:grid-cols-[40px_1.5fr_1fr_1fr_100px_100px_120px] gap-4 p-4 hover:bg-muted/30 cursor-pointer transition-colors items-center">
                      <div className="flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          {customer.orderCount > 1 && (
                            <Badge variant="info" className="text-xs mt-0.5">
                              Repeat Customer
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-sm">
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1 text-muted-foreground mt-0.5 truncate">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {customer.city && customer.state
                          ? `${customer.city}, ${customer.state}`
                          : customer.city || customer.state || "-"}
                      </div>

                      <div className="text-center">
                        <Badge variant="secondary">{customer.orderCount}</Badge>
                      </div>

                      <div className="text-primary font-semibold">
                        {formatPrice(customer.totalSpent)}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {format(new Date(customer.lastOrderDate), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Expanded Content - Order History */}
                  <CollapsibleContent>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-muted/20 border-t border-border"
                        >
                          <div className="p-6">
                            <h4 className="font-medium mb-4 flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4" />
                              Order History ({customer.orderCount} orders)
                            </h4>

                            <div className="space-y-3">
                              {customer.orders.map((order) => (
                                <Link
                                  key={order.id}
                                  href={`/admin/orders?search=${order.id.slice(0, 8)}`}
                                  className="block"
                                >
                                  <div className="bg-background/50 rounded-lg p-4 hover:bg-background transition-colors">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                      <div>
                                        <div className="font-mono text-sm font-medium">
                                          #{order.id.slice(0, 8)}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                          <Calendar className="h-3 w-3" />
                                          {format(
                                            new Date(order.created_at),
                                            "MMM dd, yyyy • h:mm a"
                                          )}
                                        </div>
                                      </div>

                                      <div className="text-sm text-muted-foreground">
                                        {order.itemCount} items
                                      </div>

                                      <Badge
                                        className={statusColors[order.status]}
                                      >
                                        {order.status.charAt(0).toUpperCase() +
                                          order.status.slice(1)}
                                      </Badge>

                                      <Badge
                                        variant={
                                          order.payment_status === "paid"
                                            ? "success"
                                            : "warning"
                                        }
                                      >
                                        {order.payment_status.charAt(0).toUpperCase() +
                                          order.payment_status.slice(1)}
                                      </Badge>

                                      <Badge
                                        variant={
                                          order.payment_method === "razorpay"
                                            ? "info"
                                            : "secondary"
                                        }
                                      >
                                        {order.payment_method === "razorpay"
                                          ? "Razorpay"
                                          : "COD"}
                                      </Badge>

                                      <div className="text-primary font-semibold">
                                        {formatPrice(order.total_amount)}
                                      </div>
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {hasActiveFilters
              ? "No customers match your filters"
              : "No customers found"}
          </div>
        )}
      </motion.div>
    </div>
  );
}
