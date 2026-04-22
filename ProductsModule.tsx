import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProductsModule() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [showBOMForm, setShowBOMForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
  });

  const [bomForm, setBOMForm] = useState({
    ingredient: "",
    quantity: "",
    unitCost: "",
    notes: "",
  });

  // Queries
  const { data: products, isLoading, refetch } = trpc.products.getAllProducts.useQuery();

  // Mutations
  const createProductMutation = trpc.products.createProduct.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      setProductForm({ name: "", sku: "", description: "", category: "" });
      setShowProductForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product");
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

  const handleAddBOMItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bomForm.ingredient || !bomForm.quantity || !bomForm.unitCost) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success("BOM item added (feature coming soon)");
    setBOMForm({ ingredient: "", quantity: "", unitCost: "", notes: "" });
  };

  const calculateCostPerUnit = (items: any[]) => {
    return items.reduce((sum, item) => sum + parseFloat(item.unitCost || 0) * parseFloat(item.quantity || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products & BOM</h1>
          <p className="text-muted">Manage products and bill of materials</p>
        </div>
        <Button className="btn-primary gap-2" onClick={() => setShowProductForm(true)}>
          <Plus className="w-4 h-4" />
          New Product
        </Button>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted text-center">Loading products...</p>
            </CardContent>
          </Card>
        ) : products && products.length > 0 ? (
          products.map((product) => (
            <Card key={product.id} className="hover:bg-card/50 transition">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <p className="text-sm text-muted">SKU: {product.sku}</p>
                    {product.description && <p className="text-sm text-muted mt-1">{product.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="btn-outline gap-1">
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button size="sm" className="btn-outline gap-1 text-destructive">
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>

                {product.category && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-semibold">
                      {product.category}
                    </span>
                  </div>
                )}

                <Button
                  size="sm"
                  className="btn-secondary gap-2"
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setShowBOMForm(true);
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Add BOM Item
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted text-center">No products created yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create New Product</CardTitle>
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
                    placeholder="e.g., Mango Juice 1L"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">SKU *</label>
                  <input
                    type="text"
                    placeholder="e.g., MJ-1L-001"
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

      {/* BOM Form Modal */}
      {showBOMForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add BOM Item</CardTitle>
              <button onClick={() => setShowBOMForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBOMItem} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Ingredient/Component *</label>
                  <input
                    type="text"
                    placeholder="e.g., Fresh Mango"
                    value={bomForm.ingredient}
                    onChange={(e) => setBOMForm({ ...bomForm, ingredient: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={bomForm.quantity}
                      onChange={(e) => setBOMForm({ ...bomForm, quantity: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Unit Cost (UGX) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={bomForm.unitCost}
                      onChange={(e) => setBOMForm({ ...bomForm, unitCost: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Notes</label>
                  <textarea
                    placeholder="Additional notes..."
                    value={bomForm.notes}
                    onChange={(e) => setBOMForm({ ...bomForm, notes: e.target.value })}
                    className="input-field w-full"
                    rows={2}
                  />
                </div>

                <div className="bg-muted/10 p-3 rounded">
                  <p className="text-xs text-muted">Total Cost for this item:</p>
                  <p className="text-lg font-bold">
                    UGX {(parseFloat(bomForm.quantity || "0") * parseFloat(bomForm.unitCost || "0")).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1">
                    Add Item
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowBOMForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BOM Information */}
      <Card className="bg-muted/10 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Bill of Materials (BOM)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>✓ Track all ingredients and components for each product</p>
          <p>✓ Calculate cost per unit based on ingredient costs</p>
          <p>✓ Monitor production batch costs and profitability</p>
          <p>✓ Manage ingredient inventory and sourcing</p>
        </CardContent>
      </Card>
    </div>
  );
}
