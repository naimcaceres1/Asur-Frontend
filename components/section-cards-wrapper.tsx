// components/section-cards-wrapper.tsx
import { SectionCards } from "@/components/section-cards";
import { SectionCardsSkeleton } from "@/components/section-cards-skeleton";
import { Suspense } from "react";


type UserRole = "Administrador" | "Auxiliar administrativo" | "Socio" | "No Socio";

interface SectionCardsWrapperProps {
  role: UserRole;
}
export function SectionCardsWrapper({ role }: SectionCardsWrapperProps) {
  return (
    <Suspense fallback={<SectionCardsSkeleton />}>
      <SectionCards role={role} />
    </Suspense>
  );
}