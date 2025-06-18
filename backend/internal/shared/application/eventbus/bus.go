package eventbus

import (
	"context"
	"time"

	"github.com/basetable/basetable/backend/internal/shared/domain"
)

type EventBus interface {
	Publish(ctx context.Context, event domain.Event) error
	PublishAsync(event domain.Event)
	PublishAsyncWithTimeout(event domain.Event, timeout time.Duration)
	Subscribe(eventType domain.EventType, handler EventHandler) (SubscriptionID, error)
	Unsubscribe(subscriptionID SubscriptionID) error
	Close() error
}
