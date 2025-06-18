package controller

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/basetable/basetable/backend/internal/proxy/api/payload"
	"github.com/basetable/basetable/backend/internal/proxy/application/dto"
	"github.com/basetable/basetable/backend/internal/proxy/application/service"
	hutil "github.com/basetable/basetable/backend/internal/shared/api/httputil"
)

type ProxyController interface {
	ProxyRequest(w http.ResponseWriter, r *http.Request)
}

type proxyController struct {
	proxyService service.ProxyService
}

func NewProxyController(proxyService service.ProxyService) ProxyController {
	return &proxyController{
		proxyService: proxyService,
	}
}

func (c *proxyController) ProxyRequest(w http.ResponseWriter, r *http.Request) {
	var req payload.ProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	// Convert payload to DTO
	dtoReq := dto.Request{
		ProviderID: req.ProviderID,
		Endpoint:   req.Endpoint,
		ModelKey:   req.ModelKey,
		Messages:   convertMessages(req.Messages),
		Stream:     req.Stream,
		Tools:      convertTools(req.Tools),
		ToolChoice: convertToolChoice(req.ToolChoice),
	}

	if dtoReq.Stream {
		// Handle streaming response
		responseChan, err := c.proxyService.ProxyRequestStream(r.Context(), dtoReq)
		if err != nil {
			hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
			fmt.Println(err)
			return
		}

		// Set headers for Server-Sent Events
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Create a flusher to send data immediately
		flusher, ok := w.(http.Flusher)
		if !ok {
			hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(fmt.Errorf("streaming unsupported")))
			return
		}

		// Stream response chunks to client
		for response := range responseChan {
			// Convert response to payload format
			payloadResp := payload.ProxyResponse{
				Model:    response.Model,
				Choices:  convertChoices(response.Choices),
				Provider: response.Provider,
				Usage: payload.Usage{
					PromptTokens:     response.Usage.PromptTokens,
					CompletionTokens: response.Usage.CompletionTokens,
					TotalTokens:      response.Usage.TotalTokens,
				},
				SearchResults: convertSearchResults(response.SearchResults),
			}

			// Convert to JSON
			responseJSON, err := json.Marshal(payloadResp)
			if err != nil {
				continue
			}

			// Write as Server-Sent Event
			fmt.Fprintf(w, "data: %s\n\n", responseJSON)
			flusher.Flush()

			// Check if client disconnected
			if r.Context().Err() != nil {
				return
			}
		}

		// Send [DONE] marker
		fmt.Fprint(w, "data: [DONE]\n\n")
		flusher.Flush()
	} else {
		// Handle regular response
		response, err := c.proxyService.ProxyRequest(r.Context(), dtoReq)
		fmt.Println(err)
		if err != nil {
			hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
			return
		}

		// Convert DTO to payload response
		payloadResp := payload.ProxyResponse{
			Model:    response.Model,
			Choices:  convertChoices(response.Choices),
			Provider: response.Provider,
			Usage: payload.Usage{
				PromptTokens:     response.Usage.PromptTokens,
				CompletionTokens: response.Usage.CompletionTokens,
				TotalTokens:      response.Usage.TotalTokens,
			},
			SearchResults: convertSearchResults(response.SearchResults),
		}

		hutil.WriteJSONResponse(w, r, payloadResp)
	}
}

func convertMessages(payloadMessages []payload.Message) []dto.Message {
	dtoMessages := make([]dto.Message, len(payloadMessages))
	for i, msg := range payloadMessages {
		dtoMessages[i] = dto.Message{
			Role:      dto.MessageRole(msg.Role),
			Content:   msg.Content,
			Toolcalls: convertToolCalls(msg.Toolcalls),
		}
	}
	return dtoMessages
}

func convertToolCalls(payloadToolCalls []payload.ToolCall) []dto.ToolCall {
	dtoToolCalls := make([]dto.ToolCall, len(payloadToolCalls))
	for i, tc := range payloadToolCalls {
		dtoToolCalls[i] = dto.ToolCall{
			ID:       dto.ToolCallID(tc.ID),
			ToolType: dto.ToolType(tc.ToolType),
			Call: dto.FunctionCall{
				Name: tc.Call.Name,
				Arg:  tc.Call.Arg,
			},
		}
	}
	return dtoToolCalls
}

func convertTools(payloadTools []payload.Tool) []dto.Tool {
	dtoTools := make([]dto.Tool, len(payloadTools))
	for i, tool := range payloadTools {
		dtoTools[i] = dto.Tool{
			ToolType: dto.ToolType(tool.ToolType),
			ToolDefinition: dto.ToolDefinition{
				Name:        tool.ToolDefinition.Name,
				Description: tool.ToolDefinition.Description,
				Parameters: dto.ParameterSchema{
					Properties: convertParameterProperties(tool.ToolDefinition.Parameters.Properties),
					Required:   tool.ToolDefinition.Parameters.Required,
				},
			},
		}
	}
	return dtoTools
}

func convertParameterProperties(payloadProps map[string]payload.ParameterProperty) map[string]dto.ParameterProperty {
	dtoProps := make(map[string]dto.ParameterProperty)
	for key, prop := range payloadProps {
		dtoProps[key] = dto.ParameterProperty{
			Type:        prop.Type,
			Description: prop.Description,
			Enum:        prop.Enum,
			Default:     prop.Default,
		}
	}
	return dtoProps
}

func convertToolChoice(payloadToolChoice *payload.ToolChoice) dto.ToolChoice {
	if payloadToolChoice == nil {
		return dto.ToolChoice{Type: dto.ToolChoiceAUto}
	}
	return dto.ToolChoice{
		Type:         dto.ToolChoiceType(payloadToolChoice.Type),
		FunctionName: payloadToolChoice.FunctionName,
	}
}

func convertChoices(dtoChoices []dto.Choice) []payload.Choice {
	payloadChoices := make([]payload.Choice, len(dtoChoices))
	for i, choice := range dtoChoices {
		payloadChoices[i] = payload.Choice{
			Index: choice.Index,
			Message: payload.Message{
				Role:      string(choice.Message.Role),
				Content:   choice.Message.Content,
				Toolcalls: convertDTOToolCallsToPayload(choice.Message.Toolcalls),
			},
			Delta: payload.Delta{
				Role:    string(choice.Delta.Role),
				Content: choice.Delta.Content,
			},
			FinishReason: string(choice.FinishReason),
		}
	}
	return payloadChoices
}

func convertSearchResults(dtoSearchResults []dto.SearchResult) []payload.SearchResult {
	payloadSearchResults := make([]payload.SearchResult, len(dtoSearchResults))
	for i, sr := range dtoSearchResults {
		payloadSearchResults[i] = payload.SearchResult{
			Title: sr.Title,
			URL:   sr.URL,
		}
	}
	return payloadSearchResults
}

func convertDTOToolCallsToPayload(dtoToolCalls []dto.ToolCall) []payload.ToolCall {
	payloadToolCalls := make([]payload.ToolCall, len(dtoToolCalls))
	for i, tc := range dtoToolCalls {
		payloadToolCalls[i] = payload.ToolCall{
			ID:       string(tc.ID),
			ToolType: string(tc.ToolType),
			Call: payload.FunctionCall{
				Name: tc.Call.Name,
				Arg:  tc.Call.Arg,
			},
		}
	}
	return payloadToolCalls
}
