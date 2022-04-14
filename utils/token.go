package utils

import (
	"encoding/base64"
	"fmt"
)

func GetEncodedToken(username, password string) string {
	return base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%v:%v", username, password)))
}
