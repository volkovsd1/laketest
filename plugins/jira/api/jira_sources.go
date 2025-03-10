package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/merico-dev/lake/config"
	"github.com/merico-dev/lake/models/common"

	"github.com/go-playground/validator/v10"
	"github.com/merico-dev/lake/plugins/core"
	"github.com/merico-dev/lake/plugins/jira/models"
	"github.com/mitchellh/mapstructure"
)

func findSourceByInputParam(input *core.ApiResourceInput) (*models.JiraSource, error) {
	sourceId := input.Params["sourceId"]
	if sourceId == "" {
		return nil, fmt.Errorf("missing sourceid")
	}
	jiraSourceId, err := strconv.ParseUint(sourceId, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid sourceId")
	}

	return getJiraSourceById(jiraSourceId)
}

func getJiraSourceById(id uint64) (*models.JiraSource, error) {
	jiraSource := &models.JiraSource{}
	err := db.First(jiraSource, id).Error
	if err != nil {
		return nil, err
	}

	// decrypt
	v := config.GetConfig()
	encKey := v.GetString(core.EncodeKeyEnvStr)
	jiraSource.BasicAuthEncoded, err = core.Decrypt(encKey, jiraSource.BasicAuthEncoded)
	if err != nil {
		return nil, err
	}

	return jiraSource, nil
}
func mergeFieldsToJiraSource(jiraSource *models.JiraSource, sources ...map[string]interface{}) error {
	// decode
	for _, source := range sources {
		err := mapstructure.Decode(source, jiraSource)
		if err != nil {
			return err
		}
	}

	// validate
	vld := validator.New()
	err := vld.Struct(jiraSource)
	if err != nil {
		return err
	}

	return nil
}

func refreshAndSaveJiraSource(jiraSource *models.JiraSource, data map[string]interface{}) error {
	var err error
	// update fields from request body
	err = mergeFieldsToJiraSource(jiraSource, data)
	if err != nil {
		return err
	}

	// encrypt
	v := config.GetConfig()
	encKey := v.GetString(core.EncodeKeyEnvStr)
	if encKey == "" {
		// Randomly generate a bunch of encryption keys and set them to config
		encKey = core.RandomEncKey()
		v.Set(core.EncodeKeyEnvStr, encKey)
		err := v.WriteConfig()
		if err != nil {
			return err
		}
	}
	jiraSource.BasicAuthEncoded, err = core.Encrypt(encKey, jiraSource.BasicAuthEncoded)
	if err != nil {
		return err
	}

	// transaction for nested operations
	tx := db.Begin()
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()
	if jiraSource.ID > 0 {
		err = tx.Save(jiraSource).Error
	} else {
		err = tx.Create(jiraSource).Error
	}
	if err != nil {
		if common.IsDuplicateError(err) {
			return fmt.Errorf("jira source with name %s already exists", jiraSource.Name)
		}
		return err
	}
	// perform optional operation
	typeMappings := data["typeMappings"]
	if typeMappings != nil {
		err = saveTypeMappings(tx, jiraSource.ID, typeMappings)
		if err != nil {
			return err
		}
	}

	return nil
}

/*
POST /plugins/jira/sources
{
	"name": "jira data source name",
	"endpoint": "jira api endpoint, i.e. https://merico.atlassian.net/rest",
	"basicAuthEncoded": "generated by `echo -n <jira login email>:<jira token> | base64`",
	"epicKeyField": "name of customfield of epic key",
	"storyPointField": "name of customfield of story point",
	"typeMappings": { // optional, send empty object to delete all typeMappings of the data source
		"userType": {
			"standardType": "devlake standard type",
			"statusMappings": {  // optional, send empt object to delete all status mapping for the user type
				"userStatus": {
					"standardStatus": "devlake standard status"
				}
			}
		}
	}
}
*/
func PostSources(input *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	// create a new source
	jiraSource := &models.JiraSource{}

	// update from request and save to database
	err := refreshAndSaveJiraSource(jiraSource, input.Body)
	if err != nil {
		return nil, err
	}

	return &core.ApiResourceOutput{Body: jiraSource, Status: http.StatusCreated}, nil
}

/*
PUT /plugins/jira/sources/:sourceId
{
	"name": "jira data source name",
	"endpoint": "jira api endpoint, i.e. https://merico.atlassian.net/rest",
	"basicAuthEncoded": "generated by `echo -n <jira login email>:<jira token> | base64`",
	"epicKeyField": "name of customfield of epic key",
	"storyPointField": "name of customfield of story point",
	"typeMappings": { // optional, send empty object to delete all typeMappings of the data source
		"userType": {
			"standardType": "devlake standard type",
			"statusMappings": {  // optional, send empt object to delete all status mapping for the user type
				"userStatus": {
					"standardStatus": "devlake standard status"
				}
			}
		}
	}
}
*/
func PutSource(input *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	// load from db
	jiraSource, err := findSourceByInputParam(input)
	if err != nil {
		return nil, err
	}

	// update from request and save to database
	err = refreshAndSaveJiraSource(jiraSource, input.Body)
	if err != nil {
		return nil, err
	}

	return &core.ApiResourceOutput{Body: jiraSource}, nil
}

