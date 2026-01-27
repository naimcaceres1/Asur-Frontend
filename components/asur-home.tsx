"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type AsurNewsItem = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  extraInfo?: string;
};

type Props = {
  items: AsurNewsItem[];
};

export function AsurNewsGrid({ items }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = items.find((i) => i.id === openId) ?? null;

  const handleKeyOpen = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpenId(id);
    }
  };

  return (
    <>
      {/* GRID DE TARJETAS */}
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer overflow-hidden outline-none transition hover:ring-2 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-primary/80"
            role="button"
            tabIndex={0}
            onClick={() => setOpenId(item.id)}
            onKeyDown={(e) => handleKeyOpen(e, item.id)}
            aria-label={`Ver detalle de: ${item.title}`}
          >
            <div className="relative h-40 w-full">
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>

            <CardHeader className="pb-1">
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>

            <CardContent className="pb-4">
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-2 text-xs text-primary/80">
                Hacé clic o presioná Enter para ver el afiche completo.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL / LIGHTBOX */}
      <Dialog
        open={!!openItem}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      >
        {openItem && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{openItem.title}</DialogTitle>
              <DialogDescription>
                {openItem.description}
                {openItem.extraInfo ? (
                  <>
                    <br />
                    <span>{openItem.extraInfo}</span>
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <div className="relative w-full max-h-[70vh]">
                <div className="relative w-full aspect-[3/4] md:aspect-[4/3]">
                  <Image
                    src={openItem.imageSrc}
                    alt={openItem.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="rounded-md object-contain"
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
