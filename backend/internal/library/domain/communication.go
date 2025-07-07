package domain

import (
	"errors"
	"slices"
	"strings"
)

type CommunicationPreferences struct {
	tone  CommunicationTone
	style CommunicationStyle
}

type CommunicationTone string

const (
	CommunicationToneFriendly     CommunicationTone = "friendly"
	CommunicationToneProfessional CommunicationTone = "professional"
	CommunicationToneCasual       CommunicationTone = "casual"
	CommunicationToneTechnical    CommunicationTone = "technical"
	CommunicationToneCreative     CommunicationTone = "creative"
	CommunicationToneConcise      CommunicationTone = "concise"
)

func (t CommunicationTone) String() string {
	return string(t)
}

type CommunicationStyle string

const (
	CommunicationStyleDetailed       CommunicationStyle = "detailed"
	CommunicationStyleBulletPoints   CommunicationStyle = "bulletpoints"
	CommunicationStyleStepByStep     CommunicationStyle = "stepbystep"
	CommunicationStyleConversational CommunicationStyle = "conversational"
	CommunicationStyleAnalytical     CommunicationStyle = "analytical"
	CommunicationStyleStoryTelling   CommunicationStyle = "storytelling"
)

func (s CommunicationStyle) String() string {
	return string(s)
}

func (t CommunicationPreferences) Tone() CommunicationTone {
	return t.tone
}

func (t CommunicationPreferences) Style() CommunicationStyle {
	return t.style
}

func NewCommunicationPreferencesFromStrings(tone, style string) (CommunicationPreferences, error) {
	normalizedTone := strings.ToLower(tone)
	normalizedStyle := strings.ToLower(style)

	validTones := []CommunicationTone{
		CommunicationToneFriendly,
		CommunicationToneProfessional,
		CommunicationToneCasual,
		CommunicationToneTechnical,
		CommunicationToneCreative,
		CommunicationToneConcise,
		"",
	}

	validStyles := []CommunicationStyle{
		CommunicationStyleDetailed,
		CommunicationStyleBulletPoints,
		CommunicationStyleStepByStep,
		CommunicationStyleConversational,
		CommunicationStyleAnalytical,
		CommunicationStyleStoryTelling,
		"",
	}

	if !slices.Contains(validTones, CommunicationTone(normalizedTone)) {
		return CommunicationPreferences{}, errors.New("invalid tone")
	}

	if !slices.Contains(validStyles, CommunicationStyle(normalizedStyle)) {
		return CommunicationPreferences{}, errors.New("invalid style")
	}

	return CommunicationPreferences{
		tone:  CommunicationTone(normalizedTone),
		style: CommunicationStyle(normalizedStyle),
	}, nil
}
