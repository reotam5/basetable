package eventbus

import (
	"context"

	"github.com/basetable/basetable/backend/internal/shared/domain"
)

type Subscription struct {
	ID      SubscriptionID
	Handler EventHandler
}

type SubscriptionID string

type EventHandler func(ctx context.Context, event domain.Event) error
