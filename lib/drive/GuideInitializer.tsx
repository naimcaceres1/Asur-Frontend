"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import type { Guide } from "@/lib/drive/guides.config";

export function GuideInitializer() {
  // Estilos minimalistas - solo cambiar colores ASUR
  useEffect(() => {
    const styleId = "driver-custom-styles-asur";

    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
       /* POPOVER - MODO CLARO */
        .driver-popover {
          background-color: white !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
          border-radius: 8px !important;
          color: #1e293b !important;
        }

        /* POPOVER - MODO OSCURO - MÁS CLARO */
        .dark .driver-popover {
          background-color: #475569 !important; /* Más claro que #334155 */
          border: 1px solid #64748b !important;
          color: #f8fafc !important; /* Texto más blanco */
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
        }

        /* TÍTULO - MODO CLARO */
        .driver-popover-title {
          color: hsl(238.06, 43.26%, 42.16%) !important;
          font-weight: 600 !important;
          font-size: 1.1rem !important;
        }

        /* TÍTULO - MODO OSCURO - MÁS CONTRASTE */
        .dark .driver-popover-title {
          color: #60a5fa !important; /* Azul más brillante */
          font-weight: 700 !important;
        }

        /* DESCRIPCIÓN - MODO CLARO */
        .driver-popover-description {
          color: #475569 !important;
          line-height: 1.5 !important;
        }

        /* DESCRIPCIÓN - MODO OSCURO - MÁS CONTRASTE */
        .dark .driver-popover-description {
          color: #e2e8f0 !important; /* Más claro */
          line-height: 1.5 !important;
        }

        /* BOTÓN SIGUIENTE/FINALIZAR */
        .driver-popover-next-btn {
          background-color: hsl(238.06, 43.26%, 42.16%) !important;
          border-color: hsl(238.06, 43.26%, 42.16%) !important;
          color: white !important;
          font-weight: 500 !important;
          border-radius: 6px !important;
        }

        .driver-popover-next-btn:hover {
          background-color: hsl(238.06, 43.26%, 35%) !important;
          border-color: hsl(238.06, 43.26%, 35%) !important;
        }

        /* BOTÓN ANTERIOR - MODO CLARO */
        .driver-popover-prev-btn {
          color: #64748b !important;
          border-color: #cbd5e1 !important;
          font-weight: 500 !important;
          border-radius: 6px !important;
          background-color: white !important;
        }

        .driver-popover-prev-btn:hover {
          background-color: #f8fafc !important;
          color: #475569 !important;
        }

        /* BOTÓN ANTERIOR - MODO OSCURO - MÁS CONTRASTE */
        .dark .driver-popover-prev-btn {
          color: #cbd5e1 !important; /* Más claro */
          border-color: #64748b !important;
          background-color: #475569 !important;
        }

        .dark .driver-popover-prev-btn:hover {
          background-color: #5a6b82 !important; /* Más claro al hover */
          color: #f1f5f9 !important;
        }

        /* BOTÓN CERRAR - MODO CLARO */
        .driver-popover-close-btn {
          color: #64748b !important;
          font-size: 20px !important;
          font-weight: bold !important;
        }

        .driver-popover-close-btn:hover {
          color: #dc2626 !important;
          background-color: transparent !important;
        }

        /* BOTÓN CERRAR - MODO OSCURO - MÁS VISIBLE */
        .dark .driver-popover-close-btn {
          color: #e2e8f0 !important; /* Mucho más claro */
          font-size: 22px !important;
          font-weight: bold !important;
        }

        .dark .driver-popover-close-btn:hover {
          color: #f87171 !important;
          background-color: rgba(248, 113, 113, 0.1) !important;
        }

  /* ELEMENTO RESALTADO - MÁS VISIBLE EN AMBOS MODOS */
  .driver-active-element {
    outline: 3px solid hsl(238.06, 43.26%, 42.16%) !important;
    outline-offset: 3px !important;
    border-radius: 4px !important;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
  }

  .dark .driver-active-element {
    outline: 3px solid #60a5fa !important; /* Azul más brillante en dark */
    outline-offset: 3px !important;
    border-radius: 4px !important;
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3) !important;
  }

  /* TEXTO DE PROGRESO */
  .driver-popover-progress-text {
    color: hsl(238.06, 43.26%, 42.16%) !important;
    font-weight: 600 !important;
    font-size: 0.9rem !important;
  }

  .dark .driver-popover-progress-text {
    color: #60a5fa !important; /* Azul más brillante */
    font-weight: 700 !important;
  }

  /* OVERLAY - MODO CLARO (mantener igual) */
  .driver-overlay {
    background-color: rgba(0, 0, 0, 0.5) !important;
  }

  /* OVERLAY - MODO OSCURO - MÁS TRANSPARENTE */
  .dark .driver-overlay {
    background-color: rgba(255, 255, 255, 0.5) !important; /* Blanco muy transparente */
  }

  /* MEJORAS ADICIONALES PARA CONTRASTE */
  
  /* Flechas del popover */
  .driver-popover-arrow {
    border-color: #475569 !important;
  }

  .dark .driver-popover-arrow {
    border-color: #64748b !important;
  }

  /* Mejorar la visibilidad del texto en general */
  .driver-popover * {
    text-shadow: none !important;
  }

  /* Asegurar que los inputs se vean bien cuando están resaltados */
  .driver-active-element input,
  .driver-active-element select,
  .driver-active-element textarea {
    background-color: transparent !important;
    color: inherit !important;
  }
    `;

    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const pendingGuideData = sessionStorage.getItem("pendingGuide");

      if (pendingGuideData) {
        try {
          const guide: Guide = JSON.parse(pendingGuideData);
          sessionStorage.removeItem("pendingGuide");

          if (window.location.pathname === guide.url) {
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
              },
            });

            driverObj.drive();
          }
        } catch (error) {
          console.error("Error al iniciar la guía:", error);
          sessionStorage.removeItem("pendingGuide");
        }
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
