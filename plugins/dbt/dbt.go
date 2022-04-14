package main

import (
	"fmt"

	"github.com/merico-dev/lake/plugins/core"
	"github.com/merico-dev/lake/plugins/dbt/tasks"
	"github.com/merico-dev/lake/runner"
	"github.com/mitchellh/mapstructure"
	"github.com/spf13/cobra"
)

var _ core.PluginMeta = (*Dbt)(nil)
var _ core.PluginTask = (*Dbt)(nil)

type Dbt struct{}

func (plugin Dbt) Description() string {
	return "Convert data by dbt"
}

func (plugin Dbt) SubTaskMetas() []core.SubTaskMeta {
	return []core.SubTaskMeta{
		tasks.DbtConverterMeta,
	}
}

func (plugin Dbt) PrepareTaskData(_ core.TaskContext, options map[string]interface{}) (interface{}, error) {
	var op tasks.DbtOptions
	err := mapstructure.Decode(options, &op)
	if err != nil {
		return nil, err
	}
	if op.ProjectPath == "" {
		return nil, fmt.Errorf("projectPath is required for dbt plugin")
	}
	if op.ProjectName == "" {
		return nil, fmt.Errorf("projectName is required for dbt plugin")
	}
	if op.ProjectTarget == "" {
		op.ProjectTarget = "dev"
	}
	if op.SelectedModels == nil {
		return nil, fmt.Errorf("selectedModels is required for dbt plugin")
	}

	return &tasks.DbtTaskData{
		Options: &op,
	}, nil
}

func (plugin Dbt) RootPkgPath() string {
	return "github.com/merico-dev/lake/plugins/dbt"
}

var PluginEntry Dbt

// standalone mode for debugging
func main() {
	dbtCmd := &cobra.Command{Use: "dbt"}
	_ = dbtCmd.MarkFlagRequired("projectPath")
	projectPath := dbtCmd.Flags().StringP("projectPath", "p", "/Users/abeizn/demoapp", "user dbt project directory.")

	_ = dbtCmd.MarkFlagRequired("projectName")
	projectName := dbtCmd.Flags().StringP("projectName", "n", "demoapp", "user dbt project name.")

	projectTarget := dbtCmd.Flags().StringP("projectTarget", "o", "dev", "this is the default target your dbt project will use.")

	_ = dbtCmd.MarkFlagRequired("selectedModels")
	modelsSlice := []string{"my_first_dbt_model", "my_second_dbt_model"}
	selectedModels := dbtCmd.Flags().StringSliceP("models", "m", modelsSlice, "dbt select models")

	projectVars := make(map[string]string)
	projectVars["event_min_id"] = "7581"
	projectVars["event_max_id"] = "7582"
	dbtCmd.Flags().StringToStringVarP(&projectVars, "projectVars", "v", projectVars, "dbt provides variables to provide data to models for compilation.")

	dbtCmd.Run = func(cmd *cobra.Command, args []string) {
		projectVarsConvert := make(map[string]interface{}, len(projectVars))
		for k, v := range projectVars {
			projectVarsConvert[k] = v
		}
		runner.DirectRun(cmd, args, PluginEntry, map[string]interface{}{
			"projectPath":    *projectPath,
			"projectName":    *projectName,
			"projectTarget":  *projectTarget,
			"selectedModels": *selectedModels,
			"projectVars":    projectVarsConvert,
		})
	}
	runner.RunCmd(dbtCmd)
}
