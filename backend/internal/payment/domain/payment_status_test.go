package domain

import (
	"testing"
)

func TestNewPaymentStatusFromString(t *testing.T) {
	h := NewTestHelpers(t)

	tests := []struct {
		name     string
		input    string
		expected PaymentStatus
		wantErr  bool
	}{
		{
			name:     "valid pending status",
			input:    "pending",
			expected: PaymentStatusPending,
			wantErr:  false,
		},
		{
			name:     "valid completed status",
			input:    "completed",
			expected: PaymentStatusCompleted,
			wantErr:  false,
		},
		{
			name:     "valid failed status",
			input:    "failed",
			expected: PaymentStatusFailed,
			wantErr:  false,
		},
		{
			name:     "valid cancelled status",
			input:    "cancelled",
			expected: PaymentStatusCancelled,
			wantErr:  false,
		},
		{
			name:     "valid pending status uppercase",
			input:    "PENDING",
			expected: PaymentStatusPending,
			wantErr:  false,
		},
		{
			name:     "valid completed status mixed case",
			input:    "Completed",
			expected: PaymentStatusCompleted,
			wantErr:  false,
		},
		{
			name:     "valid status with whitespace",
			input:    "  pending  ",
			expected: PaymentStatusPending,
			wantErr:  false,
		},
		{
			name:    "invalid status",
			input:   "invalid",
			wantErr: true,
		},
		{
			name:    "empty string",
			input:   "",
			wantErr: true,
		},
		{
			name:    "whitespace only",
			input:   "   ",
			wantErr: true,
		},
		{
			name:    "unknown status",
			input:   "processing",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := NewPaymentStatusFromString(tt.input)
			
			if tt.wantErr {
				h.AssertInvalidStatusError(err)
				return
			}
			
			h.AssertNoError(err)
			h.AssertTrue(result.Equals(tt.expected))
		})
	}
}

