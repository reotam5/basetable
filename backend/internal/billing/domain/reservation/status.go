package reservation

type Status struct {
	value string
}

var (
	StatusPending  = Status{"PENDING"}
	StatusCommited = Status{"COMMITED"}
	StatusReleased = Status{"RELEASED"}
)

func (s Status) IsFinal() bool {
	return s.IsCommitted() || s.IsReleased()
}

func (s Status) IsPending() bool {
	return s == StatusPending
}

func (s Status) IsCommitted() bool {
	return s == StatusCommited
}

func (s Status) IsReleased() bool {
	return s == StatusReleased
}

func (s Status) Equals(other Status) bool {
	return s.value == other.value
}

func (s Status) String() string {
	return s.value
}
