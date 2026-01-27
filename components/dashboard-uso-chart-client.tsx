"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from "recharts";
import { DateRange } from "react-day-picker";
import { useThemeConfig } from "@/components/active-theme";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { apiClient } from "@/helpers/api-client";
import type { GraficoUsoPunto } from "@/interfaces/main-interfaces";

type TimeRange = "90d" | "30d" | "7d" | "today" | "custom";
type Metric = "LOGINS" | "REGISTROS" | "RESERVAS" | "INSCRIPCIONES";
type ChartStyle = "area" | "line" | "bar";

type ChartPoint = {
    date: string;
    value: number;
};

type UsageSeriePoint = {
    fecha: string;
    cantidad: number | null;
};

type UsageSerieResponse = {
    logins: UsageSeriePoint[];
    registros: UsageSeriePoint[];
    reservas: UsageSeriePoint[];
    inscripciones: UsageSeriePoint[];
};

type UsageSerieHourPoint = {
    hora: string;
    cantidad: number | null;
};

type UsageSerieHoursResponse = {
    logins: UsageSerieHourPoint[];
    registros: UsageSerieHourPoint[];
    reservas: UsageSerieHourPoint[];
    inscripciones: UsageSerieHourPoint[];
};

function formatISO(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function parseLocalDate(value: string) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function buildZeroSeriesDays(range: { from: string; to: string } | null): ChartPoint[] {
    if (!range) return [];
    const start = parseLocalDate(range.from);
    const end = parseLocalDate(range.to);
    const data: ChartPoint[] = [];

    for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        data.push({
            date: formatISO(d),
            value: 0,
        });
    }

    return data;
}

function buildZeroSeriesHours(): ChartPoint[] {
    const data: ChartPoint[] = [];
    for (let h = 0; h < 24; h++) {
        const hh = String(h).padStart(2, "0");
        data.push({
            date: `${hh}:00`,
            value: 0,
        });
    }
    return data;
}

function normalizeTheme(value: string | undefined) {
    if (!value) return "default";
    return value.replace("-scaled", "").replace(/^theme-/, "");
}

function getChartThemeFor(metric: Metric, activeTheme: string) {
    const base = normalizeTheme(activeTheme);

    let light = "black";
    let dark = "white";

    if (base === "default") {
        light = "black";
        dark = "white";
    } else if (base === "azul") {
        light = dark = "var(--asur-blue)";
    } else if (base === "amarillo") {
        light = dark = "var(--asur-yellow)";
    } else if (base === "rojo") {
        light = dark = "var(--asur-red)";
    }

    return { light, dark };
}

