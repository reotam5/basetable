package eventbus

type Subscription struct {
	ID      SubscriptionID
	Handler EventHandler
}

type SubscriptionID string

type EventHandler func(event Event) error
