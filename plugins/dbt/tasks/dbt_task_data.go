package tasks

type DbtOptions struct {
	ProjectPath    string                 `json:"projectPath"`
	ProjectName    string                 `json:"projectName"`
	ProjectTarget  string                 `json:"projectTarget"`
	ProjectVars    map[string]interface{} `json:"projectVars"`
	SelectedModels []string               `json:"selectedModels"`
	Tasks          []string               `json:"tasks,omitempty"`
}

type DbtTaskData struct {
	Options *DbtOptions
}
