package eventbus

import "context"

type Subscription struct {
	ID      SubscriptionID
	Handler EventHandler
}

type SubscriptionID string

type EventHandler func(ctx context.Context, event Event) error
