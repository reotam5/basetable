package ledger

type Operation struct {
	value string
}

var (
	OperationAdd    = Operation{"ADD"}
	OperationDeduct = Operation{"DEDUCT"}
)

func (o Operation) IsAdd() bool {
	return o == OperationAdd
}

func (o Operation) IsDeduct() bool {
	return o == OperationDeduct
}

func (o Operation) String() string {
	return o.value
}
