package reservation

import "testing"

func TestStatusValues(t *testing.T) {
	tests := []struct {
		name     string
		status   Status
		expected string
	}{
		{"Pending status", StatusPending, "PENDING"},
		{"Committed status", StatusCommited, "COMMITED"},
		{"Released status", StatusReleased, "RELEASED"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.status.String() != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, tt.status.String())
			}
		})
	}
}

func TestStatusIsFinal(t *testing.T) {
	tests := []struct {
		name     string
		status   Status
		expected bool
	}{
		{"Pending is not final", StatusPending, false},
		{"Committed is final", StatusCommited, true},
		{"Released is final", StatusReleased, true},
		{"Custom status is not final", Status{"CUSTOM"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsFinal()
			if result != tt.expected {
				t.Errorf("Expected IsFinal() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestStatusIsPending(t *testing.T) {
	tests := []struct {
		name     string
		status   Status
		expected bool
	}{
		{"Pending status", StatusPending, true},
		{"Committed status", StatusCommited, false},
		{"Released status", StatusReleased, false},
		{"Custom status", Status{"CUSTOM"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsPending()
			if result != tt.expected {
				t.Errorf("Expected IsPending() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestStatusIsCommitted(t *testing.T) {
	tests := []struct {
		name     string
		status   Status
		expected bool
	}{
		{"Pending status", StatusPending, false},
		{"Committed status", StatusCommited, true},
		{"Released status", StatusReleased, false},
		{"Custom status", Status{"CUSTOM"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsCommitted()
			if result != tt.expected {
				t.Errorf("Expected IsCommitted() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestStatusIsReleased(t *testing.T) {
	tests := []struct {
		name     string
		status   Status
		expected bool
	}{
		{"Pending status", StatusPending, false},
		{"Committed status", StatusCommited, false},
		{"Released status", StatusReleased, true},
		{"Custom status", Status{"CUSTOM"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsReleased()
			if result != tt.expected {
				t.Errorf("Expected IsReleased() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestStatusEquals(t *testing.T) {
	tests := []struct {
		name     string
		status1  Status
		status2  Status
		expected bool
	}{
		{"Same pending statuses", StatusPending, StatusPending, true},
		{"Same committed statuses", StatusCommited, StatusCommited, true},
		{"Same released statuses", StatusReleased, StatusReleased, true},
		{"Different statuses", StatusPending, StatusCommited, false},
		{"Pending vs Released", StatusPending, StatusReleased, false},
		{"Committed vs Released", StatusCommited, StatusReleased, false},
		{"Custom statuses same", Status{"CUSTOM"}, Status{"CUSTOM"}, true},
		{"Custom statuses different", Status{"CUSTOM1"}, Status{"CUSTOM2"}, false},
		{"Custom vs standard", Status{"CUSTOM"}, StatusPending, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status1.Equals(tt.status2)
			if result != tt.expected {
				t.Errorf("Expected Equals() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestStatusString(t *testing.T) {
	customStatus := Status{"CUSTOM_STATUS"}
	if customStatus.String() != "CUSTOM_STATUS" {
		t.Errorf("Expected String() to return 'CUSTOM_STATUS', got '%s'", customStatus.String())
	}
}

func TestStatusEquality(t *testing.T) {
	tests := []struct {
		name     string
		status1  Status
		status2  Status
		expected bool
	}{
		{"Same pending statuses", StatusPending, StatusPending, true},
		{"Same committed statuses", StatusCommited, StatusCommited, true},
		{"Same released statuses", StatusReleased, StatusReleased, true},
		{"Different statuses", StatusPending, StatusCommited, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status1 == tt.status2
			if result != tt.expected {
				t.Errorf("Expected equality %v, got %v", tt.expected, result)
			}
		})
	}
}