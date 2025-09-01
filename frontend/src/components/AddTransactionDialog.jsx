import { useState } from "react";
import toast from "react-hot-toast";
import { mutate } from "swr";
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
import { Label } from "./ui/label";
import { Input } from "./ui/input";

function AddTransactionDialog({ mutateKey }) {
  const { api } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onAdd() {
    if (!input.trim()) {
      toast.error("Please enter a transaction");
      return;
    }

    setLoading(true);

    try {
      // Parse the transaction
      const parseRes = await api.post("/api/transactions/parse", {
        text: input,
      });

      if (!parseRes.data.success) {
        throw new Error(parseRes.data.message || "Failed to parse transaction");
      }

      const parsedTxn = parseRes.data.parsed;
      console.log("Parsed transaction:", parsedTxn);

      // Create the transaction
      const createRes = await api.post("/api/transactions", parsedTxn);

      if (!createRes.data.success) {
        throw new Error(
          createRes.data.message || "Failed to create transaction"
        );
      }

      toast.success(createRes.data.message || "Transaction added successfully");
      await mutate(mutateKey);
      setOpen(false);
      setInput("");
    } catch (error) {
      console.error("Add transaction error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to add transaction"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md mx-auto sm:max-w-lg md:max-w-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl">
            Add new transaction
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="txn-input" className="text-sm font-medium">
              Transaction
            </Label>
            <Input
              id="txn-input"
              placeholder="e.g. Coffee at Starbucks $6.50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  onAdd();
                }
              }}
              disabled={loading}
              className="text-base sm:text-sm"
            />
          </div>
        </div>
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
            onClick={onAdd}
            disabled={loading}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {loading ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddTransactionDialog;
