import { Filter } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

function FiltersBar({ value, onChange }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs
            value={value.period}
            onValueChange={(v) => onChange({ period: v })}
            className="w-full md:w-auto"
          >
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex w-full items-center gap-2 md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={value.category ?? "all"}
              onValueChange={(v) =>
                onChange({ category: v === "all" ? null : v })
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
                <SelectItem value="Bills">Bills</SelectItem>
                <SelectItem value="Entertainment">Entertainment</SelectItem>
                <SelectItem value="Salary">Salary</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="w-full md:w-64"
              placeholder="Search transactions"
              value={value.q}
              onChange={(e) => onChange({ q: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FiltersBar;