/*
DELETE /plugins/jira/sources/:sourceId
*/
func DeleteSource(input *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	// load from db
	jiraSource, err := findSourceByInputParam(input)
	if err != nil {
		return nil, err
	}
	err = db.Delete(jiraSource).Error
	if err != nil {
		return nil, err
	}
	// cascading delete
	err = db.Where("source_id = ?", jiraSource.ID).Delete(&models.JiraIssueTypeMapping{}).Error
	if err != nil {
		return nil, err
	}
	err = db.Where("source_id = ?", jiraSource.ID).Delete(&models.JiraIssueStatusMapping{}).Error
	if err != nil {
		return nil, err
	}

	return &core.ApiResourceOutput{Body: jiraSource}, nil
}

/*
GET /plugins/jira/sources
*/
func ListSources(_ *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	jiraSources := make([]models.JiraSource, 0)
	err := db.Find(&jiraSources).Error
	if err != nil {
		return nil, err
	}
	return &core.ApiResourceOutput{Body: jiraSources}, nil
}

/*
GET /plugins/jira/sources/:sourceId


{
	"name": "jira data source name",
	"endpoint": "jira api endpoint, i.e. https://merico.atlassian.net/rest",
	"basicAuthEncoded": "generated by `echo -n <jira login email>:<jira token> | base64`",
	"epicKeyField": "name of customfield of epic key",
	"storyPointField": "name of customfield of story point",
	"typeMappings": { // optional, send empty object to delete all typeMappings of the data source
		"userType": {
			"standardType": "devlake standard type",
			"statusMappings": {  // optional, send empt object to delete all status mapping for the user type
				"userStatus": {
					"standardStatus": "devlake standard status"
				}
			}
		}
	}
}
*/
func GetSource(input *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	jiraSource, err := findSourceByInputParam(input)
	if err != nil {
		return nil, err
	}

	detail := &models.JiraSourceDetail{
		JiraSource:   *jiraSource,
		TypeMappings: make(map[string]map[string]interface{}),
	}

	typeMappings, err := findIssueTypeMappingBySourceId(jiraSource.ID)
	if err != nil {
		return nil, err
	}
	for _, jiraTypeMapping := range typeMappings {
		// type mapping
		typeMappingDict := map[string]interface{}{
			"standardType": jiraTypeMapping.StandardType,
		}
		detail.TypeMappings[jiraTypeMapping.UserType] = typeMappingDict

		// status mapping
		statusMappings, err := findIssueStatusMappingBySourceIdAndUserType(
			jiraSource.ID,
			jiraTypeMapping.UserType,
		)
		if err != nil {
			return nil, err
		}
		if len(statusMappings) == 0 {
			continue
		}
		statusMappingsDict := make(map[string]interface{})
		for _, jiraStatusMapping := range statusMappings {
			statusMappingsDict[jiraStatusMapping.UserStatus] = map[string]interface{}{
				"standardStatus": jiraStatusMapping.StandardStatus,
			}
		}
		typeMappingDict["statusMappings"] = statusMappingsDict
	}

	return &core.ApiResourceOutput{Body: detail}, nil
}

// GET /plugins/jira/sources/:sourceId/epics
type EpicResponse struct {
	Id    int
	Title string
	Value string
}

func GetEpicsBySourceId(input *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	jiraSource, err := findSourceByInputParam(input)
	if err != nil {
		return nil, err
	}
	return &core.ApiResourceOutput{Body: [1]EpicResponse{{
		Id:    1,
		Title: jiraSource.EpicKeyField,
		Value: jiraSource.EpicKeyField,
	}}}, nil
}

// GET /plugins/jira/sources/:sourceId/granularities
type GranularitiesResponse struct {
	Id    int
	Title string
	Value string
}

func GetGranularitiesBySourceId(input *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	jiraSource, err := findSourceByInputParam(input)
	if err != nil {
		return nil, err
	}
	return &core.ApiResourceOutput{Body: [1]GranularitiesResponse{
		{
			Id:    1,
			Title: "Story Point Field",
			Value: jiraSource.StoryPointField,
		},
	}}, nil
}

type BoardResponse struct {
	Id    int
	Title string
	Value string
}

// GET /plugins/jira/sources/:sourceId/boards

func GetBoardsBySourceId(input *core.ApiResourceInput) (*core.ApiResourceOutput, error) {
	sourceId := input.Params["sourceId"]
	if sourceId == "" {
		return nil, fmt.Errorf("missing sourceid")
	}
	jiraSourceId, err := strconv.ParseUint(sourceId, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid sourceId")
	}
	var jiraBoards []models.JiraBoard
	err = db.Where("source_Id = ?", jiraSourceId).Find(&jiraBoards).Error
	if err != nil {
		return nil, err
	}
	var boardResponses []BoardResponse
	for _, board := range jiraBoards {
		boardResponses = append(boardResponses, BoardResponse{
			Id:    int(board.BoardId),
			Title: board.Name,
			Value: fmt.Sprintf("%v", board.BoardId),
		})
	}
	return &core.ApiResourceOutput{Body: boardResponses}, nil
}
