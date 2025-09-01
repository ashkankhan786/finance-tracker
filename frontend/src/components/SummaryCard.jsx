import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function SummaryCard({ title, value, icon, tone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span
            className={`text-2xl font-semibold ${
              tone === "positive"
                ? "text-primary"
                : tone === "negative"
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {value}
          </span>
          <span className="rounded-full bg-muted/10 p-2">{icon}</span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default SummaryCard;
