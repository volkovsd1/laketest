package api

import (
	"github.com/merico-dev/lake/config"
	"github.com/merico-dev/lake/plugins/core"
	"github.com/mitchellh/mapstructure"
)

type AEConfig struct {
	AE_APP_ID    string `mapstructure:"AE_APP_ID"`
	AE_SIGN      string `mapstructure:"AE_SIGN"`
	AE_NONCE_STR string `mapstructure:"AE_NONCE_STR"`
	AE_ENDPOINT  string `mapstructure:"AE_ENDPOINT"`
}

// This object conforms to what the frontend currently expects.
type AEResponse struct {
	Endpoint string
	Sign     string
	Nonce    string
	AppId    string
	Name     string
	ID       int
}

/*
PUT /plugins/ae/sources/:sourceId
*/
func PutSource(input *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	aeSource := AEConfig{}
	err := mapstructure.Decode(input.Body, &aeSource)
	if err != nil {
		return nil, err
	}
	v := config.GetConfig()

	if aeSource.AE_APP_ID != "" {
		v.Set("AE_SIGN", aeSource.AE_SIGN)
	}
	if aeSource.AE_SIGN != "" {
		v.Set("AE_SIGN", aeSource.AE_SIGN)
	}
	if aeSource.AE_NONCE_STR != "" {
		v.Set("AE_NONCE_STR", aeSource.AE_NONCE_STR)
	}
	if aeSource.AE_ENDPOINT != "" {
		v.Set("AE_ENDPOINT", aeSource.AE_ENDPOINT)
	}

	err = v.WriteConfig()
	if err != nil {
		return nil, err
	}

	return &core.ApiResourceOutput{Body: "Success"}, nil
}

/*
GET /plugins/ae/sources
*/
func ListSources(_ *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	// RETURN ONLY 1 SOURCE (FROM ENV) until multi-source is developed.
	aeSources, err := GetSourceFromEnv()
	response := []AEResponse{*aeSources}
	if err != nil {
		return nil, err
	}
	return &core.ApiResourceOutput{Body: response}, nil
}

/*
GET /plugins/ae/sources/:sourceId
*/
func GetSource(_ *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	//  RETURN ONLY 1 SOURCE FROM ENV (Ignore ID until multi-source is developed.)
	aeSources, err := GetSourceFromEnv()
	if err != nil {
		return nil, err
	}
	return &core.ApiResourceOutput{Body: aeSources}, nil
}

func GetSourceFromEnv() (*AEResponse, error) {
	v := config.GetConfig()
	var configJson AEConfig
	err := v.Unmarshal(&configJson)
	if err != nil {
		return nil, err
	}
	return &AEResponse{
		AppId:    configJson.AE_APP_ID,
		Nonce:    configJson.AE_NONCE_STR,
		Sign:     configJson.AE_SIGN,
		Endpoint: configJson.AE_ENDPOINT,
		ID:       1,
		Name:     "AE",
	}, nil
}
