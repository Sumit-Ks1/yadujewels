"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import {
  useOrders,
  useUpdateOrderStatus,
  useUpdatePaymentStatus,
  useUpdateTrackingNumber,
} from "@/hooks/useOrders";
import { formatPrice } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Package,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Truck,
  X,
  Filter,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  processing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  shipped: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-500/10 text-green-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  failed: "bg-red-500/10 text-red-500",
  refunded: "bg-gray-500/10 text-gray-500",
};

const statusOptions = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const paymentStatusOptions = ["pending", "paid", "failed", "refunded"];

interface ShippingAddress {
  fullName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

export default function AdminOrders() {
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const updateTrackingNumber = useUpdateTrackingNumber();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Expanded rows
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Tracking number edit states
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingValue, setTrackingValue] = useState("");

  // Toggle expanded order
  const toggleExpanded = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Filtered orders (client-side)
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order) => {
      // Search by order ID
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(searchLower);
        const shippingAddr = order.shipping_address as ShippingAddress;
        const matchesName = shippingAddr?.fullName
          ?.toLowerCase()
          .includes(searchLower);
        const matchesPhone = shippingAddr?.phone?.includes(searchQuery);
        if (!matchesId && !matchesName && !matchesPhone) return false;
      }

      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) return false;

      // Payment status filter
      if (
        paymentFilter !== "all" &&
        order.payment_status !== paymentFilter
      )
        return false;

      // Payment method filter
      if (
        paymentMethodFilter !== "all" &&
        order.payment_method !== paymentMethodFilter
      )
        return false;

      // Date range filter
      if (dateRange?.from) {
        const orderDate = new Date(order.created_at);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        if (!isWithinInterval(orderDate, { start: from, end: to })) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, paymentMethodFilter, dateRange]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setPaymentMethodFilter("all");
    setDateRange(undefined);
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    paymentMethodFilter !== "all" ||
    dateRange;

  const handleStatusChange = async (
    orderId: string,
    newStatus: string,
    previousStatus: string
  ) => {
    try {
      await updateStatus.mutateAsync({
        id: orderId,
        status: newStatus,
        previousStatus,
      });
      if (newStatus === "cancelled") {
        toast.success("Order cancelled and stock restored");
      } else {
        toast.success("Order status updated");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handlePaymentStatusChange = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      await updatePaymentStatus.mutateAsync({
        id: orderId,
        payment_status: newStatus,
      });
      toast.success("Payment status updated");
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const handleTrackingUpdate = async (orderId: string) => {
    try {
      await updateTrackingNumber.mutateAsync({
        id: orderId,
        tracking_number: trackingValue,
      });
      toast.success("Tracking number updated");
      setEditingTracking(null);
      setTrackingValue("");
    } catch (error) {
      toast.error("Failed to update tracking number");
    }
  };

  const startEditTracking = (orderId: string, currentValue: string | null) => {
    setEditingTracking(orderId);
    setTrackingValue(currentValue || "");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders • {filteredOrders.length} of {orders?.length || 0} orders
        </p>
      </div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg border border-border p-4 mb-6"
      >
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID, Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Status Filter */}
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {paymentStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Payment Method Filter */}
          <Select
            value={paymentMethodFilter}
            onValueChange={setPaymentMethodFilter}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="razorpay">Razorpay</SelectItem>
              <SelectItem value="cod">Cash on Delivery</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`min-w-[200px] justify-start text-left font-normal ${
                  !dateRange ? "text-muted-foreground" : ""
                }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd")} -{" "}
                      {format(dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Pick date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

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

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-sm text-muted-foreground flex items-center">
              <Filter className="h-3 w-3 mr-1" />
              Active filters:
            </span>
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: {searchQuery}
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Status: {statusFilter}
              </Badge>
            )}
            {paymentFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Payment: {paymentFilter}
              </Badge>
            )}
            {paymentMethodFilter !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Method: {paymentMethodFilter}
              </Badge>
            )}
            {dateRange?.from && (
              <Badge variant="secondary" className="text-xs">
                Date: {format(dateRange.from, "MMM dd")}
                {dateRange.to && ` - ${format(dateRange.to, "MMM dd")}`}
              </Badge>
            )}
          </div>
        )}
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg border border-border overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading orders...
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="divide-y divide-border">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-[40px_1fr_1fr_1fr_120px_120px_100px] gap-4 p-4 bg-muted/50 text-sm font-medium text-muted-foreground">
              <div></div>
              <div>Order Details</div>
              <div>Customer</div>
              <div>Amount</div>
              <div>Status</div>
              <div>Payment</div>
              <div>Method</div>
            </div>

            {/* Order Rows */}
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const shippingAddr = order.shipping_address as ShippingAddress;

              return (
                <Collapsible
                  key={order.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(order.id)}
                >
                  {/* Main Row */}
                  <CollapsibleTrigger asChild>
                    <div className="grid md:grid-cols-[40px_1fr_1fr_1fr_120px_120px_100px] gap-4 p-4 hover:bg-muted/30 cursor-pointer transition-colors items-center">
                      <div className="flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div>
                        <div className="font-mono text-sm font-medium">
                          #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "MMM dd, yyyy • h:mm a")}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.order_items?.length || 0} items
                        </div>
                      </div>

                      <div>
                        <div className="font-medium">
                          {shippingAddr?.fullName || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {shippingAddr?.city}, {shippingAddr?.state}
                        </div>
                      </div>

                      <div className="text-primary font-semibold">
                        {formatPrice(order.total_amount || 0)}
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status || "pending"}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value,
                              order.status || "pending"
                            )
                          }
                          className={`w-full px-2 py-1 rounded text-xs font-medium border cursor-pointer ${
                            statusColors[order.status || "pending"]
                          }`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.payment_status || "pending"}
                          onChange={(e) =>
                            handlePaymentStatusChange(order.id, e.target.value)
                          }
                          className={`w-full px-2 py-1 rounded text-xs font-medium border-none cursor-pointer ${
                            paymentStatusColors[order.payment_status || "pending"]
                          }`}
                        >
                          {paymentStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Badge
                          variant={
                            order.payment_method === "razorpay"
                              ? "info"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {order.payment_method === "cod" ? "COD" : "Razorpay"}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-muted/20 border-t border-border"
                        >
                          <div className="p-6 grid md:grid-cols-3 gap-6">
                            {/* Order Items */}
                            <div className="md:col-span-2">
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Order Items
                              </h4>
                              <div className="space-y-3">
                                {order.order_items?.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex gap-4 items-center bg-background/50 rounded-lg p-3"
                                  >
                                    {item.product_image && (
                                      <img
                                        src={item.product_image}
                                        alt={item.product_name}
                                        className="w-16 h-16 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {item.product_name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Qty: {item.quantity} × {formatPrice(item.price)}
                                      </div>
                                    </div>
                                    <div className="font-medium text-primary">
                                      {formatPrice(item.price * item.quantity)}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Order Notes */}
                              {order.notes && (
                                <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                                  <h5 className="text-sm font-medium text-yellow-600 mb-1">
                                    Order Notes
                                  </h5>
                                  <p className="text-sm">{order.notes}</p>
                                </div>
                              )}

                              {/* Tracking Number */}
                              <div className="mt-4 p-3 bg-background/50 rounded-lg">
                                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <Truck className="h-4 w-4" />
                                  Tracking Information
                                </h5>
                                {editingTracking === order.id ? (
                                  <div className="flex gap-2">
                                    <Input
                                      value={trackingValue}
                                      onChange={(e) =>
                                        setTrackingValue(e.target.value)
                                      }
                                      placeholder="Enter tracking number"
                                      className="flex-1"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleTrackingUpdate(order.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingTracking(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                      {order.tracking_number || "No tracking number"}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        startEditTracking(
                                          order.id,
                                          order.tracking_number
                                        )
                                      }
                                    >
                                      {order.tracking_number ? "Edit" : "Add"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Shipping Address
                              </h4>
                              <div className="bg-background/50 rounded-lg p-4 space-y-3">
                                <div className="flex items-start gap-2">
                                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <div className="font-medium">
                                      {shippingAddr?.fullName}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div className="text-sm">
                                    <div>{shippingAddr?.address}</div>
                                    <div>
                                      {shippingAddr?.city}, {shippingAddr?.state}
                                    </div>
                                    <div>{shippingAddr?.pincode}</div>
                                  </div>
                                </div>

                                {shippingAddr?.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a
                                      href={`tel:${shippingAddr.phone}`}
                                      className="text-sm text-primary hover:underline"
                                    >
                                      {shippingAddr.phone}
                                    </a>
                                  </div>
                                )}

                                {shippingAddr?.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a
                                      href={`mailto:${shippingAddr.email}`}
                                      className="text-sm text-primary hover:underline"
                                    >
                                      {shippingAddr.email}
                                    </a>
                                  </div>
                                )}

                                {order.razorpay_payment_id && (
                                  <div className="flex items-start gap-2 pt-2 border-t border-border">
                                    <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="text-xs">
                                      <div className="text-muted-foreground">
                                        Payment ID
                                      </div>
                                      <div className="font-mono">
                                        {order.razorpay_payment_id}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
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
              ? "No orders match your filters"
              : "No orders found"}
          </div>
        )}
      </motion.div>
    </div>
  );
}
