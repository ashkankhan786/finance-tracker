import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { motion } from "motion/react";
import {
  Loader2,
  LogOut,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDateShort } from "@/lib/format";
import FiltersBar from "@/components/FiltersBar";
import SummaryCard from "@/components/SummaryCard";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import TransactionsList from "@/components/TransactionsList";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

// Enhanced color palette with better variety and accessibility
const CATEGORY_COLORS = {
  Food: "#E74C3C", // Red
  Transport: "#3498DB", // Blue
  Shopping: "#9B59B6", // Purple
  Entertainment: "#F39C12", // Orange
  Income: "#27AE60", // Green
  Healthcare: "#E91E63", // Pink
  Education: "#2196F3", // Light Blue
  Utilities: "#FF9800", // Amber
  Other: "#607D8B", // Blue Grey
  Uncategorized: "#95A5A6", // Grey
};

// Fallback colors for unknown categories
const FALLBACK_COLORS = [
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
];

const getCategoryColor = (category, index) => {
  return (
    CATEGORY_COLORS[category] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  );
};

const fetcher = async (url, api) => {
  console.log("🚀 Starting fetch for:", url);
  console.log("🔗 Full URL:", `${api.defaults.baseURL}/${url}`);

  try {
    const res = await api.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    console.log("✅ Response received:", {
      status: res.status,
      url: url,
      success: res.data?.success,
      hasData: !!res.data,
    });

    if (!res.data) {
      console.error("❌ No data in response for:", url);
      throw new Error("No data received from server");
    }

    if (!res.data.success) {
      console.error("❌ Server returned success: false for:", url, res.data);
      throw new Error(res.data.message || "Server request failed");
    }

    console.log("✅ Fetch successful for:", url);
    return res.data;
  } catch (error) {
    console.error("❌ Fetch error for:", url, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });
    throw error;
  }
};

function useSummary(api, isAuthenticated) {
  const { data, error, isLoading } = useSWR(
    api && isAuthenticated ? "api/analytics/summary" : null,
    (url) => {
      console.log("📊 SWR calling fetcher for summary:", url);
      return fetcher(url, api);
    },
    {
      errorRetryCount: 1,
      errorRetryInterval: 2000,
      revalidateOnFocus: false,
      onError: (err) => {
        console.error("📊 SWR Summary Error:", err);
      },
      onSuccess: (data) => {
        console.log("📊 SWR Summary Success:", data);
      },
    }
  );

  console.log("📊 useSummary state:", {
    data: !!data,
    error: !!error,
    isLoading,
  });

  return {
    data: data?.summary,
    error,
    loading: isLoading,
  };
}

function useCategories(api, isAuthenticated) {
  const { data, error } = useSWR(
    api && isAuthenticated ? "api/analytics/categories" : null,
    (url) => fetcher(url, api),
    {
      errorRetryCount: 1,
      errorRetryInterval: 2000,
      revalidateOnFocus: false,
      onError: (err) => {
        console.error("📊 SWR Categories Error:", err);
      },
      onSuccess: (data) => {
        console.log("📊 SWR Categories Success:", data);
      },
    }
  );
  return {
    data: data?.categories || [],
    error,
    loading: !data && !error,
  };
}

function useTrends(period = "month", api, isAuthenticated) {
  const { data, error } = useSWR(
    api && isAuthenticated ? `api/analytics/trends?period=${period}` : null,
    (url) => fetcher(url, api),
    {
      errorRetryCount: 1,
      errorRetryInterval: 2000,
      revalidateOnFocus: false,
      onError: (err) => {
        console.error("📊 SWR Trends Error:", err);
      },
      onSuccess: (data) => {
        console.log("📊 SWR Trends Success:", data);
      },
    }
  );
  return {
    data: data?.data || [],
    error,
    loading: !data && !error,
  };
}

function useTransactions(api, isAuthenticated) {
  const { data, error } = useSWR(
    api && isAuthenticated ? "api/transactions" : null,
    (url) => fetcher(url, api),
    {
      errorRetryCount: 1,
      errorRetryInterval: 2000,
      revalidateOnFocus: false,
      onError: (err) => {
        console.error("📊 SWR Transactions Error:", err);
      },
      onSuccess: (data) => {
        console.log("📊 SWR Transactions Success:", data);
      },
    }
  );
  return {
    data: data?.transactions || [],
    error,
    loading: !data && !error,
    key: "/transactions",
  };
}

