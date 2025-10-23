package auth

import (
	"fmt"
	"time"

	"github.com/pquerna/otp/totp"
)

type MFAService struct {
	issuer string
}

func NewMFAService(issuer string) *MFAService {
	return &MFAService{issuer: issuer}
}

func (s *MFAService) GenerateSecret(email string) (string, string, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      s.issuer,
		AccountName: email,
	})
	if err != nil {
		return "", "", fmt.Errorf("generate totp secret: %w", err)
	}

	return key.Secret(), key.URL(), nil
}

func (s *MFAService) ValidateCode(secret, code string) bool {
	return totp.Validate(code, secret)
}

func (s *MFAService) ValidateCodeWithTime(secret, code string, t time.Time) bool {
	ok, err := totp.ValidateCustom(code, secret, t, totp.ValidateOpts{Skew: 1})
	return err == nil && ok
}
