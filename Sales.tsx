import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Sales() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showDayClose, setShowDayClose] = useState(false);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
  });

  // Sale form state
  const [saleForm, setSaleForm] = useState({
    productId: "",
    quantity: "",
    unitPrice: "",
    paymentMethod: "cash" as "cash" | "mobile_money",
    notes: "",
  });

  // Queries
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = trpc.sales.getAllProducts.useQuery();
  const { data: sales, isLoading: salesLoading, refetch: refetchSales } = trpc.sales.getDailySales.useQuery({ date: selectedDate });
  const { data: salesTotal } = trpc.sales.getDailySalesTotal.useQuery({ date: selectedDate });

  // Mutations
  const createProductMutation = trpc.sales.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      setProductForm({ name: "", sku: "", description: "", category: "" });
      setShowProductForm(false);
      refetchProducts();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  const recordSaleMutation = trpc.sales.recordSale.useMutation({
    onSuccess: (data) => {
      const receiptMsg = data.receiptGenerated ? ` - Receipt #${data.receiptNumber}` : "";
      toast.success(`Sale recorded - UGX ${parseFloat(data.total).toLocaleString()}${receiptMsg}`);
      setSaleForm({ productId: "", quantity: "", unitPrice: "", paymentMethod: "cash", notes: "" });
      setShowSaleForm(false);
      refetchSales();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record sale");
    },
  });

  const closeDayMutation = trpc.sales.closeDay.useMutation({
    onSuccess: (data) => {
      toast.success(`Day closed - Profit: UGX ${data.grossProfit.toLocaleString()}`);
      setShowDayClose(false);
      refetchSales();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to close day");
    },
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) {
      toast.error("Product name and SKU are required");
      return;
    }
    createProductMutation.mutate(productForm);
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.productId || !saleForm.quantity || !saleForm.unitPrice) {
      toast.error("All fields are required");
      return;
    }
    recordSaleMutation.mutate({
      saleDate: selectedDate,
      productId: parseInt(saleForm.productId),
      quantity: saleForm.quantity,
      unitPrice: saleForm.unitPrice,
      paymentMethod: saleForm.paymentMethod,
      notes: saleForm.notes,
    });
  };

  const handleCloseDay = async () => {
    closeDayMutation.mutate({
      closeDate: selectedDate,
      notes: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daily Sales</h1>
          <p className="text-muted">Record and manage juice sales</p>
        </div>
        <div className="flex gap-2">
          <Button className="btn-primary gap-2" onClick={() => setShowProductForm(true)}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
          <Button className="btn-secondary gap-2" onClick={() => setShowSaleForm(true)}>
            <Plus className="w-4 h-4" />
            Record Sale
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex gap-4 items-end">
        <div>
          <label className="text-sm text-muted">Select Date</label>
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="input-field"
          />
        </div>
        <Button className="btn-secondary" onClick={() => setShowDayClose(true)}>
          Close Day
        </Button>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
          <CardDescription>{selectedDate.toDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted">Total Sales</p>
              <p className="text-2xl font-bold text-accent">
                UGX {(salesTotal?.total || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Transactions</p>
              <p className="text-2xl font-bold">{sales?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Average Sale</p>
              <p className="text-2xl font-bold">
                UGX {sales && sales.length > 0 ? ((salesTotal?.total || 0) / sales.length).toLocaleString() : "0"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Records */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>All sales for {selectedDate.toDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <p className="text-muted">Loading sales...</p>
          ) : sales && sales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Product</th>
                    <th className="text-left py-3 px-4 font-semibold">Qty</th>
                    <th className="text-left py-3 px-4 font-semibold">Unit Price</th>
                    <th className="text-left py-3 px-4 font-semibold">Total</th>
                    <th className="text-left py-3 px-4 font-semibold">Payment</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border hover:bg-card/50">
                      <td className="py-3 px-4">Product #{sale.productId}</td>
                      <td className="py-3 px-4">{sale.quantity}</td>
                      <td className="py-3 px-4">UGX {parseFloat(sale.unitPrice.toString()).toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold">UGX {parseFloat(sale.total.toString()).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          sale.paymentMethod === "cash" ? "bg-accent/20 text-accent" : "bg-secondary/20 text-secondary"
                        }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" className="btn-outline gap-1">
                          <Download className="w-3 h-3" />
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No sales recorded for this date</p>
          )}
        </CardContent>
      </Card>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Product</CardTitle>
              <button onClick={() => setShowProductForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Product Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Mango Juice"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">SKU *</label>
                  <input
                    type="text"
                    placeholder="e.g., MJ-001"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Category</label>
                  <input
                    type="text"
                    placeholder="e.g., Fruit Juice"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Description</label>
                  <textarea
                    placeholder="Product details..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="input-field w-full"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1" disabled={createProductMutation.isPending}>
                    {createProductMutation.isPending ? "Creating..." : "Create Product"}
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowProductForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sale Form Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Record Sale</CardTitle>
              <button onClick={() => setShowSaleForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordSale} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Product *</label>
                  <select
                    value={saleForm.productId}
                    onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Select a product</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Unit Price (UGX) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={saleForm.unitPrice}
                    onChange={(e) => setSaleForm({ ...saleForm, unitPrice: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Payment Method *</label>
                  <select
                    value={saleForm.paymentMethod}
                    onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value as "cash" | "mobile_money" })}
                    className="input-field w-full"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Notes</label>
                  <textarea
                    placeholder="Additional notes..."
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                    className="input-field w-full"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1" disabled={recordSaleMutation.isPending}>
                    {recordSaleMutation.isPending ? "Recording..." : "Record Sale"}
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowSaleForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Day Close Modal */}
      {showDayClose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Close Day</CardTitle>
              <CardDescription>Finalize sales for {selectedDate.toDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-card/50 p-4 rounded border border-border">
                <p className="text-sm text-muted">Total Sales</p>
                <p className="text-2xl font-bold text-accent">UGX {(salesTotal?.total || 0).toLocaleString()}</p>
              </div>
              <p className="text-sm text-muted">
                Once you close the day, no more sales can be added for this date. This action cannot be undone.
              </p>
              <div className="flex gap-2 pt-4">
                <Button className="btn-secondary flex-1" onClick={handleCloseDay} disabled={closeDayMutation.isPending}>
                  {closeDayMutation.isPending ? "Closing..." : "Close Day"}
                </Button>
                <Button className="btn-outline flex-1" onClick={() => setShowDayClose(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
