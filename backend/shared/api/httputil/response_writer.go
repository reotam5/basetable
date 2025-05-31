package httputil

import (
	"encoding/json"
	"net/http"
)

func WriteJSONResponseWithStatus(w http.ResponseWriter, _ *http.Request, status int, data any) error {
	body, err := json.Marshal(data)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return err
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(body)
	return nil
}

func WriteJSONResponse(w http.ResponseWriter, r *http.Request, data any) error {
	return WriteJSONResponseWithStatus(w, r, http.StatusOK, data)
}

func WriteJSONErrorResponse(w http.ResponseWriter, r *http.Request, err *HTTPError) error {
	return WriteJSONResponseWithStatus(w, r, err.Status, err.Payload())
}
