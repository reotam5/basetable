package eventbus

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"

	eb "github.com/basetable/basetable/backend/shared/application/eventbus"
	"github.com/basetable/basetable/backend/shared/application/log"
)

type InMemoryBusConfig struct {
	AsyncTimeout       time.Duration
	MaxAsyncQueueSize  int
	MaxRetries         int
	RetryDelay         time.Duration
	RetryBackoffFactor float64
	WorkerPoolSize     int
}

type InMemoryBus struct {
	mu                 sync.RWMutex
	subscribers        map[eb.EventType][]*eb.Subscription
	asyncQueue         chan eb.Event
	asyncTimeout       time.Duration
	maxRetries         int
	retryDelay         time.Duration
	retryBackoffFactor float64
	workerPoolSize     int
	ctx                context.Context
	cancel             context.CancelFunc
	wg                 sync.WaitGroup
	closed             bool
	logger             log.Logger
}

var _ eb.EventBus = (*InMemoryBus)(nil)

const (
	DefaultAsyncTimeout       = 5 * time.Second
	DefaultMaxAsyncQueueSize  = 1000
	DefaultMaxRetries         = 3
	DefaultRetryDelay         = time.Second
	DefaultRetryBackoffFactor = 2.0
	DefaultWorkerPoolSize     = 10
)

func NewInMemoryBus(ctx context.Context, cfg InMemoryBusConfig) *InMemoryBus {
	if ctx == nil {
		ctx = context.Background()
	}
	ctx, cancel := context.WithCancel(ctx)

	queueSize := cfg.MaxAsyncQueueSize
	if queueSize <= 0 {
		queueSize = DefaultMaxAsyncQueueSize
	}

	if cfg.AsyncTimeout <= 0 {
		cfg.AsyncTimeout = DefaultAsyncTimeout
	}

	if cfg.MaxRetries < 0 {
		cfg.MaxRetries = DefaultMaxRetries
	}

	if cfg.RetryDelay <= 0 {
		cfg.RetryDelay = DefaultRetryDelay
	}

	if cfg.RetryBackoffFactor <= 1.0 {
		cfg.RetryBackoffFactor = DefaultRetryBackoffFactor
	}

	if cfg.WorkerPoolSize <= 0 {
		cfg.WorkerPoolSize = DefaultWorkerPoolSize
	}

	bus := &InMemoryBus{
		subscribers:        make(map[eb.EventType][]*eb.Subscription),
		asyncQueue:         make(chan eb.Event, queueSize),
		asyncTimeout:       cfg.AsyncTimeout,
		maxRetries:         cfg.MaxRetries,
		retryDelay:         cfg.RetryDelay,
		retryBackoffFactor: cfg.RetryBackoffFactor,
		workerPoolSize:     cfg.WorkerPoolSize,
		ctx:                ctx,
		cancel:             cancel,
	}

	// Start worker pool for async processing
	for _ = range bus.workerPoolSize {
		bus.wg.Add(1)
		go bus.startWorker()
	}

	return bus
}

