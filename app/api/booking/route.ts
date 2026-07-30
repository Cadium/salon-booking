import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_FIELDS = ["name", "email", "service", "date", "time"];

export async function POST(request: Request) {
  const gasUrl =
    process.env.GAS_WEB_APP_URL ?? process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;

  if (!gasUrl) {
    console.error("Booking endpoint is missing its Google Apps Script URL.");
    return NextResponse.json({ error: "Booking is unavailable." }, { status: 503 });
  }

  const formData = await request.formData();
  const params = new URLSearchParams();

  for (const field of REQUIRED_FIELDS) {
    const value = formData.get(field);
    if (typeof value !== "string" || !value.trim()) {
      return NextResponse.json({ error: "Missing booking details." }, { status: 400 });
    }
  }

  for (const field of ["name", "email", "phone", "service", "date", "time", "notes"]) {
    const value = formData.get(field);
    if (typeof value === "string") params.set(field, value.trim());
  }

  try {
    const response = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      cache: "no-store",
    });
    const result = (await response.text()).trim();

    if (!response.ok || result !== "OK") {
      console.error("Google Apps Script rejected a booking request.", {
        status: response.status,
        result,
      });
      return NextResponse.json(
        { error: "Booking could not be processed." },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Google Apps Script could not be reached.", error);
    return NextResponse.json(
      { error: "Booking could not be processed." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
