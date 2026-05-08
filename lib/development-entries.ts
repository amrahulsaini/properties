import { differenceInCalendarDays } from "date-fns";
import { toNumeric } from "@/lib/format";
import type { GenericRecord } from "@/lib/types";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function asString(value: unknown) {
  return String(value ?? "").trim();
}

function parseTimeToMinutes(value: unknown) {
  const raw = asString(value);
  if (!raw) {
    return 0;
  }

  const [hoursText = "0", minutesText = "0"] = raw.slice(0, 5).split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function parseDateValue(value: unknown) {
  const raw = asString(value);
  if (!raw) {
    return null;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function computeTotalHours(startTime: unknown, stopTime: unknown) {
  const startMinutes = parseTimeToMinutes(startTime);
  const stopMinutes = parseTimeToMinutes(stopTime);

  if (!asString(startTime) || !asString(stopTime)) {
    return 0;
  }

  const diff = stopMinutes >= startMinutes
    ? stopMinutes - startMinutes
    : 24 * 60 - startMinutes + stopMinutes;

  return round2(diff / 60);
}

export function computeTotalDays(startDate: unknown, endDate: unknown) {
  const start = parseDateValue(startDate);
  const end = parseDateValue(endDate);

  if (!start || !end || end < start) {
    return 0;
  }

  return differenceInCalendarDays(end, start) + 1;
}

export function derivePaymentStatus(
  amount: number,
  advancePaid: number,
  currentStatus?: unknown,
) {
  if (amount > 0 && advancePaid >= amount) {
    return "paid";
  }

  if (advancePaid > 0) {
    return "partial";
  }

  const status = asString(currentStatus);
  return status || "pending";
}

export function applyDevelopmentEntryComputedValues(input: GenericRecord): GenericRecord {
  const category = asString(input.category).toLowerCase();
  const rentType = asString(input.rent_type).toLowerCase();
  const amountMode = asString(input.amount_mode).toLowerCase();
  const totalHours = computeTotalHours(input.start_time, input.stop_time);
  const totalDays = computeTotalDays(input.start_date, input.end_date);
  const totalTrips = Math.max(0, Math.trunc(toNumeric(input.total_trips)));
  const ratePerHour = toNumeric(input.rate_per_hour);
  const ratePerDay = toNumeric(input.rate_per_day);
  const ratePerTrip = toNumeric(input.rate_per_trip);
  const advancePaid = toNumeric(input.advance_paid);

  let quantity = toNumeric(input.quantity);
  let rate = toNumeric(input.rate);
  let amount = toNumeric(input.amount);

  if (category === "jcb") {
    quantity = totalHours;
    rate = ratePerHour;
    amount = round2(totalHours * ratePerHour);
  } else if (category === "tractor") {
    if (rentType === "daily") {
      quantity = totalDays;
      rate = ratePerDay;
      amount = round2(totalDays * ratePerDay);
    } else if (rentType === "hourly") {
      quantity = totalHours;
      rate = ratePerHour;
      amount = round2(totalHours * ratePerHour);
    }
  } else if (category === "damper") {
    if (amountMode === "per_trip") {
      quantity = totalTrips;
      rate = ratePerTrip;
      amount = round2(totalTrips * ratePerTrip);
    } else if (amountMode === "per_hour") {
      quantity = totalHours;
      rate = ratePerHour;
      amount = round2(totalHours * ratePerHour);
    } else if (amountMode === "daily") {
      quantity = totalDays;
      rate = ratePerDay;
      amount = round2(totalDays * ratePerDay);
    }
  } else if (!amount) {
    amount = round2(quantity * rate);
  }

  const remainingAmount = round2(amount - advancePaid);

  return {
    ...input,
    total_hours: totalHours,
    total_days: totalDays,
    total_trips: totalTrips,
    quantity,
    rate,
    amount,
    remaining_amount: remainingAmount,
    payment_status: derivePaymentStatus(amount, advancePaid, input.payment_status),
    entry_date: asString(input.entry_date) || new Date().toISOString().slice(0, 10),
    description: asString(input.description) || asString(input.work_description),
  };
}
