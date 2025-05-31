package eventbus

import "time"

type Event struct {
	Type      EventType
	Payload   any
	Timestamp time.Time
}

type EventType string

func NewEvent(eventType EventType, payload any) Event {
	return Event{
		Type:      eventType,
		Payload:   payload,
		Timestamp: time.Now(),
	}
}