export function DashboardUsoChartClient() {
    const isMobile = useIsMobile();
    const { data: session } = useSession();
    const { activeTheme } = useThemeConfig();

    const token =
        (session as any)?.userData?.accessToken ||
        (session as any)?.accessToken ||
        "";

    const [timeRange, setTimeRange] = useState<TimeRange>("90d");
    const [metric, setMetric] = useState<Metric>("LOGINS");
    const [chartStyle, setChartStyle] = useState<ChartStyle>("area");
    const [loading, setLoading] = useState(false);
    const [usageSeries, setUsageSeries] = useState<GraficoUsoPunto[]>([]);
    const [calendarRange, setCalendarRange] = useState<DateRange | undefined>();

    const chartConfig: ChartConfig = useMemo(() => {
        const label =
            metric === "LOGINS"
                ? "Logins"
                : metric === "REGISTROS"
                    ? "Registros"
                    : metric === "RESERVAS"
                        ? "Reservas"
                        : "Inscripciones";

        const theme = getChartThemeFor(metric, activeTheme || "default");

        return {
            value: {
                label,
                theme,
            },
        };
    }, [metric, activeTheme]);

    useEffect(() => {
        if (isMobile) {
            setTimeRange("7d");
            setCalendarRange(undefined);
        }
    }, [isMobile]);

    function getDateRange(): { from: string; to: string } | null {
        if (timeRange === "custom") {
            if (calendarRange?.from && calendarRange?.to) {
                return {
                    from: formatISO(calendarRange.from),
                    to: formatISO(calendarRange.to),
                };
            }
            return null;
        }

        const today = new Date();
        const to = formatISO(today);
        const fromDate = new Date(today);

        if (timeRange === "90d") {
            fromDate.setDate(fromDate.getDate() - 90);
        } else if (timeRange === "30d") {
            fromDate.setDate(fromDate.getDate() - 30);
        } else if (timeRange === "7d") {
            fromDate.setDate(fromDate.getDate() - 7);
        }

        const from = formatISO(fromDate);
        return { from, to };
    }

    const isSingleDayRange = useMemo(() => {
        const range = getDateRange();
        return !!range && range.from === range.to;
    }, [timeRange, calendarRange]);

    useEffect(() => {
        if (!token) return;
        if (timeRange === "custom" && (!calendarRange?.from || !calendarRange?.to)) {
            return;
        }

        async function fetchData() {
            const range = getDateRange();
            if (!range) return;

            setLoading(true);
            try {
                if (range.from === range.to) {
                    const params = new URLSearchParams();
                    params.set("fecha", range.from);

                    const raw: UsageSerieHoursResponse = await apiClient(
                        `/graficos/uso-serie-horas?${params.toString()}`,
                        token
                    );

                    const merged = new Map<string, GraficoUsoPunto>();

                    (raw.logins ?? []).forEach((p) => {
                        const key = p.hora.slice(0, 5);
                        merged.set(key, {
                            fecha: key,
                            logins: p.cantidad ?? 0,
                            registros: 0,
                            reservas: 0,
                            inscripciones: 0,
                        });
                    });

                    (raw.registros ?? []).forEach((p) => {
                        const key = p.hora.slice(0, 5);
                        const current =
                            merged.get(key) ?? {
                                fecha: key,
                                logins: 0,
                                registros: 0,
                                reservas: 0,
                                inscripciones: 0,
                            };
                        current.registros = p.cantidad ?? 0;
                        merged.set(key, current);
                    });

                    (raw.reservas ?? []).forEach((p) => {
                        const key = p.hora.slice(0, 5);
                        const current =
                            merged.get(key) ?? {
                                fecha: key,
                                logins: 0,
                                registros: 0,
                                reservas: 0,
                                inscripciones: 0,
                            };
                        current.reservas = p.cantidad ?? 0;
                        merged.set(key, current);
                    });

                    (raw.inscripciones ?? []).forEach((p) => {
                        const key = p.hora.slice(0, 5);
                        const current =
                            merged.get(key) ?? {
                                fecha: key,
                                logins: 0,
                                registros: 0,
                                reservas: 0,
                                inscripciones: 0,
                            };
                        current.inscripciones = p.cantidad ?? 0;
                        merged.set(key, current);
                    });

                    const mergedArray = Array.from(merged.values()).sort((a, b) =>
                        a.fecha.localeCompare(b.fecha)
                    );

                    setUsageSeries(mergedArray);
                } else {
                    const params = new URLSearchParams();
                    params.set("fechaDesde", range.from);
                    params.set("fechaHasta", range.to);

                    const raw: UsageSerieResponse = await apiClient(
                        `/graficos/uso-serie?${params.toString()}`,
                        token
                    );

                    const merged = new Map<string, GraficoUsoPunto>();

                    (raw.logins ?? []).forEach((p) => {
                        const key = p.fecha;
                        merged.set(key, {
                            fecha: key,
                            logins: p.cantidad ?? 0,
                            registros: 0,
                            reservas: 0,
                            inscripciones: 0,
                        });
                    });

                    (raw.registros ?? []).forEach((p) => {
                        const key = p.fecha;
                        const current =
                            merged.get(key) ?? {
                                fecha: key,
                                logins: 0,
                                registros: 0,
                                reservas: 0,
                                inscripciones: 0,
                            };
                        current.registros = p.cantidad ?? 0;
                        merged.set(key, current);
                    });

                    (raw.reservas ?? []).forEach((p) => {
                        const key = p.fecha;
                        const current =
                            merged.get(key) ?? {
                                fecha: key,
                                logins: 0,
                                registros: 0,
                                reservas: 0,
                                inscripciones: 0,
                            };
                        current.reservas = p.cantidad ?? 0;
                        merged.set(key, current);
                    });

                    (raw.inscripciones ?? []).forEach((p) => {
                        const key = p.fecha;
                        const current =
                            merged.get(key) ?? {
                                fecha: key,
                                logins: 0,
                                registros: 0,
                                reservas: 0,
                                inscripciones: 0,
                            };
                        current.inscripciones = p.cantidad ?? 0;
                        merged.set(key, current);
                    });

                    const mergedArray = Array.from(merged.values()).sort((a, b) =>
                        a.fecha.localeCompare(b.fecha)
                    );

                    setUsageSeries(mergedArray);
                }
            } catch (error: any) {
                console.error("Error obteniendo datos de gráficos:", error);
                toast.error(error?.message || "Error obteniendo datos de gráficos.");
                setUsageSeries([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [token, timeRange, calendarRange]);

    const chartData: ChartPoint[] = useMemo(() => {
        return usageSeries.map((p) => ({
            date: p.fecha,
            value:
                metric === "LOGINS"
                    ? p.logins ?? 0
                    : metric === "REGISTROS"
                        ? p.registros ?? 0
                        : metric === "RESERVAS"
                            ? p.reservas ?? 0
                            : p.inscripciones ?? 0,
        }));
    }, [usageSeries, metric]);

    const displayData: ChartPoint[] = useMemo(() => {
        const range = getDateRange();
        if (!range) return chartData;

        if (range.from === range.to) {
            const base = buildZeroSeriesHours();
            if (chartData.length === 0) return base;

            const byHour = new Map(chartData.map((p) => [p.date, p.value]));
            return base.map((p) => ({
                date: p.date,
                value: byHour.get(p.date) ?? 0,
            }));
        }

        const base = buildZeroSeriesDays(range);
        if (chartData.length === 0) return base;

        const byDate = new Map(chartData.map((p) => [p.date, p.value]));
        return base.map((p) => ({
            date: p.date,
            value: byDate.get(p.date) ?? 0,
        }));
    }, [chartData, timeRange, calendarRange]);

    const dateRangeLabel = useMemo(() => {
        const range = getDateRange();
        if (!range) return "Seleccionar fechas";
        return `${range.from} - ${range.to}`;
    }, [timeRange, calendarRange]);

    const cardTitle =
        metric === "LOGINS"
            ? "Logins de usuarios"
            : metric === "REGISTROS"
                ? "Registros de usuarios"
                : metric === "RESERVAS"
                    ? "Reservas de espacios"
                    : "Inscripciones a actividades";

    function handleTimeRangeChange(value: string) {
        if (!value) return;
        const next = value as TimeRange;
        setTimeRange(next);
        if (next !== "custom") {
            setCalendarRange(undefined);
        }
    }

    function handleCalendarSelect(range: DateRange | undefined) {
        setCalendarRange(range);
        setTimeRange("custom");
    }

    const quickRangeValue = timeRange === "custom" ? undefined : timeRange;

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardTitle>{cardTitle}</CardTitle>

                <CardAction className="flex flex-wrap justify-end gap-2 items-center">
                    <ToggleGroup
                        type="single"
                        value={metric}
                        onValueChange={(v) => v && setMetric(v as Metric)}
                        variant="outline"
                        className="flex flex-wrap gap-1 *:data-[slot=toggle-group-item]:min-w-[116px] *:data-[slot=toggle-group-item]:justify-center"
                    >
                        <ToggleGroupItem value="LOGINS">Logins</ToggleGroupItem>
                        <ToggleGroupItem value="REGISTROS">Registros</ToggleGroupItem>
                        <ToggleGroupItem value="RESERVAS">Reservas</ToggleGroupItem>
                        <ToggleGroupItem value="INSCRIPCIONES">
                            Inscripciones
                        </ToggleGroupItem>
                    </ToggleGroup>

                    <ToggleGroup
                        type="single"
                        value={chartStyle}
                        onValueChange={(v) => v && setChartStyle(v as ChartStyle)}
                        variant="outline"
                        className="hidden @[480px]/card:flex"
                    >
                        <ToggleGroupItem value="area">Área</ToggleGroupItem>
                        <ToggleGroupItem value="line">Línea</ToggleGroupItem>
                        <ToggleGroupItem value="bar">Barras</ToggleGroupItem>
                    </ToggleGroup>

                    <ToggleGroup
                        type="single"
                        value={quickRangeValue}
                        onValueChange={handleTimeRangeChange}
                        variant="outline"
                        className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
                    >
                        <ToggleGroupItem value="90d">3 meses</ToggleGroupItem>
                        <ToggleGroupItem value="30d">30 días</ToggleGroupItem>
                        <ToggleGroupItem value="7d">7 días</ToggleGroupItem>
                        <ToggleGroupItem value="today">Hoy</ToggleGroupItem>
                    </ToggleGroup>

                    <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                        <SelectTrigger
                            className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                            size="sm"
                            aria-label="Seleccionar rango"
                        >
                            <SelectValue placeholder="3 meses" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="90d" className="rounded-lg">
                                3 meses
                            </SelectItem>
                            <SelectItem value="30d" className="rounded-lg">
                                30 días
                            </SelectItem>
                            <SelectItem value="7d" className="rounded-lg">
                                7 días
                            </SelectItem>
                            <SelectItem value="today" className="rounded-lg">
                                Hoy
                            </SelectItem>
                            <SelectItem value="custom" className="rounded-lg">
                                Personalizado
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 rounded-xl px-3"
                                onClick={() => setTimeRange("custom")}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                <span className="truncate text-xs">{dateRangeLabel}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-auto p-2">
                            <Calendar
                                mode="range"
                                numberOfMonths={2}
                                selected={calendarRange}
                                onSelect={handleCalendarSelect}
                            />
                        </PopoverContent>
                    </Popover>
                </CardAction>
            </CardHeader>

            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {loading && (
                    <p className="px-2 text-sm text-muted-foreground">
                        Cargando datos...
                    </p>
                )}

                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[260px] w-full"
                >
                    {chartStyle === "area" ? (
                        <AreaChart
                            data={displayData}
                            margin={{ top: 20, right: 16, bottom: 24, left: 0 }}
                        >
                            <defs>
                                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-value)"
                                        stopOpacity={0.9}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-value)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                vertical={false}
                                stroke="hsl(var(--border))"
                                strokeDasharray="3 3"
                            />

                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={12}
                                minTickGap={32}
                                tick={{
                                    fill: "hsl(var(--muted-foreground))",
                                    fontSize: 11,
                                }}
                                tickFormatter={(value) => {
                                    const raw = String(value);
                                    if (isSingleDayRange) {
                                        return raw.slice(0, 5);
                                    }
                                    const date = parseLocalDate(raw);
                                    return date.toLocaleDateString("es-UY", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                }}
                            />

                            <YAxis
                                hide
                                domain={[0, (max: number) => Math.max(1, max * 1.1)]}
                            />

                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => {
                                            const raw = String(value);
                                            if (isSingleDayRange) {
                                                return `Hora ${raw.slice(0, 5)}`;
                                            }
                                            const date = parseLocalDate(raw);
                                            return date.toLocaleDateString("es-UY", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            });
                                        }}
                                        indicator="dot"
                                    />
                                }
                            />

                            <Area
                                dataKey="value"
                                type="monotone"
                                stroke="var(--color-value)"
                                strokeWidth={2}
                                fill="url(#fillValue)"
                                dot={{ r: 2 }}
                                activeDot={{ r: 4 }}
                            />
                        </AreaChart>
                    ) : chartStyle === "line" ? (
                        <LineChart
                            accessibilityLayer
                            data={displayData}
                            margin={{ top: 20, right: 16, bottom: 24, left: 12 }}
                        >
                            <defs>
                                <linearGradient id="fillValueLine" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-value)"
                                        stopOpacity={0.18}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-value)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                vertical={false}
                                stroke="hsl(var(--border))"
                                strokeDasharray="3 3"
                            />

                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                tickFormatter={(value) => {
                                    const raw = String(value);
                                    if (isSingleDayRange) {
                                        return raw.slice(0, 5);
                                    }
                                    const date = parseLocalDate(raw);
                                    return date.toLocaleDateString("es-UY", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                }}
                            />

                            <YAxis
                                hide
                                domain={[0, (max: number) => Math.max(1, max * 1.1)]}
                            />

                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        hideLabel={false}
                                        labelFormatter={(value) => {
                                            const raw = String(value);
                                            if (isSingleDayRange) {
                                                return `Hora ${raw.slice(0, 5)}`;
                                            }
                                            const date = parseLocalDate(raw);
                                            return date.toLocaleDateString("es-UY", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            });
                                        }}
                                        indicator="dot"
                                    />
                                }
                            />

                            <Area
                                dataKey="value"
                                type="monotone"
                                fill="url(#fillValueLine)"
                                stroke="none"
                            />

                            <Line
                                dataKey="value"
                                type="linear"
                                stroke="var(--color-value)"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    ) : (
                        <BarChart
                            accessibilityLayer
                            data={displayData}
                            margin={{ top: 20, right: 16, bottom: 24, left: 12 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                stroke="hsl(var(--border))"
                                strokeDasharray="3 3"
                            />

                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                                tickFormatter={(value) => {
                                    const raw = String(value);
                                    if (isSingleDayRange) {
                                        return raw.slice(0, 5);
                                    }
                                    const date = parseLocalDate(raw);
                                    return date.toLocaleDateString("es-UY", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                }}
                            />

                            <YAxis
                                hide
                                domain={[0, (max: number) => Math.max(1, max * 1.1)]}
                            />

                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        hideLabel={false}
                                        labelFormatter={(value) => {
                                            const raw = String(value);
                                            if (isSingleDayRange) {
                                                return `Hora ${raw.slice(0, 5)}`;
                                            }
                                            const date = parseLocalDate(raw);
                                            return date.toLocaleDateString("es-UY", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            });
                                        }}
                                        indicator="dot"
                                    />
                                }
                            />

                            <Bar
                                dataKey="value"
                                fill="var(--color-value)"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    )}
                </ChartContainer>

                {!loading && usageSeries.length === 0 && (
                    <p className="mt-2 px-2 text-xs text-muted-foreground">
                        No hay datos para el rango seleccionado. Se muestra una línea en 0.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
