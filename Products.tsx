import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Products() {
  const { data: products, isLoading } = trpc.products.getAllProducts.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products & BOM</h1>
          <p className="text-muted">Manage products and bill of materials</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>All juice products with cost structure</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted">Loading products...</p>
          ) : products && products.length > 0 ? (
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="p-3 bg-card rounded border border-border">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-muted">{product.sku}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No products configured yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
