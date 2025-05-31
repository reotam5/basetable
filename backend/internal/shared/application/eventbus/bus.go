package eventbus

import (
	"context"
	"time"
)

type EventBus interface {
	Publish(ctx context.Context, event Event) error
	PublishAsync(event Event)
	PublishAsyncWithTimeout(event Event, timeout time.Duration)
	Subscribe(eventType EventType, handler EventHandler) (SubscriptionID, error)
	Unsubscribe(subscriptionID SubscriptionID) error
	Close() error
}