func TestPaymentStatusString(t *testing.T) {
	tests := []struct {
		name     string
		status   PaymentStatus
		expected string
	}{
		{
			name:     "pending status",
			status:   PaymentStatusPending,
			expected: "pending",
		},
		{
			name:     "completed status",
			status:   PaymentStatusCompleted,
			expected: "completed",
		},
		{
			name:     "failed status",
			status:   PaymentStatusFailed,
			expected: "failed",
		},
		{
			name:     "cancelled status",
			status:   PaymentStatusCancelled,
			expected: "cancelled",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.String()
			if result != tt.expected {
				t.Errorf("PaymentStatus.String() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestPaymentStatusIsFinal(t *testing.T) {
	tests := []struct {
		name     string
		status   PaymentStatus
		expected bool
	}{
		{
			name:     "pending is not final",
			status:   PaymentStatusPending,
			expected: false,
		},
		{
			name:     "completed is final",
			status:   PaymentStatusCompleted,
			expected: true,
		},
		{
			name:     "failed is final",
			status:   PaymentStatusFailed,
			expected: true,
		},
		{
			name:     "cancelled is final",
			status:   PaymentStatusCancelled,
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsFinal()
			if result != tt.expected {
				t.Errorf("PaymentStatus.IsFinal() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestPaymentStatusIsPending(t *testing.T) {
	tests := []struct {
		name     string
		status   PaymentStatus
		expected bool
	}{
		{
			name:     "pending status",
			status:   PaymentStatusPending,
			expected: true,
		},
		{
			name:     "completed status",
			status:   PaymentStatusCompleted,
			expected: false,
		},
		{
			name:     "failed status",
			status:   PaymentStatusFailed,
			expected: false,
		},
		{
			name:     "cancelled status",
			status:   PaymentStatusCancelled,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsPending()
			if result != tt.expected {
				t.Errorf("PaymentStatus.IsPending() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestPaymentStatusIsCompleted(t *testing.T) {
	tests := []struct {
		name     string
		status   PaymentStatus
		expected bool
	}{
		{
			name:     "pending status",
			status:   PaymentStatusPending,
			expected: false,
		},
		{
			name:     "completed status",
			status:   PaymentStatusCompleted,
			expected: true,
		},
		{
			name:     "failed status",
			status:   PaymentStatusFailed,
			expected: false,
		},
		{
			name:     "cancelled status",
			status:   PaymentStatusCancelled,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsCompleted()
			if result != tt.expected {
				t.Errorf("PaymentStatus.IsCompleted() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestPaymentStatusIsFailed(t *testing.T) {
	tests := []struct {
		name     string
		status   PaymentStatus
		expected bool
	}{
		{
			name:     "pending status",
			status:   PaymentStatusPending,
			expected: false,
		},
		{
			name:     "completed status",
			status:   PaymentStatusCompleted,
			expected: false,
		},
		{
			name:     "failed status",
			status:   PaymentStatusFailed,
			expected: true,
		},
		{
			name:     "cancelled status",
			status:   PaymentStatusCancelled,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsFailed()
			if result != tt.expected {
				t.Errorf("PaymentStatus.IsFailed() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestPaymentStatusIsCancelled(t *testing.T) {
	tests := []struct {
		name     string
		status   PaymentStatus
		expected bool
	}{
		{
			name:     "pending status",
			status:   PaymentStatusPending,
			expected: false,
		},
		{
			name:     "completed status",
			status:   PaymentStatusCompleted,
			expected: false,
		},
		{
			name:     "failed status",
			status:   PaymentStatusFailed,
			expected: false,
		},
		{
			name:     "cancelled status",
			status:   PaymentStatusCancelled,
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status.IsCancelled()
			if result != tt.expected {
				t.Errorf("PaymentStatus.IsCancelled() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestPaymentStatusEquals(t *testing.T) {
	tests := []struct {
		name     string
		status1  PaymentStatus
		status2  PaymentStatus
		expected bool
	}{
		{
			name:     "same pending statuses",
			status1:  PaymentStatusPending,
			status2:  PaymentStatusPending,
			expected: true,
		},
		{
			name:     "same completed statuses",
			status1:  PaymentStatusCompleted,
			status2:  PaymentStatusCompleted,
			expected: true,
		},
		{
			name:     "same failed statuses",
			status1:  PaymentStatusFailed,
			status2:  PaymentStatusFailed,
			expected: true,
		},
		{
			name:     "same cancelled statuses",
			status1:  PaymentStatusCancelled,
			status2:  PaymentStatusCancelled,
			expected: true,
		},
		{
			name:     "different statuses - pending vs completed",
			status1:  PaymentStatusPending,
			status2:  PaymentStatusCompleted,
			expected: false,
		},
		{
			name:     "different statuses - completed vs failed",
			status1:  PaymentStatusCompleted,
			status2:  PaymentStatusFailed,
			expected: false,
		},
		{
			name:     "different statuses - failed vs cancelled",
			status1:  PaymentStatusFailed,
			status2:  PaymentStatusCancelled,
			expected: false,
		},
		{
			name:     "different statuses - pending vs cancelled",
			status1:  PaymentStatusPending,
			status2:  PaymentStatusCancelled,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.status1.Equals(tt.status2)
			if result != tt.expected {
				t.Errorf("PaymentStatus.Equals() = %v, want %v", result, tt.expected)
			}
			
			// Test symmetry
			reverseResult := tt.status2.Equals(tt.status1)
			if reverseResult != tt.expected {
				t.Errorf("PaymentStatus.Equals() is not symmetric: %v != %v", result, reverseResult)
			}
		})
	}
}

func TestPaymentStatusTransitionLogic(t *testing.T) {
	tests := []struct {
		name           string
		status         PaymentStatus
		expectedFinal  bool
		expectedStates map[string]bool
	}{
		{
			name:          "pending status properties",
			status:        PaymentStatusPending,
			expectedFinal: false,
			expectedStates: map[string]bool{
				"pending":   true,
				"completed": false,
				"failed":    false,
				"cancelled": false,
			},
		},
		{
			name:          "completed status properties",
			status:        PaymentStatusCompleted,
			expectedFinal: true,
			expectedStates: map[string]bool{
				"pending":   false,
				"completed": true,
				"failed":    false,
				"cancelled": false,
			},
		},
		{
			name:          "failed status properties",
			status:        PaymentStatusFailed,
			expectedFinal: true,
			expectedStates: map[string]bool{
				"pending":   false,
				"completed": false,
				"failed":    true,
				"cancelled": false,
			},
		},
		{
			name:          "cancelled status properties",
			status:        PaymentStatusCancelled,
			expectedFinal: true,
			expectedStates: map[string]bool{
				"pending":   false,
				"completed": false,
				"failed":    false,
				"cancelled": true,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.status.IsFinal() != tt.expectedFinal {
				t.Errorf("PaymentStatus.IsFinal() = %v, want %v", tt.status.IsFinal(), tt.expectedFinal)
			}
			
			if tt.status.IsPending() != tt.expectedStates["pending"] {
				t.Errorf("PaymentStatus.IsPending() = %v, want %v", tt.status.IsPending(), tt.expectedStates["pending"])
			}
			
			if tt.status.IsCompleted() != tt.expectedStates["completed"] {
				t.Errorf("PaymentStatus.IsCompleted() = %v, want %v", tt.status.IsCompleted(), tt.expectedStates["completed"])
			}
			
			if tt.status.IsFailed() != tt.expectedStates["failed"] {
				t.Errorf("PaymentStatus.IsFailed() = %v, want %v", tt.status.IsFailed(), tt.expectedStates["failed"])
			}
			
			if tt.status.IsCancelled() != tt.expectedStates["cancelled"] {
				t.Errorf("PaymentStatus.IsCancelled() = %v, want %v", tt.status.IsCancelled(), tt.expectedStates["cancelled"])
			}
		})
	}
}