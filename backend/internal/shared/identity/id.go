package identity

type ID[T any] struct {
	value string
}

func NewID[T any]() ID[T] {
	return ID[T]{GenerateID()}
}

func HydrateID[T any](value string) ID[T] {
	return ID[T]{value}
}

func (id ID[T]) String() string {
	return id.value
}

func (id ID[T]) Equals(other ID[T]) bool {
	return id.value == other.value
}
