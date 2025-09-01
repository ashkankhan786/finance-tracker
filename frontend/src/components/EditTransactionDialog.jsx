import { useState } from "react";
import { mutate } from "swr";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Pencil } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";

function EditTransactionDialog({ txn, mutateKey }) {
  const { api } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize form with correct field names matching your transaction object
  const [form, setForm] = useState({
    description: txn.description || "",
    amount: String(Math.abs(txn.amount || 0)), // Use absolute value for display
    category: txn.category || "",
    currency: txn.currency || "USD",
    date: txn.date ? new Date(txn.date).toISOString().slice(0, 10) : "",
  });

  async function onSave() {
    // Only validate amount if user actually changed it
    if (form.amount && parseFloat(form.amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      // Only send fields that have values - let backend handle keeping existing values
      const updateData = {};

      if (form.description.trim()) {
        updateData.description = form.description.trim();
      }

      if (form.amount) {
        updateData.amount = parseFloat(form.amount);
      }

      if (form.category) {
        updateData.category = form.category;
      }

      if (form.currency) {
        updateData.currency = form.currency;
      }

      if (form.date) {
        updateData.date = new Date(form.date).toISOString();
      }

      const res = await api.put(`/api/transactions/${txn._id}`, updateData);

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to update transaction");
      }

      toast.success(res.data.message || "Transaction updated successfully");

      // Revalidate the SWR cache
      await mutate(mutateKey);
      setOpen(false);
    } catch (error) {
      console.error("Update transaction error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update transaction"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit transaction"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl">
            Edit Transaction
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="t-description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="t-description"
              placeholder="e.g. Coffee at Starbucks"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              disabled={loading}
              className="text-base sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="t-amount" className="text-sm font-medium">
                Amount
              </Label>
              <Input
                id="t-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                disabled={loading}
                className="text-base sm:text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="t-currency" className="text-sm font-medium">
                Currency
              </Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                disabled={loading}
              >
                <SelectTrigger id="t-currency" className="text-base sm:text-sm">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="t-category" className="text-sm font-medium">
              Category
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              disabled={loading}
            >
              <SelectTrigger id="t-category" className="text-base sm:text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">🍕 Food</SelectItem>
                <SelectItem value="Transport">🚗 Transport</SelectItem>
                <SelectItem value="Shopping">🛍️ Shopping</SelectItem>
                <SelectItem value="Entertainment">🎬 Entertainment</SelectItem>
                <SelectItem value="Healthcare">🏥 Healthcare</SelectItem>
                <SelectItem value="Education">📚 Education</SelectItem>
                <SelectItem value="Utilities">💡 Utilities</SelectItem>
                <SelectItem value="Income">💰 Income</SelectItem>
                <SelectItem value="Other">📦 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="t-date" className="text-sm font-medium">
              Date
            </Label>
            <Input
              id="t-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              disabled={loading}
              className="text-base sm:text-sm"
            />
          </div>
        </div>

        <Separator className="my-2" />

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={loading}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditTransactionDialog;
