package main

import (
	"github.com/merico-dev/lake/migration"
	"github.com/merico-dev/lake/plugins/core"
	"github.com/merico-dev/lake/plugins/feishu/models/migrationscripts"
	"github.com/merico-dev/lake/plugins/feishu/tasks"
	"github.com/merico-dev/lake/runner"
	"github.com/mitchellh/mapstructure"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

var _ core.PluginMeta = (*Feishu)(nil)
var _ core.PluginInit = (*Feishu)(nil)
var _ core.PluginTask = (*Feishu)(nil)
var _ core.PluginApi = (*Feishu)(nil)
var _ core.Migratable = (*Feishu)(nil)

type Feishu struct{}

func (plugin Feishu) Init(_ *viper.Viper, _ core.Logger, _ *gorm.DB) error {
	return nil
}

func (plugin Feishu) Description() string {
	return "To collect and enrich data from Feishu"
}

func (plugin Feishu) SubTaskMetas() []core.SubTaskMeta {
	return []core.SubTaskMeta{
		tasks.CollectMeetingTopUserItemMeta,
		tasks.ExtractMeetingTopUserItemMeta,
	}
}

func (plugin Feishu) PrepareTaskData(taskCtx core.TaskContext, options map[string]interface{}) (interface{}, error) {
	var op tasks.FeishuOptions
	err := mapstructure.Decode(options, &op)
	if err != nil {
		return nil, err
	}
	apiClient, err := tasks.NewFeishuApiClient(taskCtx)
	if err != nil {
		return nil, err
	}
	return &tasks.FeishuTaskData{
		Options:   &op,
		ApiClient: apiClient,
	}, nil
}

func (plugin Feishu) RootPkgPath() string {
	return "github.com/merico-dev/lake/plugins/feishu"
}

func (plugin Feishu) MigrationScripts() []migration.Script {
	return []migration.Script{new(migrationscripts.InitSchemas)}
}

func (plugin Feishu) ApiResources() map[string]map[string]core.ApiResourceHandler {
	return map[string]map[string]core.ApiResourceHandler{}
}

var PluginEntry Feishu

// standalone mode for debugging
func main() {
	feishuCmd := &cobra.Command{Use: "feishu"}
	numOfDaysToCollect := feishuCmd.Flags().IntP("numOfDaysToCollect", "n", 8, "feishu collect days")
	_ = feishuCmd.MarkFlagRequired("numOfDaysToCollect")
	feishuCmd.Run = func(cmd *cobra.Command, args []string) {
		runner.DirectRun(cmd, args, PluginEntry, map[string]interface{}{
			"numOfDaysToCollect": *numOfDaysToCollect,
		})
	}
	runner.RunCmd(feishuCmd)
}
