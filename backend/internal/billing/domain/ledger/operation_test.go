package ledger

import "testing"

func TestOperationValues(t *testing.T) {
	tests := []struct {
		name      string
		operation Operation
		expected  string
	}{
		{"Add operation", OperationAdd, "ADD"},
		{"Deduct operation", OperationDeduct, "DEDUCT"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.operation.String() != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, tt.operation.String())
			}
		})
	}
}

func TestOperationIsAdd(t *testing.T) {
	tests := []struct {
		name      string
		operation Operation
		expected  bool
	}{
		{"Add operation", OperationAdd, true},
		{"Deduct operation", OperationDeduct, false},
		{"Custom operation", Operation{"CUSTOM"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.operation.IsAdd()
			if result != tt.expected {
				t.Errorf("Expected IsAdd() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestOperationIsDeduct(t *testing.T) {
	tests := []struct {
		name      string
		operation Operation
		expected  bool
	}{
		{"Add operation", OperationAdd, false},
		{"Deduct operation", OperationDeduct, true},
		{"Custom operation", Operation{"CUSTOM"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.operation.IsDeduct()
			if result != tt.expected {
				t.Errorf("Expected IsDeduct() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestOperationEquality(t *testing.T) {
	tests := []struct {
		name      string
		op1       Operation
		op2       Operation
		expected  bool
	}{
		{"Same add operations", OperationAdd, OperationAdd, true},
		{"Same deduct operations", OperationDeduct, OperationDeduct, true},
		{"Different operations", OperationAdd, OperationDeduct, false},
		{"Custom operations same", Operation{"CUSTOM"}, Operation{"CUSTOM"}, true},
		{"Custom operations different", Operation{"CUSTOM1"}, Operation{"CUSTOM2"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.op1 == tt.op2
			if result != tt.expected {
				t.Errorf("Expected equality %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestOperationString(t *testing.T) {
	customOp := Operation{"CUSTOM_OPERATION"}
	if customOp.String() != "CUSTOM_OPERATION" {
		t.Errorf("Expected String() to return 'CUSTOM_OPERATION', got '%s'", customOp.String())
	}
}