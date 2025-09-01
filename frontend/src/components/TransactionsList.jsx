import { formatCurrency, formatDateShort } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { mutate } from "swr";
import { Badge } from "./ui/badge";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import EditTransactionDialog from "./EditTransactionDialog";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useState } from "react";

function TransactionRow({ txn, mutateKey }) {
  const { api } = useAuth();
  const [deleting, setDeleting] = useState(false);

  // Determine if it's an expense or income based on category or amount
  const isIncome = txn.category?.toLowerCase() === "income";
  const amountColor = isIncome ? "text-green-600" : "text-red-600";
  const displayAmount = Math.abs(txn.amount); // Show absolute value

  async function handleDelete() {
    if (deleting) return;

    setDeleting(true);

    try {
      // Optimistic update
      const prev = await mutate(
        mutateKey,
        async (current) => {
          const transactions = current?.transactions || current || [];
          return {
            ...current,
            transactions: transactions.filter((x) => x._id !== txn._id),
          };
        },
        { revalidate: false }
      );

      const res = await api.delete(`/api/transactions/${txn._id}`);

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to delete transaction");
      }

      toast.success(res.data.message || "Transaction deleted successfully");
      await mutate(mutateKey);
    } catch (error) {
      console.error("Delete transaction error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete transaction"
      );
      // Revert optimistic update on error
      await mutate(mutateKey);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="py-4 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="truncate text-sm font-medium text-foreground">
                {txn.description || "No description"}
              </p>
              <Badge variant="outline" className="text-xs shrink-0">
                {txn.category || "Uncategorized"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDateShort(txn.date)}</span>
              <span>{txn.currency || "USD"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className={`text-sm font-semibold ${amountColor}`}>
              {isIncome ? "+" : "-"}
              {formatCurrency(displayAmount)}
            </p>
          </div>
          <EditTransactionDialog txn={txn} mutateKey={mutateKey} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete transaction"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function TransactionsList({ transactions, mutateKey }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <CardDescription>
          Review, edit or remove your transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No transactions found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first transaction to get started
              </p>
            </div>
          ) : (
            <ul className="space-y-0">
              {transactions.map((txn) => (
                <TransactionRow key={txn._id} txn={txn} mutateKey={mutateKey} />
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TransactionsList;
