const Action = require('../../creates/schedule_calendar_time');

describe('Schedule Calendar Time Action', () => {
  it('should expose the booking and blocked event types', () => {
    const eventTypeField = Action.operation.inputFields.find((field) => field.key === 'eventType');

    expect(eventTypeField).toBeDefined();
    expect(eventTypeField.choices).toEqual({
      booking: 'Booking',
      blocked: 'Blocked Time',
    });
  });

  it('should send the scheduling payload to the Zapier action endpoint', async () => {
    const result = await Action.operation.perform({
      request: async (request) => ({
        data: {
          id: 'booking_99',
          type: request.body.eventType,
          title: request.body.title,
          calendarEventId: 99,
          availabilitySlotId: 44,
        },
      }),
    }, {
      authData: {
        server_url: 'https://test-server.com',
        api_key: 'test-key',
      },
      inputData: {
        eventType: 'booking',
        date: '2026-04-06',
        startTime: '09:00',
        endTime: '11:00',
        title: 'Pressure Washing - Jane Doe',
      },
    });

    expect(result).toEqual({
      id: 'booking_99',
      type: 'booking',
      title: 'Pressure Washing - Jane Doe',
      calendarEventId: 99,
      availabilitySlotId: 44,
    });
  });
});
