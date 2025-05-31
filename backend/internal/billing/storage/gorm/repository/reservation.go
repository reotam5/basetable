package repository

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	"github.com/basetable/basetable/backend/internal/billing/domain/reservation"
	"github.com/basetable/basetable/backend/internal/billing/storage/gorm/model"
)

type ReservationRepository struct {
	db *gorm.DB
}

var _ repository.ReservationRepository = (*ReservationRepository)(nil)

func NewReservationRepository(db *gorm.DB) *ReservationRepository {
	return &ReservationRepository{db: db}
}

func (r *ReservationRepository) Save(ctx context.Context, reservation *reservation.Reservation) error {
	return r.db.WithContext(ctx).Save(r.MapDomainToModel(reservation)).Error
}

func (r *ReservationRepository) GetByID(ctx context.Context, id string) (*reservation.Reservation, error) {
	reservationModel := &model.ReservationModel{}
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(reservationModel).Error; err != nil {
		return nil, err
	}
	return reservationModel.MapToDomain(), nil
}

func (r *ReservationRepository) GetByIDForUpdate(ctx context.Context, id string) (*reservation.Reservation, error) {
	reservationModel := &model.ReservationModel{}
	if err := r.db.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", id).First(reservationModel).Error; err != nil {
		return nil, err
	}
	return reservationModel.MapToDomain(), nil
}

func (r *ReservationRepository) MapDomainToModel(reservation *reservation.Reservation) *model.ReservationModel {
	return &model.ReservationModel{
		ID:        reservation.ID().String(),
		AccountID: reservation.AccountID().String(),
		UserID:    reservation.UserID(),
		Amount:    reservation.Amount().Value(),
		Status:    reservation.Status().String(),
		CreatedAt: reservation.CreatedAt(),
		UpdatedAt: reservation.UpdatedAt(),
	}
}
