import { redirect } from "next/navigation";

type PageProps = {
    params: { id: string };
};

export default function ActivitiesEnrollByIdPage({ params }: PageProps) {
    const idActividad = Number(params.id);

    if (Number.isNaN(idActividad)) {
        redirect("/dashboard/activities/enroll");
    }

    redirect(`/dashboard/activities/enroll?id=${idActividad}`);
}