func (b *InMemoryBus) Publish(event eb.Event) error {
	b.mu.RLock()
	if b.closed {
		b.mu.RUnlock()
		return fmt.Errorf("event bus is closed")
	}

	handlers, ok := b.subscribers[event.Type]
	if !ok {
		b.mu.RUnlock()
		return nil // No subscribers for this event type
	}

	// Create a copy of subscriptions to avoid holding the lock during execution
	subscriptionsCopy := make([]*eb.Subscription, len(handlers))
	copy(subscriptionsCopy, handlers)
	b.mu.RUnlock()

	var errors []error
	for _, sub := range subscriptionsCopy {
		if sub == nil || sub.Handler == nil {
			continue
		}

		if err := sub.Handler(event); err != nil {
			errors = append(errors, fmt.Errorf("handler %s failed: %w", sub.ID, err))
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("event publishing failed with %d errors: %v", len(errors), errors)
	}

	return nil
}

func (b *InMemoryBus) PublishAsync(event eb.Event) {
	b.publishAsyncWithTimeout(event, b.asyncTimeout)
}

func (b *InMemoryBus) PublishAsyncWithTimeout(event eb.Event, timeout time.Duration) {
	b.publishAsyncWithTimeout(event, timeout)
}

func (b *InMemoryBus) publishAsyncWithTimeout(event eb.Event, timeout time.Duration) {
	b.mu.RLock()
	if b.closed {
		b.mu.RUnlock()
		return
	}
	b.mu.RUnlock()

	select {
	case b.asyncQueue <- event:
		// Event queued successfully
	case <-time.After(timeout):
		// Queue is full, drop the event (could also block or return error)
	case <-b.ctx.Done():
		// Context cancelled
		return
	}
}

func (b *InMemoryBus) Subscribe(eventType eb.EventType, handler eb.EventHandler) (eb.SubscriptionID, error) {
	if eventType == "" {
		return "", fmt.Errorf("eventType cannot be empty")
	}

	if handler == nil {
		return "", fmt.Errorf("handler cannot be nil")
	}

	b.mu.Lock()
	defer b.mu.Unlock()

	if b.closed {
		return "", fmt.Errorf("event bus is closed")
	}

	subscriptionID := eb.SubscriptionID(uuid.NewString())
	sub := &eb.Subscription{
		ID:      subscriptionID,
		Handler: handler,
	}

	if b.subscribers[eventType] == nil {
		b.subscribers[eventType] = make([]*eb.Subscription, 0)
	}

	b.subscribers[eventType] = append(b.subscribers[eventType], sub)
	return subscriptionID, nil
}

func (b *InMemoryBus) Unsubscribe(subscriptionID eb.SubscriptionID) error {
	if subscriptionID == "" {
		return fmt.Errorf("subscriptionID cannot be empty")
	}

	b.mu.Lock()
	defer b.mu.Unlock()

	if b.closed {
		return fmt.Errorf("event bus is closed")
	}

	for eventType, subs := range b.subscribers {
		for i, sub := range subs {
			if sub.ID == subscriptionID {
				b.subscribers[eventType][i] = b.subscribers[eventType][len(subs)-1]
				b.subscribers[eventType] = b.subscribers[eventType][:len(subs)-1]

				// Clean up empty slices
				if len(b.subscribers[eventType]) == 0 {
					delete(b.subscribers, eventType)
				}

				return nil
			}
		}
	}

	return fmt.Errorf("subscription with ID %s not found", subscriptionID)
}

func (b *InMemoryBus) Close() error {
	b.mu.Lock()
	if b.closed {
		b.mu.Unlock()
		return fmt.Errorf("event bus is already closed")
	}
	b.closed = true
	b.mu.Unlock()

	// Cancel context to stop async processor
	b.cancel()
	close(b.asyncQueue)

	// Wait for async processor to finish
	b.wg.Wait()
	b.mu.Lock()
	b.subscribers = make(map[eb.EventType][]*eb.Subscription)
	b.mu.Unlock()

	return nil
}

func (b *InMemoryBus) startWorker() {
	defer b.wg.Done()

	for {
		select {
		case event, ok := <-b.asyncQueue:
			if !ok {
				// Channel closed, stop processing
				return
			}

			b.publishWithRetry(event)

		case <-b.ctx.Done():
			// Context cancelled, drain remaining events and stop
			for {
				select {
				case event := <-b.asyncQueue:
					b.publishWithRetry(event)
				default:
					return
				}
			}
		}
	}
}

func (b *InMemoryBus) publishWithRetry(event eb.Event) {
	maxRetries, retryDelay, backoffFactor := b.maxRetries, b.retryDelay, b.retryBackoffFactor
	currentDelay := retryDelay
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if err := b.Publish(event); err != nil {
			if attempt == maxRetries {
				b.logger.Errorf("Failed to publish event %s after %d attempts: %v", event.Type, maxRetries, err)
				// Send to a DLQ
				return
			}

			// Wait before retry with exponential backoff
			select {
			case <-time.After(currentDelay):
				currentDelay = time.Duration(float64(currentDelay) * backoffFactor)
			case <-b.ctx.Done():
				return
			}
		} else {
			return
		}
	}
}
