package model

type PricingUnit string

func (u PricingUnit) String() string {
	return string(u)
}

const (
	UnitPer1000Tokens PricingUnit = "per_1000_tokens"
)

type TokenPricing struct {
	Unit                 PricingUnit
	PromptTokenPrice     float64
	CompletionTokenPrice float64
	Currency             string
}
