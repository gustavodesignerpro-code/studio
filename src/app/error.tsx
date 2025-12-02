"use client"; 

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

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
    <div className="flex h-svh w-svh flex-col items-center justify-center bg-background text-destructive p-8 text-center">
      <AlertTriangle className="h-20 w-20" />
      <h2 className="mt-6 text-4xl font-bold">Ocorreu um erro</h2>
      <p className="mt-2 text-lg text-destructive/80">
        Não foi possível carregar a aplicação.
      </p>
      <Button
        onClick={() => reset()}
        variant="destructive"
        className="mt-8"
      >
        Tentar Novamente
      </Button>
    </div>
  );
}
