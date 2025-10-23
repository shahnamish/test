package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/example/authservice/internal/auth"
	middlewarepkg "github.com/example/authservice/internal/http/middleware"
	"github.com/example/authservice/internal/models"
	"github.com/example/authservice/internal/service"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	MFACode  string `json:"mfaCode,omitempty"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type MFAEnableResponse struct {
	Secret string `json:"secret"`
	URL    string `json:"url"`
}

type MFAVerifyRequest struct {
	Code string `json:"code"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	user, err := h.authService.Register(r.Context(), req.Email, req.Password, req.Role)
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			respondError(w, http.StatusConflict, "email already taken")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to register user")
		return
	}

	respondJSON(w, http.StatusCreated, sanitizeUser(user))
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	var (
		tokens *auth.TokenPair
		user   *models.User
		err    error
	)

	if req.MFACode != "" {
		tokens, user, err = h.authService.LoginWithMFA(r.Context(), req.Email, req.Password, req.MFACode)
		if err != nil {
			if errors.Is(err, service.ErrInvalidCredentials) {
				respondError(w, http.StatusUnauthorized, "invalid credentials")
				return
			}
			respondError(w, http.StatusUnauthorized, err.Error())
			return
		}
	} else {
		tokens, user, err = h.authService.Login(r.Context(), req.Email, req.Password)
		if err != nil {
			if errors.Is(err, service.ErrInvalidCredentials) {
				respondError(w, http.StatusUnauthorized, "invalid credentials")
				return
			}
			if errors.Is(err, service.ErrMFARequired) {
				respondJSON(w, http.StatusOK, map[string]interface{}{
					"mfaRequired": true,
					"user":        sanitizeUser(user),
				})
				return
			}
			if errors.Is(err, service.ErrUserNotActive) {
				respondError(w, http.StatusForbidden, "user account is not active")
				return
			}
			respondError(w, http.StatusInternalServerError, "failed to login")
			return
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"accessToken":  tokens.AccessToken,
		"refreshToken": tokens.RefreshToken,
		"user":         sanitizeUser(user),
	})
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.RefreshToken == "" {
		respondError(w, http.StatusBadRequest, "refresh token is required")
		return
	}

	tokens, err := h.authService.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		if errors.Is(err, auth.ErrExpiredToken) {
			respondError(w, http.StatusUnauthorized, "refresh token expired")
			return
		}
		if errors.Is(err, service.ErrInvalidToken) {
			respondError(w, http.StatusUnauthorized, "invalid refresh token")
			return
		}
		if errors.Is(err, service.ErrTokenRevoked) {
			respondError(w, http.StatusUnauthorized, "refresh token revoked")
			return
		}
		respondError(w, http.StatusInternalServerError, "failed to refresh token")
		return
	}

	respondJSON(w, http.StatusOK, tokens)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var req RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.RefreshToken == "" {
		respondError(w, http.StatusBadRequest, "refresh token is required")
		return
	}

	if err := h.authService.Logout(r.Context(), req.RefreshToken); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to logout")
		return
	}

	respondJSON(w, http.StatusOK, SuccessResponse{Message: "logged out successfully"})
}

func (h *AuthHandler) EnableMFA(w http.ResponseWriter, r *http.Request) {
	claims, ok := middlewarepkg.ClaimsFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing authentication claims")
		return
	}

	secret, url, err := h.authService.EnableMFA(r.Context(), claims.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to enable MFA")
		return
	}

	respondJSON(w, http.StatusOK, MFAEnableResponse{
		Secret: secret,
		URL:    url,
	})
}

func (h *AuthHandler) VerifyMFA(w http.ResponseWriter, r *http.Request) {
	claims, ok := middlewarepkg.ClaimsFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing authentication claims")
		return
	}

	var req MFAVerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Code == "" {
		respondError(w, http.StatusBadRequest, "code is required")
		return
	}

	if err := h.authService.VerifyMFA(r.Context(), claims.UserID, req.Code); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, SuccessResponse{Message: "MFA enabled successfully"})
}

func (h *AuthHandler) DisableMFA(w http.ResponseWriter, r *http.Request) {
	claims, ok := middlewarepkg.ClaimsFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing authentication claims")
		return
	}

	if err := h.authService.DisableMFA(r.Context(), claims.UserID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to disable MFA")
		return
	}

	respondJSON(w, http.StatusOK, SuccessResponse{Message: "MFA disabled successfully"})
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims, ok := middlewarepkg.ClaimsFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing authentication claims")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"userId": claims.UserID,
		"email":  claims.Email,
		"role":   claims.Role,
	})
}

func (h *AuthHandler) RequireRole(roles ...string) func(http.Handler) http.Handler {
	roleSet := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		roleSet[role] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := middlewarepkg.ClaimsFromContext(r.Context())
			if !ok {
				respondError(w, http.StatusUnauthorized, "missing authentication claims")
				return
			}

			if _, allowed := roleSet[claims.Role]; !allowed {
				respondError(w, http.StatusForbidden, "insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func sanitizeUser(user *models.User) map[string]interface{} {
	if user == nil {
		return nil
	}

	return map[string]interface{}{
		"id":         user.ID,
		"email":      user.Email,
		"role":       user.Role,
		"mfaEnabled": user.MFAEnabled,
		"isActive":   user.IsActive,
		"createdAt":  user.CreatedAt,
		"updatedAt":  user.UpdatedAt,
	}
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, ErrorResponse{Error: message})
}
