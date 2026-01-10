"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="font-heading text-4xl font-bold text-destructive mb-4">
          Oops!
        </h1>
        <h2 className="font-heading text-xl font-semibold mb-4">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          We apologize for the inconvenience. Please try again or contact
          support if the problem persists.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="gold" onClick={reset}>
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
