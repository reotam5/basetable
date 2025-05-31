package repository

import (
	"context"

	"github.com/basetable/basetable/backend/internal/billing/domain/reservation"
)

type ReservationRepository interface {
	Save(ctx context.Context, creditReservation *reservation.Reservation) error
	GetByID(ctx context.Context, id string) (*reservation.Reservation, error)
	GetByIDForUpdate(ctx context.Context, id string) (*reservation.Reservation, error)
}
