package authcontext

import (
	"context"
)

type authContextKey string

const accountIDKey authContextKey = "accountID"

func WithAccountID(ctx context.Context, accountID string) context.Context {
	return context.WithValue(ctx, accountIDKey, accountID)
}

func GetAccountID(ctx context.Context) string {
	accountID, ok := ctx.Value(accountIDKey).(string)
	if !ok {
		// accountID should be set in the context by the auth middleware
		// if it's not set, it's a programming bug
		panic("accountID not found in context")
	}
	return accountID
}
