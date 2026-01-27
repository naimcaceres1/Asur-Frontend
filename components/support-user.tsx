"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { guides, type Guide } from "@/lib/drive/guides.config";
import { Loader2 } from "lucide-react";

type SupportGuidesProps = {
  userRole?: string;
};

export function SupportGuides({ userRole }: SupportGuidesProps) {
  const router = useRouter();
  const [loadingGuide, setLoadingGuide] = useState<string | null>(null);

  useEffect(() => {
    const styleId = "driver-custom-styles-asur";

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;

    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Filtrar las guías según el rol del usuario
  const filteredGuides = guides.filter((guide) => {
    // Si no hay rol definido (usuario no logueado), mostrar solo login y registro
    if (!userRole) {
      return guide.url === "/auth/login" || guide.url === "/auth/new-account";
    }

    // Normalizar el rol a mayúsculas para comparar
    const normalizedRole = userRole.toUpperCase().trim();

    const esSocio = normalizedRole.includes("SOCIO");

    // Si es SOCIO o NO_SOCIO, mostrar todas las guías
    if (esSocio) {
      return guide.url !== "/auth/login" && guide.url !== "/auth/new-account";
    }
    // Para otros roles (admin, auxiliar, etc.), mostrar solo login y registro
    return guide.url === "/auth/login" || guide.url === "/auth/new-account";
  });

  const startGuide = (guide: Guide) => {
    const currentPath = window.location.pathname;

    if (currentPath === guide.url) {
      initializeGuide(guide);
      return;
    }

    setLoadingGuide(guide.title);
    sessionStorage.setItem("pendingGuide", JSON.stringify(guide));
    router.push(guide.url);
  };

  const initializeGuide = (guide: Guide) => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: guide.steps,
      nextBtnText: "Siguiente",
      prevBtnText: "Anterior",
      doneBtnText: "Finalizar",
      progressText: "{{current}} de {{total}}",
      onDestroyStarted: () => {
        driverObj.destroy();
        setLoadingGuide(null);
      },
    });

    driverObj.drive();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {filteredGuides.map((guide, index) => {
        const Icon = guide.icon;
        const isLoading = loadingGuide === guide.title;

        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-xl">{guide.title}</CardTitle>
              <CardDescription>{guide.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => startGuide(guide)}
                className="w-full"
                variant="default"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  "Iniciar guía"
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