export default function DashboardPage() {
  const { accessToken, user, api, loading: authLoading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAuthenticated = !authLoading && !!accessToken && !!user;

  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    console.log("Dashboard - Auth state:", {
      user: user ? "present" : "missing",
      accessToken: accessToken
        ? `present (${accessToken.substring(0, 20)}...)`
        : "missing",
      tokenType: typeof accessToken,
      authLoading,
      isAuthenticated,
    });
  }, [user, accessToken, authLoading, isAuthenticated]);

  const [period, setPeriod] = useState("monthly");
  const [filteredCategory, setFilteredCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: summary,
    error: summaryError,
    loading: summaryLoading,
  } = useSummary(api, isAuthenticated);
  const {
    data: categories,
    error: categoriesError,
    loading: categoriesLoading,
  } = useCategories(api, isAuthenticated);
  const {
    data: trends,
    error: trendsError,
    loading: trendsLoading,
  } = useTrends(period, api, isAuthenticated);
  const {
    data: transactions,
    error: txnsError,
    loading: txnsLoading,
    key: txnsKey,
  } = useTransactions(api, isAuthenticated);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((txn) => {
      const matchesCategory =
        !filteredCategory || txn.category === filteredCategory;
      const matchesSearch =
        !searchQuery ||
        txn.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [transactions, filteredCategory, searchQuery]);

  const filteredSummary = useMemo(() => {
    if (!filteredTransactions.length) return summary;

    let income = 0;
    let expenses = 0;

    filteredTransactions.forEach((txn) => {
      if (txn.category?.toLowerCase() === "income") {
        income += txn.amount;
      } else {
        expenses += txn.amount;
      }
    });

    return {
      income,
      expenses,
      savings: income - expenses,
    };
  }, [filteredTransactions, summary]);

  const totalCategories = useMemo(
    () => categories.reduce((a, c) => a + Math.abs(c.amount || 0), 0),
    [categories]
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Error handling
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authLoading && (!accessToken || !user)) {
    navigate("/");
  }

  return (
    <main className="container mx-auto max-w-6xl p-4 md:p-6">
      <header className="mb-4 md:mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-balance text-2xl md:text-3xl font-semibold tracking-tight">
            My Finance
          </h1>
          <p className="text-sm text-muted-foreground">Track your spending</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="outline"
            className="border-red-500 hover:bg-red-500"
            onClick={handleLogout}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </header>

      <FiltersBar
        value={{ period, category: filteredCategory, q: searchQuery }}
        onChange={(next) => {
          if (next.period) setPeriod(next.period);
          if ("category" in next) setFilteredCategory(next.category);
          if (typeof next.q === "string") setSearchQuery(next.q);
        }}
      />

      {/* Summary Cards */}
      <section className="mt-4 grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3">
        <SummaryCard
          title="Total Income"
          value={
            summaryLoading
              ? "Loading..."
              : formatCurrency(filteredSummary?.income || 0)
          }
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          tone="positive"
        />
        <SummaryCard
          title="Total Expenses"
          value={
            summaryLoading
              ? "Loading..."
              : formatCurrency(filteredSummary?.expenses || 0)
          }
          icon={<TrendingDown className="h-4 w-4 text-destructive" />}
          tone="negative"
        />
        <SummaryCard
          title="Net Savings"
          value={
            summaryLoading
              ? "Loading..."
              : formatCurrency(filteredSummary?.savings || 0)
          }
          icon={<PiggyBank className="h-4 w-4 text-primary" />}
          tone="positive"
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              Spending Categories
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Distribution by category
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {categories.length > 0 ? (
              <>
                <ChartContainer
                  config={{
                    categories: {
                      label: "Categories",
                    },
                  }}
                  className="mx-auto h-[280px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-3 shadow-lg">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                      backgroundColor: getCategoryColor(
                                        data.category,
                                        0
                                      ),
                                    }}
                                  />
                                  <span className="font-medium">
                                    {data.category}
                                  </span>
                                </div>
                                <p className="text-sm font-semibold mt-1">
                                  {formatCurrency(data.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(
                                    (data.amount / totalCategories) *
                                    100
                                  ).toFixed(1)}
                                  % of total
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={categories}
                        nameKey="category"
                        dataKey="amount"
                        innerRadius={65}
                        outerRadius={110}
                        strokeWidth={3}
                        paddingAngle={3}
                        stroke="#ffffff"
                      >
                        {categories.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getCategoryColor(entry.category, index)}
                            className="hover:opacity-80 transition-opacity duration-200"
                          />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        height={60}
                        iconType="circle"
                        wrapperStyle={{
                          paddingTop: "20px",
                          fontSize: "12px",
                        }}
                        formatter={(value, entry) => (
                          <span className="text-xs text-muted-foreground">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Spending:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(totalCategories)}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <PiggyBank className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No spending data
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add transactions to see categories
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              Spending Trends
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {period === "weekly"
                ? "Weekly spending pattern"
                : period === "daily"
                ? "Daily spending pattern"
                : "Monthly spending pattern"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "#8B5CF6",
                  },
                }}
                className="h-[320px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trends}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="amountGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8B5CF6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8B5CF6"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      opacity={0.6}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => formatDateShort(value)}
                      stroke="#64748b"
                      fontSize={12}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${Math.abs(value)}`}
                      stroke="#64748b"
                      fontSize={12}
                      tickMargin={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-4 shadow-lg ring-1 ring-black/5">
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                {formatDateShort(label)}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-[#8B5CF6]" />
                                <span className="text-sm font-medium">
                                  Spending:
                                </span>
                                <span className="text-sm font-bold text-[#8B5CF6]">
                                  {formatCurrency(Math.abs(payload[0].value))}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{
                        fill: "#8B5CF6",
                        strokeWidth: 2,
                        stroke: "#ffffff",
                        r: 5,
                      }}
                      activeDot={{
                        r: 7,
                        stroke: "#8B5CF6",
                        strokeWidth: 2,
                        fill: "#ffffff",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                      }}
                      fill="url(#amountGradient)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[320px] text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No trend data available
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add transactions to see spending trends
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Transactions</h2>
          <AddTransactionDialog mutateKey={txnsKey} />
        </div>
        {txnsLoading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : (
          <TransactionsList
            transactions={filteredTransactions}
            mutateKey={txnsKey}
          />
        )}
      </section>
    </main>
  );
}
