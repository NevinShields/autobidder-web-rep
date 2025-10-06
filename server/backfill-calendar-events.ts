import { db } from "./db";
import { availabilitySlots, blockedDates, calendarEvents } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function backfillCalendarEvents() {
  console.log("Starting calendar events backfill...");
  
  try {
    // 1. Migrate availability slots (bookings) to calendar events
    console.log("Migrating availability slots...");
    const slots = await db.select().from(availabilitySlots);
    
    for (const slot of slots) {
      // Only migrate booked slots (actual appointments)
      if (slot.isBooked && slot.bookedBy) {
        const startsAt = new Date(`${slot.date}T${slot.startTime}:00`);
        const endsAt = new Date(`${slot.date}T${slot.endTime}:00`);
        
        await db.insert(calendarEvents).values({
          userId: slot.userId,
          type: "booking",
          source: "internal",
          startsAt,
          endsAt,
          status: "confirmed",
          title: slot.title || "Booking",
          description: slot.notes || undefined,
          payload: {
            booking: {
              leadId: slot.bookedBy,
              serviceDetails: slot.notes || undefined
            }
          },
          isEditable: true,
          leadId: slot.bookedBy
        }).onConflictDoNothing();
      }
    }
    console.log(`Migrated ${slots.filter(s => s.isBooked).length} bookings`);
    
    // 2. Migrate blocked dates to calendar events
    console.log("Migrating blocked dates...");
    const blockedDatesData = await db.select().from(blockedDates);
    
    for (const blocked of blockedDatesData) {
      // Convert date strings to timestamps
      // If it's a multi-day block, create a single event spanning the range
      const startsAt = new Date(`${blocked.startDate}T00:00:00`);
      const endsAt = new Date(`${blocked.endDate}T23:59:59`);
      
      await db.insert(calendarEvents).values({
        userId: blocked.userId,
        type: "blocked",
        source: "internal",
        startsAt,
        endsAt,
        status: "confirmed",
        title: "Blocked",
        description: blocked.reason || undefined,
        payload: {
          blocked: {
            reason: blocked.reason || undefined
          }
        },
        isEditable: true,
        leadId: null
      }).onConflictDoNothing();
    }
    console.log(`Migrated ${blockedDatesData.length} blocked date ranges`);
    
    console.log("Calendar events backfill completed successfully!");
    return {
      success: true,
      bookingsMigrated: slots.filter(s => s.isBooked).length,
      blockedDatesMigrated: blockedDatesData.length
    };
  } catch (error) {
    console.error("Error during backfill:", error);
    throw error;
  }
}

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  backfillCalendarEvents()
    .then((result) => {
      console.log("Backfill complete:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Backfill failed:", error);
      process.exit(1);
    });
}
